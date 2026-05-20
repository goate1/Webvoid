"use client";

import { useState, useEffect, useCallback } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AdminDashboard from "@/components/AdminDashboard";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────
type OrderStatus =
  | "pending"
  | "accepted"
  | "processing"
  | "delivered"
  | "declined"
  | "canceled";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customization?: {
    customFields?: Record<string, string>;
    customFieldLabels?: Record<string, string>;
    size?: string;
    sizeModifier?: number;
  };
}

interface AdminOrder {
  id: string;
  createdAt: string;
  customerInfo?: {
    name?: string;
    email?: string;
    discordUsername?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  currency?: string;
}

// ── Decode customization from item ID ────────────────────────
// Item IDs are formatted as: `{firestoreProductId}_{base64(JSON)}`
// e.g. "eKroSlRfPVGK70SnpBeY_eyJzaXplIjoic2l6ZV8x..."
function decodeItemCustomization(itemId: string): {
  size?: string;
  customFields?: Record<string, string>;
} | null {
  const idx = itemId.indexOf("_");
  if (idx === -1) return null;
  const b64 = itemId.slice(idx + 1);
  if (!b64 || b64 === "e30") return null; // e30 = base64("{}") — empty
  try {
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

// ── Status badge ──────────────────────────────────────────────
const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  pending:    { bg: "bg-yellow-50",  text: "text-yellow-700" },
  accepted:   { bg: "bg-blue-50",   text: "text-blue-700" },
  processing: { bg: "bg-blue-50",   text: "text-blue-700" },
  delivered:  { bg: "bg-green-50",  text: "text-green-700" },
  declined:   { bg: "bg-red-50",    text: "text-red-700" },
  canceled:   { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status as OrderStatus] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-[2px] text-[11px] font-grotesk font-bold uppercase tracking-wide ${s.bg} ${s.text}`}
    >
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#E5E5E5] rounded-[4px] p-5 bg-white">
      <p className="text-[11px] font-grotesk font-bold uppercase tracking-[0.12em] text-[#6B6B6B] mb-2">
        {label}
      </p>
      <p className="font-grotesk font-black text-[#0A0A0A] text-2xl leading-none">
        {value}
      </p>
    </div>
  );
}

// ── Order detail drawer ───────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  onDelete,
}: {
  order: AdminOrder;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
  onDelete: (orderId: string) => Promise<void>;
}) {
  const ci = order.customerInfo ?? {};
  const address = [ci.address, ci.city, ci.state, ci.zipCode, ci.country]
    .filter(Boolean)
    .join(", ");

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusChanged = selectedStatus !== order.status;

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await onStatusChange(order.id, selectedStatus);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await onDelete(order.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="w-full max-w-md bg-white border-l border-[#E5E5E5] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E5E5] sticky top-0 bg-white">
          <h2 className="font-grotesk font-black uppercase text-[#0A0A0A] tracking-tight">
            Order #{order.id.slice(-8).toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 flex-1">
          {/* Status editor */}
          <div>
            <p className="void-label mb-3">Status</p>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="void-input flex-1"
              >
                {(["pending","accepted","processing","delivered","declined","canceled"] as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={!statusChanged || saving}
                className="px-4 py-2 bg-[#A855F7] text-white text-xs font-grotesk font-bold uppercase tracking-wider rounded-[4px] disabled:opacity-40 transition-colors hover:bg-[#9333ea]"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-1">{order.createdAt}</p>
          </div>

          {/* Customer */}
          <div>
            <p className="void-label mb-3">Customer</p>
            <dl className="space-y-1.5 text-sm">
              {ci.name && <div className="flex gap-2"><dt className="text-[#6B6B6B] w-20 flex-shrink-0">Name</dt><dd className="text-[#0A0A0A]">{ci.name}</dd></div>}
              {ci.email && <div className="flex gap-2"><dt className="text-[#6B6B6B] w-20 flex-shrink-0">Email</dt><dd className="text-[#0A0A0A] break-all">{ci.email}</dd></div>}
              {ci.discordUsername && <div className="flex gap-2"><dt className="text-[#6B6B6B] w-20 flex-shrink-0">Discord</dt><dd className="text-[#0A0A0A]">{ci.discordUsername}</dd></div>}
              {address && <div className="flex gap-2"><dt className="text-[#6B6B6B] w-20 flex-shrink-0">Address</dt><dd className="text-[#0A0A0A]">{address}</dd></div>}
            </dl>
          </div>

          {/* Items */}
          <div>
            <p className="void-label mb-3">Items</p>
            <div className="space-y-3">
              {order.items.map((item, i) => {
                const fields = item.customization?.customFields ?? {};
                const labels = item.customization?.customFieldLabels ?? {};
                return (
                  <div key={i} className="border border-[#E5E5E5] rounded-[4px] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-grotesk font-semibold text-[#0A0A0A] text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-grotesk font-bold text-[#A855F7] text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.customization?.size && (
                      <div className="flex gap-2 text-xs mt-2">
                        <span className="text-[#6B6B6B]">Size:</span>
                        <span className="text-[#0A0A0A] font-semibold uppercase">
                          {item.customization.size}
                        </span>
                      </div>
                    )}
                    {Object.keys(fields).length > 0 && (
                      <dl className="mt-1.5 space-y-0.5">
                        {Object.entries(fields).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs">
                            <dt className="text-[#6B6B6B] capitalize">
                              {labels[k] ?? k.replace(/([A-Z])/g, " $1").trim()}:
                            </dt>
                            <dd className="text-[#0A0A0A]">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-4">
            <span className="font-grotesk font-bold uppercase text-[#0A0A0A] tracking-wider text-sm">
              Total
            </span>
            <span className="font-grotesk font-black text-[#A855F7] text-xl">
              ${order.total.toFixed(2)}{" "}
              <span className="text-sm font-normal text-[#6B6B6B]">
                {order.currency?.toUpperCase() ?? "USD"}
              </span>
            </span>
          </div>
        </div>

        {/* Delete */}
        <div className="px-6 pb-6">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`w-full py-2.5 text-xs font-grotesk font-bold uppercase tracking-wider rounded-[4px] border transition-colors ${
              confirmDelete
                ? "bg-red-600 border-red-600 text-white hover:bg-red-700"
                : "border-red-300 text-red-500 hover:bg-red-50"
            } disabled:opacity-50`}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Confirm Delete" : "Delete Order"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full mt-2 text-xs text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // ── Auth ────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) { setError("Firebase Auth not initialized"); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message = (err as { message?: string }).message;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Check your connection.");
      } else {
        setError(message ?? "Sign-in failed.");
      }
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth).catch(console.error);
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  };

  // ── Order actions ────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!db) return;
    await updateDoc(doc(db, "orders", orderId), { status: newStatus, updatedAt: new Date() });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "orders", orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setSelectedOrder(null);
  };

  // ── Load orders ─────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!db) return;
    setOrdersLoading(true);
    try {
      const col = collection(db, "orders");
      const q = query(col, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const rows: AdminOrder[] = snap.docs.map((doc) => {
        const d = doc.data();
        const createdAt =
          d.createdAt?.toDate?.()
            ? d.createdAt.toDate().toISOString().slice(0, 10)
            : String(d.createdAt ?? "");

        // Enrich items: decode customization from item ID when not stored directly
        const items: OrderItem[] = (d.items ?? []).map((item: Record<string, unknown>) => {
          const stored = item.customization as OrderItem["customization"] | null | undefined;
          const hasCustomization =
            stored?.size ||
            Object.keys(stored?.customFields ?? {}).length > 0;

          let customization: OrderItem["customization"] = stored ?? undefined;

          if (!hasCustomization) {
            const itemId = item.id as string | undefined;
            if (itemId) {
              const decoded = decodeItemCustomization(itemId);
              if (decoded) {
                customization = {
                  size: decoded.size,
                  customFields: decoded.customFields,
                };
              }
            }
          }

          return {
            name: item.name as string,
            quantity: item.quantity as number,
            price: item.price as number,
            customization,
          };
        });

        return {
          id: doc.id,
          createdAt,
          customerInfo: d.customerInfo ?? {},
          items,
          total: d.total ?? 0,
          status: d.status ?? "pending",
          currency: d.currency,
        };
      });
      setOrders(rows);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated, loadOrders]);

  // ── Stats ────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  // ── Filtered orders ──────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const ci = o.customerInfo ?? {};
    const hay = `${ci.name} ${ci.email} ${ci.discordUsername} ${o.id}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const STATUS_FILTERS = ["all", "pending", "accepted", "processing", "delivered", "declined", "canceled"];

  // ── Loading ──────────────────────────────────────────────────
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  // ── Login screen ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <p className="font-grotesk font-black uppercase text-[#0A0A0A] text-2xl tracking-widest">
              VOID ESPORTS
            </p>
            <p className="text-[#6B6B6B] text-sm mt-1">Admin Panel</p>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="void-label" htmlFor="admin-email">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className="void-input"
                  placeholder="admin@voidesports.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="void-label" htmlFor="admin-password">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="void-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="void-button w-full disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated view ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteOrder}
        />
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-[#E5E5E5] sticky top-16 z-10">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between h-14">
          <span className="font-grotesk font-black uppercase text-[#0A0A0A] tracking-widest text-sm">
            Admin Panel
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#6B6B6B] hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Orders section ─────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-8 space-y-8">
        <div className="flex items-end justify-between">
          <h1
            className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em" }}
          >
            ORDERS
          </h1>
          <button
            onClick={loadOrders}
            className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#6B6B6B] hover:text-[#A855F7] transition-colors border-b border-[#6B6B6B] hover:border-[#A855F7] pb-0.5"
          >
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={orders.length} />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatCard label="Pending" value={pending} />
          <StatCard label="Delivered" value={delivered} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            <input
              type="text"
              className="void-input pl-9"
              placeholder="Search name, email, order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-[4px] text-[11px] font-grotesk font-bold uppercase tracking-wider border transition-colors ${
                  statusFilter === s
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#A855F7] hover:text-[#0A0A0A]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders table */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden">
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#6B6B6B] text-sm">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5]">
                    {["Order ID", "Date", "Customer", "Email", "Discord", "Items", "Total", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-grotesk font-bold uppercase tracking-[0.12em] text-[#6B6B6B] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const ci = order.customerInfo ?? {};
                    const itemSummary = order.items
                      .map((i) => {
                        const extras: string[] = [];
                        if (i.customization?.size) extras.push(i.customization.size.toUpperCase());
                        const cf = i.customization?.customFields ?? {};
                        if (cf["color"]) extras.push(cf["color"]);
                        if (cf["nameOnBack"]) extras.push(`#${cf["nameOnBack"]}`);
                        if (cf["sponsorPatch"]) extras.push("Patch");
                        Object.entries(cf).forEach(([k, v]) => {
                          if (!["color","nameOnBack","sponsorPatch"].includes(k)) extras.push(v);
                        });
                        return `${i.name}${extras.length ? ` (${extras.join(", ")})` : ""}×${i.quantity}`;
                      })
                      .join(", ");

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <td className="px-4 py-3 font-grotesk font-bold text-[#0A0A0A] text-xs">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap">
                          {order.createdAt}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#0A0A0A] whitespace-nowrap">
                          {ci.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] max-w-[140px] truncate">
                          {ci.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B]">
                          {ci.discordUsername ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] max-w-[200px] truncate text-xs">
                          {itemSummary || "—"}
                        </td>
                        <td className="px-4 py-3 font-grotesk font-bold text-[#A855F7] whitespace-nowrap">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-[11px] font-grotesk font-bold uppercase tracking-wide rounded-[2px] px-2 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#A855F7] ${STATUS_STYLES[order.status]?.bg ?? "bg-[#F5F5F5]"} ${STATUS_STYLES[order.status]?.text ?? "text-[#6B6B6B]"}`}
                          >
                            {(["pending","accepted","processing","delivered","declined","canceled"] as OrderStatus[]).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#6B6B6B] hover:text-[#A855F7] transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Full Dashboard (content management) ────────────── */}
      <div className="border-t border-[#E5E5E5]">
        <AdminDashboard />
      </div>
    </div>
  );
}
