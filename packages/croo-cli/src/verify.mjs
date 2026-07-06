// Shared verify logic for croo-cli. Mirrors src/lib/crooVerify.ts.
// Real work: CROO /agents/{id}, plus EVM eth_call ownerOf() and eth_getCode.

const CROO_BASE = process.env.CROO_API_URL || "https://api.croo.network";
const OWNER_OF = "0x6352211e";

async function fetchAgent(sdkKey, agentId) {
  const res = await fetch(
    `${CROO_BASE}/backend/v1/agents/${encodeURIComponent(agentId)}`,
    { headers: { "X-SDK-Key": sdkKey } },
  );
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      raw: parsed,
      error:
        parsed?.reason ||
        parsed?.message ||
        parsed?.error ||
        `HTTP ${res.status}`,
    };
  }
  return { ok: true, status: res.status, raw: parsed, extracted: extract(parsed) };
}

function extract(rec) {
  if (!rec || typeof rec !== "object") return {};
  const src = rec.data ?? rec.agent ?? rec;
  const pick = (...keys) => {
    for (const k of keys) {
      const v = src[k];
      if (typeof v === "string" && v.length) return v;
    }
    return null;
  };
  return {
    did: pick("did", "agent_did", "agentDid", "id", "agent_id"),
    tokenId: pick("token_id", "tokenId", "nft_token_id", "nftTokenId"),
    vault: pick(
      "wallet_address",
      "walletAddress",
      "vault_address",
      "vaultAddress",
      "aa_wallet",
      "aaWallet",
    ),
    owner: pick(
      "owner_address",
      "ownerAddress",
      "owner",
      "eoa_address",
      "eoaAddress",
    ),
    chainId:
      typeof src.chain_id === "number"
        ? src.chain_id
        : typeof src.chainId === "number"
          ? src.chainId
          : null,
  };
}

async function ethCall(rpc, to, data) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "eth_call failed");
  return body.result;
}

async function ethGetCode(rpc, address) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getCode",
      params: [address, "latest"],
    }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "eth_getCode failed");
  return body.result;
}

function toTokenIdHex(id) {
  let n;
  try {
    n = id.startsWith("0x") ? BigInt(id) : BigInt(id.replace(/[^0-9]/g, "") || "0");
  } catch {
    return "0".repeat(64);
  }
  return n.toString(16).padStart(64, "0");
}

function unpadAddress(hex) {
  if (!hex || hex === "0x") return null;
  const clean = hex.replace(/^0x/, "").padStart(64, "0");
  const addr = "0x" + clean.slice(-40);
  if (/^0x0{40}$/.test(addr)) return null;
  return addr.toLowerCase();
}

const isAddress = (s) => typeof s === "string" && /^0x[0-9a-fA-F]{40}$/.test(s);

export async function verifyAgent({
  sdkKey,
  agentId,
  claimedOperator,
  didContract,
  chains,
}) {
  const rpcs = chains?.length
    ? chains
    : [{ name: "base", url: "https://mainnet.base.org" }];

  const evidence = {
    input: {
      agentId,
      claimedOperator: claimedOperator?.toLowerCase(),
      didContract: didContract?.toLowerCase(),
      chains: rpcs.map((c) => c.name),
    },
    agentRecord: { ok: false },
    chainChecks: [],
    matches: { addresses: [], unique: [], matchesClaimed: [], conflictsClaimed: [] },
    verdict: { level: "inconclusive", label: "inconclusive", reasons: [] },
    fetchedAt: new Date().toISOString(),
  };

  const agent = await fetchAgent(sdkKey, agentId);
  evidence.agentRecord = agent;
  const ex = agent.ok ? agent.extracted : undefined;
  const vault = ex?.vault ?? null;
  const owner = ex?.owner ?? null;
  const tokenIdRaw = ex?.tokenId ?? ex?.did ?? agentId;

  for (const chain of rpcs) {
    const check = { chain: chain.name, rpc: chain.url };
    if (didContract && tokenIdRaw) {
      try {
        const raw = await ethCall(
          chain.url,
          didContract,
          OWNER_OF + toTokenIdHex(tokenIdRaw),
        );
        check.didOwnerOf = {
          contract: didContract.toLowerCase(),
          tokenId: tokenIdRaw,
          owner: unpadAddress(raw),
        };
      } catch (e) {
        check.didOwnerOf = {
          contract: didContract.toLowerCase(),
          tokenId: tokenIdRaw,
          error: e.message,
        };
      }
    }
    if (isAddress(vault)) {
      try {
        const code = await ethGetCode(chain.url, vault);
        check.vaultCode = {
          address: vault.toLowerCase(),
          hasCode: !!code && code !== "0x",
        };
      } catch (e) {
        check.vaultCode = { address: vault.toLowerCase(), error: e.message };
      }
    }
    evidence.chainChecks.push(check);
  }

  const addrs = [];
  if (isAddress(owner)) addrs.push(owner.toLowerCase());
  if (isAddress(vault)) addrs.push(vault.toLowerCase());
  for (const c of evidence.chainChecks) {
    if (isAddress(c.didOwnerOf?.owner)) addrs.push(c.didOwnerOf.owner);
  }
  evidence.matches.addresses = addrs;
  evidence.matches.unique = [...new Set(addrs)];

  const claimed = evidence.input.claimedOperator;
  if (claimed && isAddress(claimed)) {
    const matches = [], conflicts = [];
    if (isAddress(owner))
      (owner.toLowerCase() === claimed ? matches : conflicts).push(
        `agent_record.owner=${owner.toLowerCase()}`,
      );
    if (isAddress(vault))
      (vault.toLowerCase() === claimed ? matches : conflicts).push(
        `agent_record.vault=${vault.toLowerCase()}`,
      );
    for (const c of evidence.chainChecks) {
      const o = c.didOwnerOf?.owner;
      if (isAddress(o))
        (o === claimed ? matches : conflicts).push(`${c.chain}.didOwnerOf=${o}`);
    }
    evidence.matches.matchesClaimed = matches;
    evidence.matches.conflictsClaimed = conflicts;
  }

  evidence.verdict = decide(evidence);
  return evidence;
}

function decide(e) {
  const reasons = [];
  if (!e.agentRecord.ok) {
    return {
      level: "inconclusive",
      label: "agent record unavailable",
      reasons: [
        `CROO /agents/{id} returned ${e.agentRecord.status ?? "?"}: ${e.agentRecord.error ?? "no data"}`,
      ],
    };
  }
  const onChainOwners = e.chainChecks
    .map((c) => c.didOwnerOf?.owner)
    .filter(Boolean);
  const claimed = e.input.claimedOperator;
  if (claimed) {
    if (e.matches.conflictsClaimed.length > 0) {
      return {
        level: "spoof_risk",
        label: "claimed operator does not match on-chain identity",
        reasons: [
          `claimed=${claimed}`,
          ...e.matches.conflictsClaimed.map((c) => `mismatch: ${c}`),
          ...e.matches.matchesClaimed.map((c) => `match:    ${c}`),
        ],
      };
    }
    if (e.matches.matchesClaimed.length > 0) {
      reasons.push(
        `claimed operator confirmed by ${e.matches.matchesClaimed.length} source(s)`,
        ...e.matches.matchesClaimed.map((c) => `match: ${c}`),
      );
    } else {
      reasons.push(
        `no on-chain evidence found to match claimed=${claimed}; pass --did-contract=0x... for a strict check`,
      );
    }
  }
  if (e.matches.unique.length > 1) {
    reasons.push(
      `identities span ${e.matches.unique.length} distinct addresses: ${e.matches.unique.join(", ")}`,
    );
    return {
      level: "warning",
      label: "identity spans multiple addresses",
      reasons,
    };
  }
  if (onChainOwners.length === 0 && !e.input.didContract) {
    reasons.push(
      "no on-chain ownerOf check performed — pass --did-contract=0x... for cross-chain verification",
    );
    return {
      level: claimed ? "clean" : "inconclusive",
      label: claimed ? "off-chain claim consistent (no on-chain check)" : "off-chain record only",
      reasons,
    };
  }
  return {
    level: "clean",
    label: "identity consistent across all sources",
    reasons: reasons.length ? reasons : ["all discovered addresses collapse to a single operator"],
  };
}
