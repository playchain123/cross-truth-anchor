// Shared DID / cross-chain operator resolver.
// Used by the /console Verify tab (via a server function) AND by croo-cli.
//
// What it does — real, no mocks:
//   1. Resolves the agent record from CROO backend: GET /backend/v1/agents/{id}
//   2. Extracts identity fields: did, wallet/vault address, owner address, chain id
//   3. For each configured EVM RPC (default: Base mainnet), asks the chain
//      directly:
//        - ownerOf(tokenId) on the ERC-8004 DID NFT contract (if provided)
//        - eth_getCode(vault) to prove the AA wallet exists on that chain
//   4. Cross-checks all discovered addresses against a claimed operator
//      (--claimed) and returns a verdict:
//        clean       — all identities collapse to the same address
//        inconclusive — not enough data to decide
//        warning     — partial mismatch (e.g. missing on-chain data)
//        spoof_risk  — hard mismatch between claimed operator and on-chain owner

export type ChainRpc = { name: string; url: string; chainId?: number };

export type VerifyInput = {
  sdkKey: string;
  agentId: string; // agent id, DID string, or NFT token id
  claimedOperator?: string; // 0x address the caller claims controls this agent
  didContract?: string; // 0x address of the ERC-8004 DID NFT on Base
  chains?: ChainRpc[]; // extra RPCs for cross-chain check
};

export type Evidence = {
  input: {
    agentId: string;
    claimedOperator?: string;
    didContract?: string;
    chains: string[];
  };
  agentRecord: {
    ok: boolean;
    status?: number;
    raw?: unknown;
    error?: string;
    extracted?: {
      did?: string | null;
      tokenId?: string | null;
      vault?: string | null;
      owner?: string | null;
      chainId?: number | null;
    };
  };
  chainChecks: Array<{
    chain: string;
    rpc: string;
    didOwnerOf?: {
      contract?: string;
      tokenId?: string;
      owner?: string | null;
      error?: string;
    };
    vaultCode?: {
      address?: string;
      hasCode?: boolean;
      error?: string;
    };
  }>;
  matches: {
    /** All non-empty addresses discovered, lowercased. */
    addresses: string[];
    /** Distinct addresses. */
    unique: string[];
    /** All entities that resolve to the same address as claimedOperator. */
    matchesClaimed: string[];
    /** Entities whose address differs from claimedOperator. */
    conflictsClaimed: string[];
  };
  verdict: {
    level: "clean" | "inconclusive" | "warning" | "spoof_risk";
    label: string;
    reasons: string[];
  };
  fetchedAt: string;
};

const CROO_BASE = "https://api.croo.network/backend/v1";

const DEFAULT_CHAINS: ChainRpc[] = [
  { name: "base", url: "https://mainnet.base.org", chainId: 8453 },
];

/** Fetch the agent record. Returns raw JSON + best-effort extracted fields. */
async function fetchAgent(sdkKey: string, agentId: string) {
  const res = await fetch(`${CROO_BASE}/agents/${encodeURIComponent(agentId)}`, {
    method: "GET",
    headers: { "X-SDK-Key": sdkKey },
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      raw: parsed,
      error:
        parsed?.reason ||
        parsed?.message ||
        parsed?.error ||
        `HTTP ${res.status}`,
    };
  }
  return {
    ok: true as const,
    status: res.status,
    raw: parsed,
    extracted: extractIdentity(parsed),
  };
}

function extractIdentity(rec: any) {
  if (!rec || typeof rec !== "object") return {};
  // Try many likely field names — CROO's schema varies by endpoint version.
  const src = rec.data ?? rec.agent ?? rec;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = src[k];
      if (typeof v === "string" && v.length) return v;
    }
    return null;
  };
  const chainId =
    typeof src.chain_id === "number"
      ? src.chain_id
      : typeof src.chainId === "number"
        ? src.chainId
        : null;
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
    chainId,
  };
}

async function ethCall(rpc: string, to: string, data: string) {
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
  return body.result as string;
}

async function ethGetCode(rpc: string, address: string) {
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
  return body.result as string;
}

// ERC-721 ownerOf(uint256) selector.
const OWNER_OF = "0x6352211e";

function toTokenIdHex(tokenId: string): string {
  // Accept decimal or 0x-prefixed hex.
  let n: bigint;
  try {
    n = tokenId.startsWith("0x")
      ? BigInt(tokenId)
      : BigInt(tokenId.replace(/[^0-9]/g, "") || "0");
  } catch {
    return "0".repeat(64);
  }
  return n.toString(16).padStart(64, "0");
}

function unpadAddress(hex: string): string | null {
  if (!hex || hex === "0x") return null;
  const clean = hex.replace(/^0x/, "").padStart(64, "0");
  const addr = "0x" + clean.slice(-40);
  if (/^0x0{40}$/.test(addr)) return null;
  return addr.toLowerCase();
}

function isAddress(s: string | null | undefined): s is string {
  return typeof s === "string" && /^0x[0-9a-fA-F]{40}$/.test(s);
}

export async function verifyAgent(input: VerifyInput): Promise<Evidence> {
  const chains = input.chains?.length ? input.chains : DEFAULT_CHAINS;
  const evidence: Evidence = {
    input: {
      agentId: input.agentId,
      claimedOperator: input.claimedOperator?.toLowerCase(),
      didContract: input.didContract?.toLowerCase(),
      chains: chains.map((c) => c.name),
    },
    agentRecord: { ok: false },
    chainChecks: [],
    matches: {
      addresses: [],
      unique: [],
      matchesClaimed: [],
      conflictsClaimed: [],
    },
    verdict: { level: "inconclusive", label: "inconclusive", reasons: [] },
    fetchedAt: new Date().toISOString(),
  };

  // 1. Off-chain: CROO agent record
  const agent = await fetchAgent(input.sdkKey, input.agentId);
  evidence.agentRecord = agent;

  const extracted = agent.ok ? agent.extracted : undefined;
  const vault = extracted?.vault ?? null;
  const owner = extracted?.owner ?? null;
  const tokenIdRaw = extracted?.tokenId ?? extracted?.did ?? input.agentId;

  // 2. On-chain checks per configured RPC
  for (const chain of chains) {
    const check: Evidence["chainChecks"][number] = {
      chain: chain.name,
      rpc: chain.url,
    };

    // DID ownerOf
    if (input.didContract && tokenIdRaw) {
      const tokenHex = toTokenIdHex(tokenIdRaw);
      try {
        const raw = await ethCall(
          chain.url,
          input.didContract,
          OWNER_OF + tokenHex,
        );
        check.didOwnerOf = {
          contract: input.didContract.toLowerCase(),
          tokenId: tokenIdRaw,
          owner: unpadAddress(raw),
        };
      } catch (e) {
        check.didOwnerOf = {
          contract: input.didContract.toLowerCase(),
          tokenId: tokenIdRaw,
          error: (e as Error).message,
        };
      }
    }

    // Vault code presence
    if (isAddress(vault)) {
      try {
        const code = await ethGetCode(chain.url, vault);
        check.vaultCode = {
          address: vault.toLowerCase(),
          hasCode: !!code && code !== "0x",
        };
      } catch (e) {
        check.vaultCode = {
          address: vault.toLowerCase(),
          error: (e as Error).message,
        };
      }
    }

    evidence.chainChecks.push(check);
  }

  // 3. Reconcile addresses
  const addrs: string[] = [];
  if (isAddress(owner)) addrs.push(owner.toLowerCase());
  if (isAddress(vault)) addrs.push(vault.toLowerCase());
  for (const c of evidence.chainChecks) {
    if (isAddress(c.didOwnerOf?.owner)) addrs.push(c.didOwnerOf!.owner!);
  }
  const unique = Array.from(new Set(addrs));
  evidence.matches.addresses = addrs;
  evidence.matches.unique = unique;

  const claimed = evidence.input.claimedOperator;
  if (claimed && isAddress(claimed)) {
    const matches: string[] = [];
    const conflicts: string[] = [];
    if (isAddress(owner)) {
      (owner.toLowerCase() === claimed ? matches : conflicts).push(
        `agent_record.owner=${owner.toLowerCase()}`,
      );
    }
    if (isAddress(vault)) {
      (vault.toLowerCase() === claimed ? matches : conflicts).push(
        `agent_record.vault=${vault.toLowerCase()}`,
      );
    }
    for (const c of evidence.chainChecks) {
      const o = c.didOwnerOf?.owner;
      if (isAddress(o)) {
        (o === claimed ? matches : conflicts).push(
          `${c.chain}.didOwnerOf=${o}`,
        );
      }
    }
    evidence.matches.matchesClaimed = matches;
    evidence.matches.conflictsClaimed = conflicts;
  }

  // 4. Verdict
  evidence.verdict = decide(evidence);
  return evidence;
}

function decide(e: Evidence): Evidence["verdict"] {
  const reasons: string[] = [];

  if (!e.agentRecord.ok) {
    return {
      level: "inconclusive",
      label: "agent record unavailable",
      reasons: [
        `CROO /agents/{id} returned ${e.agentRecord.status ?? "?"}: ${
          e.agentRecord.error ?? "no data"
        }`,
      ],
    };
  }

  const onChainOwners = e.chainChecks
    .map((c) => c.didOwnerOf?.owner)
    .filter((x): x is string => !!x);

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
        `no on-chain evidence found to match claimed=${claimed}; provide --did-contract for a strict check`,
      );
    }
  }

  // Cross-source consistency
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
      label: claimed
        ? "off-chain claim consistent (no on-chain check)"
        : "off-chain record only",
      reasons,
    };
  }

  return {
    level: "clean",
    label: "identity consistent across all sources",
    reasons: reasons.length ? reasons : ["all discovered addresses collapse to a single operator"],
  };
}
