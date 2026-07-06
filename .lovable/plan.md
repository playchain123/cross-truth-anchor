## Cross-Chain Identity Resolver — Landing Page

Note: `hermes-agent.nousresearch.com` failed to load for me (blank error page), so I'll match the general Nous Research aesthetic: pure black background, monospace type, minimal geometric ornament, terminal/research-paper feel, single accent color. If you have screenshots of Hermes, drop them in and I'll match tighter.

### Product framing on the page
- **Name:** Verithread (working) — Cross-Chain Identity Resolver for CAP
- **One-liner:** Prove the operator behind a CAP agent is the same entity across chains. Stop Sybil agents before they get hired.
- **Positioning:** Provenance layer for the CROO agent economy.

### Page structure (single route: `/`)

1. **Top nav** — small wordmark left; links (Protocol, Docs, Registry, GitHub) middle; **Connect Wallet** button right.
2. **Hero** — oversized monospace headline, sub-headline, two CTAs ("Resolve an Agent", "Read the Spec"), subtle animated grid / ASCII motif in background. Small "Built for CROO / CAP-compatible" badge.
3. **How it works** — 3-step diagram: Challenge → Sign (ENS + CAP DID) → Attestation on TBA. Mono text, thin borders, no gradients.
4. **What it verifies** — grid of 4 cards: EVM wallet history, ENS ownership, CAP DID controller, Sybil heuristics.
5. **Live sample attestation** — mock JSON block styled like a terminal window (address, confidence score, signatures, timestamp).
6. **For buyers / For agents** — two-column value prop (buyers get trust filter; agents get portable reputation).
7. **Stats strip** — Agents resolved, Sybils flagged, Attestations issued (placeholders).
8. **Footer** — Croo Hackathon 2026 mention, socials, docs.

### Design system
- Background `#000`, foreground near-white `#EDEDED`, muted gray `#8A8A8A`, single accent (electric lime `#C6FF3D` or terminal green `#7CFF6B` — pick one).
- Fonts via `<link>` in `__root.tsx`: **JetBrains Mono** for display + UI, **Inter** for long body text only.
- Thin 1px borders, no rounded corners beyond 4px, no drop shadows, no purple gradients.
- Tokens defined in `src/styles.css` (`@theme` for `--color-bg`, `--color-fg`, `--color-muted`, `--color-accent`, `--font-mono`, `--font-sans`). Also update `.dark` / `:root` shadcn tokens so Button/Card inherit the theme.

### Connect Wallet (functional)
- Install `wagmi`, `viem`, `@tanstack/react-query` (already present).
- `WagmiProvider` + injected connector (MetaMask / any EIP-1193 wallet) — no WalletConnect projectId needed, keeps it zero-config for the hackathon demo.
- Chains: mainnet + sepolia + base (CAP-relevant).
- Button states: **Connect Wallet** → **0x1234…abcd** (with ENS name if resolvable) → dropdown with Disconnect + Copy.
- Handles wallet-not-installed case with a friendly "Install MetaMask" link.
- Client-only: dynamic import inside the button so SSR doesn't touch `window.ethereum`.

### Files to create / edit
- `src/routes/__root.tsx` — real title/description/OG for the product, add Google Fonts `<link>` for JetBrains Mono + Inter, keep `<Outlet />`.
- `src/routes/index.tsx` — full landing composition.
- `src/styles.css` — black theme tokens, mono/sans font vars, override shadcn semantic tokens.
- `src/components/site/Nav.tsx`
- `src/components/site/Hero.tsx`
- `src/components/site/HowItWorks.tsx`
- `src/components/site/Verifies.tsx`
- `src/components/site/AttestationSample.tsx`
- `src/components/site/BuyersAgents.tsx`
- `src/components/site/Stats.tsx`
- `src/components/site/Footer.tsx`
- `src/components/wallet/WagmiProvider.tsx` — client-only wagmi config + QueryClient bridge.
- `src/components/wallet/ConnectWallet.tsx` — button + address dropdown, ENS lookup.
- `bun add wagmi viem` (react-query already installed).

### Out of scope for this pass
- No real CAP SDK calls, no on-chain attestation writes yet (sample is mocked).
- No separate routes (Docs / Registry) — nav links scroll to sections or are stubbed `#`.
- No dashboard.

Confirm and I'll build it.
