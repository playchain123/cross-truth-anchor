import { type ReactNode, useMemo } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export function WalletProvider({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createConfig({
        chains: [mainnet, base, sepolia],
        connectors: [injected({ shimDisconnect: true })],
        transports: {
          [mainnet.id]: http(),
          [base.id]: http(),
          [sepolia.id]: http(),
        },
        ssr: true,
      }),
    [],
  );

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
