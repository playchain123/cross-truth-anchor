import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
  useChainId,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { Copy, LogOut, Wallet } from "lucide-react";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: !!address },
  });

  if (!mounted) {
    return (
      <button className="border border-border bg-signal px-4 py-2 text-xs font-semibold uppercase tracking-widest text-signal-foreground">
        connect wallet
      </button>
    );
  }

  if (!isConnected || !address) {
    const injectedConnector =
      connectors.find((c) => c.id === "injected") ?? connectors[0];
    const hasWallet =
      typeof window !== "undefined" &&
      typeof (window as any).ethereum !== "undefined";

    return (
      <div className="relative">
        <button
          onClick={() => {
            if (!hasWallet) {
              window.open("https://metamask.io/download/", "_blank");
              return;
            }
            if (injectedConnector) connect({ connector: injectedConnector });
          }}
          disabled={isPending}
          className="inline-flex items-center gap-2 border border-border bg-signal px-4 py-2 text-xs font-semibold uppercase tracking-widest text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Wallet className="h-3.5 w-3.5" />
          {isPending ? "connecting…" : hasWallet ? "connect wallet" : "install wallet"}
        </button>
        {error ? (
          <div className="absolute right-0 top-full mt-2 max-w-[240px] border border-destructive bg-card p-2 text-[10px] text-destructive">
            {error.message}
          </div>
        ) : null}
      </div>
    );
  }

  const label = ensName ?? short(address);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-border bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
      >
        <span className="h-2 w-2 rounded-full bg-signal" />
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 border border-border bg-card p-2 text-xs shadow-2xl">
          <div className="border-b border-border px-2 py-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              address
            </div>
            <div className="mt-1 break-all font-mono text-foreground">
              {address}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              chain_id · {chainId}
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
              setOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-2 px-2 py-2 text-left uppercase tracking-widest text-foreground hover:bg-secondary"
          >
            <Copy className="h-3 w-3" /> copy
          </button>
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-2 py-2 text-left uppercase tracking-widest text-destructive hover:bg-secondary"
          >
            <LogOut className="h-3 w-3" /> disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
