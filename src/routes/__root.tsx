import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { WalletProvider } from "../components/wallet/WalletProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          err_404
        </div>
        <h1 className="mt-4 text-6xl font-bold text-foreground">not_found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          No route matches this path.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-border bg-signal px-4 py-2 text-sm font-medium text-signal-foreground transition-colors hover:opacity-90"
          >
            → return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-destructive">
          runtime_error
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Something halted the resolver.
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center border border-border bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90"
          >
            retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Verithread — Cross-Chain Identity Resolver for CAP" },
      {
        name: "description",
        content:
          "Provenance layer for the CROO agent economy. Prove the operator behind a CAP agent is the same entity across chains — and stop Sybil agents before they get hired.",
      },
      { name: "author", content: "Verithread" },
      {
        property: "og:title",
        content: "Verithread — Cross-Chain Identity Resolver for CAP",
      },
      {
        property: "og:description",
        content:
          "Prove the operator behind a CAP agent across chains. Stop Sybil agents before they get hired.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Outlet />
      </WalletProvider>
    </QueryClientProvider>
  );
}
