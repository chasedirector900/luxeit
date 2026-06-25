import type { Product } from "@/types/product";

// Thin client for the Django passwordless-auth API.
//
// All requests send credentials (the httpOnly `luxeit_session` cookie set by
// Django). Frontend and backend are same-site in dev (both localhost), so the
// session cookie is shared across ports. Unsafe authenticated requests (logout)
// carry the CSRF token that Django's SessionAuthentication requires.

// Empty = same-origin: requests go to /api/* on this app's own origin and are
// proxied to Django by next.config rewrites. This keeps everything same-origin
// (no CORS, no mixed content, cookies work) even over a tunnel / on a phone.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export type ApiAddress = { line1: string; city: string; area: string };

export type ApiUser = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  address: ApiAddress | null;
  date_joined: string;
};

export type RequestCodeResult = {
  channel: "email" | "phone";
  destination: string;
  dev_code?: string; // present only in local dev (console delivery)
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<{ status: number; data: T | null }> {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // DRF's SessionAuthentication enforces CSRF on ANY write that carries a session
  // cookie — including the public auth endpoints — so attach the token on every
  // non-GET request (fetching it first if we don't have it yet).
  if (method !== "GET") {
    await ensureCsrf();
    const token = readCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: T | null = null;
  if (res.status !== 204) {
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }
  }
  return { status: res.status, data };
}

function detail(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail?: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

/** Returns the current user, or null if the session is missing/expired. */
export async function fetchMe(): Promise<ApiUser | null> {
  const { status, data } = await apiFetch<ApiUser>("/api/auth/me");
  if (status === 200) return data;
  if (status === 401 || status === 403) return null;
  throw new ApiError(detail(data, "Could not load your session."), status);
}

/** Sends a one-time code to the given email or phone. */
export async function requestCode(identifier: string): Promise<RequestCodeResult> {
  const { status, data } = await apiFetch<RequestCodeResult>("/api/auth/request-code", {
    method: "POST",
    body: { identifier },
  });
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't send the code. Try again."), status);
}

/** Verifies a code, starting a session and returning the user. */
export async function verifyCode(identifier: string, code: string): Promise<ApiUser> {
  const { status, data } = await apiFetch<ApiUser>("/api/auth/verify-code", {
    method: "POST",
    body: { identifier, code },
  });
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Invalid or expired code."), status);
}

/** Updates the signed-in user's editable profile fields (currently the name). */
export async function updateProfile(data: {
  fullName?: string;
  address?: ApiAddress | null;
}): Promise<ApiUser> {
  const body: Record<string, unknown> = {};
  if (data.fullName !== undefined) body.full_name = data.fullName;
  if (data.address !== undefined) body.address = data.address;
  const { status, data: user } = await apiFetch<ApiUser>("/api/auth/me", {
    method: "PATCH",
    body,
  });
  if (status === 200 && user) return user;
  throw new ApiError(detail(user, "Couldn't update your profile."), status);
}

/** Ensures the CSRF cookie exists so the next unsafe request can include it. */
export async function ensureCsrf(): Promise<void> {
  if (readCookie("csrftoken")) return;
  await apiFetch("/api/auth/csrf");
}

/** Ends the session on the server. */
export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

/** Permanently deletes the signed-in account. */
export async function deleteAccount(): Promise<void> {
  const { status, data } = await apiFetch("/api/auth/me", { method: "DELETE" });
  if (status !== 204 && status !== 200) {
    throw new ApiError(detail(data, "Couldn't delete your account."), status);
  }
}

// ── Signed-in devices ───────────────────────────────────────────────────────
export type DeviceSession = {
  id: number;
  deviceLabel: string;
  ip: string;
  lastSeen: string;
  createdAt: string;
  current: boolean;
};

export async function listSessions(): Promise<DeviceSession[]> {
  const { status, data } = await apiFetch<DeviceSession[]>("/api/auth/sessions");
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't load your devices."), status);
}

export async function revokeSession(id: number): Promise<void> {
  const { status, data } = await apiFetch(`/api/auth/sessions/${id}/revoke`, { method: "POST" });
  if (status !== 204 && status !== 200) {
    throw new ApiError(detail(data, "Couldn't log out that device."), status);
  }
}

export async function logoutOtherSessions(): Promise<void> {
  const { status, data } = await apiFetch("/api/auth/sessions/logout-others", { method: "POST" });
  if (status !== 204 && status !== 200) {
    throw new ApiError(detail(data, "Couldn't log out other devices."), status);
  }
}

// ── Inbox / messaging ───────────────────────────────────────────────────────
export type InboxMessage = {
  id: string;
  text: string;
  date: string; // "Today" / "Yesterday" / "Jun 12"
  time: string; // "14:15"
  read: boolean;
  sender: string; // luxeit | system | support | user
  fromUser: boolean;
  agentName?: string | null; // who at Luxeit replied (support messages only)
};

export type InboxThread = {
  id: string;
  slug: string;
  name: string;
  type: string; // promo | system | order | delivery | support
  canReply: boolean;
  unread: number;
  messages: InboxMessage[];
};

export async function listThreads(): Promise<InboxThread[]> {
  const { status, data } = await apiFetch<InboxThread[]>("/api/inbox/threads");
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't load your notifications."), status);
}

export async function sendThreadMessage(slug: string, body: string): Promise<InboxThread> {
  const { status, data } = await apiFetch<InboxThread>(`/api/inbox/threads/${slug}/messages`, {
    method: "POST",
    body: { body },
  });
  if ((status === 200 || status === 201) && data) return data;
  throw new ApiError(detail(data, "Couldn't send your message."), status);
}

export async function markThreadRead(slug: string): Promise<void> {
  await apiFetch(`/api/inbox/threads/${slug}/read`, { method: "POST" });
}

export async function markAllThreadsRead(): Promise<void> {
  await apiFetch("/api/inbox/read-all", { method: "POST" });
}

/** Fetch (and, for "support", auto-create) a single thread. */
export async function getThread(slug: string): Promise<InboxThread> {
  const { status, data } = await apiFetch<InboxThread>(`/api/inbox/threads/${slug}`);
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't open this conversation."), status);
}

// ── Product search (client-side, public) ────────────────────────────────────
/** Search the catalogue. Empty query returns a default list (for "recommended"). */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  const path = q ? `/api/products?q=${encodeURIComponent(q)}` : "/api/products";
  const { status, data } = await apiFetch<Product[]>(path);
  return status === 200 && data ? data : [];
}

// ── Orders ──────────────────────────────────────────────────────────────────
export type OrderApiItem = {
  title: string;
  image: string;
  quantity: number;
  price: number;
  warehouse?: string;
  shippingMethod?: string; // air | sea | local
  slug?: string;
  categorySlug?: string;
  reviewable?: boolean; // true on delivered orders for catalogue products
};

export type OrderApiShipment = {
  warehouse: string;
  carrier: string; // air | sea | local
  label: string; // "China Hub · Air"
  eta: string;
  subtotal: number;
  items: OrderApiItem[];
};
export type OrderApi = {
  id: string; // reference, e.g. "LX-2041"
  placedOn: string;
  status: "pending" | "queue" | "sourcing" | "transit" | "delivered" | "cancelled";
  bucket: string;
  statusLabel: string;
  statusDescription: string;
  total: number;
  items: OrderApiItem[];
  shipments?: OrderApiShipment[];
  events?: Array<{ status: string; at: string }>;
  carrier?: string;
  shippingAddress?: string;
  payment?: { brand: string; detail: string };
};

export type CreateOrderInput = {
  items: Array<{
    title: string;
    image: string;
    price: number;
    quantity: number;
    warehouse?: string;
    slug?: string;
    shippingMethod?: string; // air | sea | local (per item)
  }>;
  carrier?: string;
  address?: { line1: string; city: string; area: string } | null;
  payment?: { brand: string; detail: string } | null;
};

/** The current user's orders, optionally filtered to one tab/bucket. */
export async function listOrders(bucket?: string): Promise<OrderApi[]> {
  const path = bucket ? `/api/orders?bucket=${encodeURIComponent(bucket)}` : "/api/orders";
  const { status, data } = await apiFetch<OrderApi[]>(path);
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't load your orders."), status);
}

/** A single order by its reference (e.g. "LX-2009"). */
export async function getOrder(reference: string): Promise<OrderApi> {
  const { status, data } = await apiFetch<OrderApi>(`/api/orders/${encodeURIComponent(reference)}`);
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't load this order."), status);
}

export async function createOrder(input: CreateOrderInput): Promise<OrderApi> {
  const { status, data } = await apiFetch<OrderApi>("/api/orders", { method: "POST", body: input });
  if ((status === 201 || status === 200) && data) return data;
  throw new ApiError(detail(data, "Couldn't place your order."), status);
}

// ── Product reviews (verified purchase) ─────────────────────────────────────
export type MyReviewData = { rating: number; text: string; date: string };
export type MyReview = {
  canReview: boolean;
  hasReviewed: boolean;
  review: MyReviewData | null;
};

/** Whether the signed-in user can review this product, and their existing review. */
export async function getMyReview(slug: string): Promise<MyReview> {
  const { status, data } = await apiFetch<MyReview>(`/api/products/${encodeURIComponent(slug)}/review`);
  if (status === 200 && data) return data;
  if (status === 401 || status === 403) return { canReview: false, hasReviewed: false, review: null };
  throw new ApiError(detail(data, "Couldn't load your review."), status);
}

/** Create or update the user's review (server enforces verified purchase). */
export async function submitReview(slug: string, input: { rating: number; text: string }): Promise<MyReviewData> {
  const { status, data } = await apiFetch<{ review: MyReviewData }>(`/api/products/${encodeURIComponent(slug)}/review`, {
    method: "POST",
    body: input,
  });
  if ((status === 201 || status === 200) && data?.review) return data.review;
  throw new ApiError(detail(data, "Couldn't submit your review."), status);
}

// ── Notification preferences ────────────────────────────────────────────────
export type NotificationPrefs = { promotions: boolean; order_updates: boolean; system_alerts: boolean };

export async function getPreferences(): Promise<NotificationPrefs> {
  const { status, data } = await apiFetch<NotificationPrefs>("/api/auth/preferences");
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't load preferences."), status);
}

export async function updatePreferences(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const { status, data } = await apiFetch<NotificationPrefs>("/api/auth/preferences", { method: "PATCH", body: patch });
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't update preferences."), status);
}

// ── Change email / phone (secure OTP) ───────────────────────────────────────
export async function requestContactChange(identifier: string): Promise<RequestCodeResult> {
  const { status, data } = await apiFetch<RequestCodeResult>("/api/auth/change-contact/request", {
    method: "POST",
    body: { identifier },
  });
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Couldn't send the code. Try again."), status);
}

export async function verifyContactChange(identifier: string, code: string): Promise<ApiUser> {
  const { status, data } = await apiFetch<ApiUser>("/api/auth/change-contact/verify", {
    method: "POST",
    body: { identifier, code },
  });
  if (status === 200 && data) return data;
  throw new ApiError(detail(data, "Invalid or expired code."), status);
}

// ── Data export (GDPR) ──────────────────────────────────────────────────────
export async function exportData(): Promise<unknown> {
  const { status, data } = await apiFetch<unknown>("/api/auth/export");
  if (status === 200 && data) return data;
  throw new ApiError("Couldn't export your data.", status);
}
