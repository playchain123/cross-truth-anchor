import { createServerFn } from "@tanstack/react-start";
import { verifyAgent, type ChainRpc } from "./crooVerify";

// Direct fetch to CROO API — extracted from the official SDK
// Base: https://api.croo.network, Auth header: X-SDK-Key: croo_sk_...
const CROO_BASE = "https://api.croo.network/backend/v1";

type Method = "GET" | "POST";

async function crooFetch<T>(
  sdkKey: string,
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!sdkKey || !sdkKey.startsWith("croo_sk_")) {
    throw new Error("Invalid SDK key. Expected format: croo_sk_...");
  }
  const res = await fetch(`${CROO_BASE}${path}`, {
    method,
    headers: {
      "X-SDK-Key": sdkKey,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const message =
      parsed?.reason || parsed?.message || parsed?.error || `HTTP ${res.status}`;
    throw new Error(`CROO: ${message} (${res.status})`);
  }
  return parsed as T;
}

type KeyInput = { sdkKey: string };

export const crooListNegotiations = createServerFn({ method: "POST" })
  .inputValidator(
    (d: KeyInput & { role?: string; status?: string; pageSize?: number }) => d,
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    params.set("role", data.role || "buyer");
    if (data.status) params.set("status", data.status);
    params.set("page", "1");
    params.set("page_size", String(data.pageSize ?? 20));
    return crooFetch<any>(
      data.sdkKey,
      "GET",
      `/orders/negotiate?${params.toString()}`,
    );
  });

export const crooListOrders = createServerFn({ method: "POST" })
  .inputValidator(
    (d: KeyInput & { role?: string; status?: string; pageSize?: number }) => d,
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    params.set("role", data.role || "buyer");
    if (data.status) params.set("status", data.status);
    params.set("page", "1");
    params.set("page_size", String(data.pageSize ?? 20));
    return crooFetch<any>(
      data.sdkKey,
      "GET",
      `/orders?${params.toString()}`,
    );
  });

export const crooGetOrder = createServerFn({ method: "POST" })
  .inputValidator((d: KeyInput & { orderId: string }) => d)
  .handler(async ({ data }) =>
    crooFetch<any>(data.sdkKey, "GET", `/orders/${data.orderId}`),
  );

export const crooGetDelivery = createServerFn({ method: "POST" })
  .inputValidator((d: KeyInput & { orderId: string }) => d)
  .handler(async ({ data }) =>
    crooFetch<any>(
      data.sdkKey,
      "GET",
      `/orders/${data.orderId}/delivery`,
    ),
  );

export const crooNegotiate = createServerFn({ method: "POST" })
  .inputValidator(
    (d: KeyInput & {
      serviceId: string;
      requirements?: string;
      metadata?: string;
    }) => d,
  )
  .handler(async ({ data }) =>
    crooFetch<any>(data.sdkKey, "POST", "/orders/negotiate", {
      service_id: data.serviceId,
      requirements: data.requirements ?? "",
      metadata: data.metadata ?? "",
    }),
  );

export const crooAcceptNegotiation = createServerFn({ method: "POST" })
  .inputValidator((d: KeyInput & { negotiationId: string }) => d)
  .handler(async ({ data }) =>
    crooFetch<any>(
      data.sdkKey,
      "POST",
      `/orders/negotiate/${data.negotiationId}/accept`,
    ),
  );

export const crooPayOrder = createServerFn({ method: "POST" })
  .inputValidator((d: KeyInput & { orderId: string }) => d)
  .handler(async ({ data }) =>
    crooFetch<any>(data.sdkKey, "POST", `/orders/${data.orderId}/pay`),
  );

export const crooDeliverOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: KeyInput & {
      orderId: string;
      deliverableType: "text" | "schema";
      deliverableText?: string;
      deliverableSchema?: string;
    }) => d,
  )
  .handler(async ({ data }) =>
    crooFetch<any>(
      data.sdkKey,
      "POST",
      `/orders/${data.orderId}/deliver`,
      {
        deliverable_type: data.deliverableType,
        deliverable_text: data.deliverableText ?? "",
        deliverable_schema: data.deliverableSchema ?? "",
      },
    ),
  );

export const crooRejectOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: KeyInput & { orderId: string; reason: string }) => d,
  )
  .handler(async ({ data }) =>
    crooFetch<any>(
      data.sdkKey,
      "POST",
      `/orders/${data.orderId}/reject`,
      { reason: data.reason },
    ),
  );

/** Cheap health check — hits /orders with the key. Any 2xx or 4xx means the endpoint is reachable; only auth failure tells us the key is bad. */
export const crooTestKey = createServerFn({ method: "POST" })
  .inputValidator((d: KeyInput) => d)
  .handler(async ({ data }) => {
    try {
      await crooFetch<any>(data.sdkKey, "GET", "/orders?role=buyer&page=1&page_size=1");
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });

/**
 * Resolve an Agent DID / id, cross-check the ERC-8004 owner on chain,
 * check the AA vault exists, compare with the caller's claimed operator,
 * and return the full evidence JSON + spoofing verdict.
 */
export const crooVerifyAgent = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      sdkKey: string;
      agentId: string;
      claimedOperator?: string;
      didContract?: string;
      chains?: ChainRpc[];
    }) => d,
  )
  .handler(async ({ data }) => verifyAgent(data));
