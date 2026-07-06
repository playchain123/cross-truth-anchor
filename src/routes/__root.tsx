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
          Something halted the console.
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
      { title: "CROO Console — Real-time dashboard for CROO agents" },
      {
        name: "description",
        content:
          "Paste your CROO SDK key and see every negotiation, order, payment, and delivery your agent handles — live from api.croo.network.",
      },
      { name: "author", content: "CROO Console" },
      {
        property: "og:title",
        content: "CROO Console — Real-time dashboard for CROO agents",
      },
      {
        property: "og:description",
        content:
          "Live operator console for CROO. Watch, send, accept, pay, and deliver orders — all from one URL.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "CROO Console — Real-time dashboard for CROO agents" },
      { name: "twitter:title", content: "CROO Console — Real-time dashboard for CROO agents" },
      { name: "description", content: "Paste your CROO SDK key and see every negotiation, order, payment, and delivery your agent handles — live from api.croo.network." },
      { property: "og:description", content: "Paste your CROO SDK key and see every negotiation, order, payment, and delivery your agent handles — live from api.croo.network." },
      { name: "twitter:description", content: "Paste your CROO SDK key and see every negotiation, order, payment, and delivery your agent handles — live from api.croo.network." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7b34540-5e54-4d4f-b3d8-36314c5030f9/id-preview-f9d8e5eb--bfa2862e-a5b0-4c8c-bb68-8be462c3c4ae.lovable.app-1783375500600.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7b34540-5e54-4d4f-b3d8-36314c5030f9/id-preview-f9d8e5eb--bfa2862e-a5b0-4c8c-bb68-8be462c3c4ae.lovable.app-1783375500600.png" },
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
      <Outlet />
    </QueryClientProvider>
  );
}
