import Link from "next/link";
import { getDashboardStats, listInvoices } from "@/lib/queries";
import { effectiveStatus, formatDate, money } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// Dashboard — a Server Component that reads the database directly.
// No loading spinners, no client-side fetching: the HTML arrives complete.
// force-dynamic matters: this page reads a live database, and without the
// opt-in Next.js would prerender it once at build time with stale numbers.
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recent = listInvoices({}).slice(0, 5);
  const overdueList = listInvoices({ status: "overdue" });

  const cards = [
    { label: "Total billed", value: money(stats.billedCents), sub: `${stats.invoiceCount} invoices` },
    { label: "Collected", value: money(stats.collectedCents), sub: "paid invoices" },
    { label: "Outstanding", value: money(stats.outstandingCents), sub: "sent, not yet paid" },
    { label: "Overdue", value: money(stats.overdueCents), sub: `${stats.overdueCount} invoices late`, danger: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {stats.clientCount} clients · {stats.invoiceCount} invoices ·{" "}
          {stats.draftCount} drafts waiting to be sent
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
          >
            <p className="text-sm font-medium text-gray-500">{c.label}</p>
            <p
              className={`mt-1 text-3xl font-bold tracking-tight ${
                c.danger && stats.overdueCents > 0
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {c.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </section>

      {overdueList.length > 0 && (
        <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
          <h2 className="text-sm font-semibold text-red-800">
            Needs attention — {overdueList.length} overdue{" "}
            {overdueList.length === 1 ? "invoice" : "invoices"}
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {overdueList.map((inv) => (
              <li key={inv.id}>
                <Link href={`/invoices/${inv.id}`} className="font-medium underline">
                  {inv.number}
                </Link>{" "}
                — {inv.client_name}, {money(inv.total_cents)}, was due{" "}
                {formatDate(inv.due_date)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent invoices</h2>
          <Link
            href="/invoices"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((inv) => (
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
