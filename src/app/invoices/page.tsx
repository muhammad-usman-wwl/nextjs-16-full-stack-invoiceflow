import Link from "next/link";
import { listInvoices } from "@/lib/queries";
import { effectiveStatus, formatDate, money } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// The list reads its state from the URL (?q= and ?status=) — in Next 16
// searchParams is a Promise and must be awaited. Because the filters live
// in the URL, a filtered view can be bookmarked or shared.

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "all";
  const invoices = listInvoices({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            {status !== "all" ? ` · ${status}` : ""}
            {q ? ` · matching “${q}”` : ""}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          + New Invoice
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-gray-200">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={{
                pathname: "/invoices",
                query: { ...(q ? { q } : {}), status: f.key },
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === f.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form method="get" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search number or client…"
            className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {inv.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{inv.client_name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(inv.issue_date)}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(inv.due_date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={effectiveStatus(inv.status, inv.due_date)}
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {money(inv.total_cents)}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No invoices match — try a different search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
