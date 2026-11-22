import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getInvoiceItems } from "@/lib/queries";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions";
import { effectiveStatus, formatDate, money } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import DeleteButton from "@/components/DeleteButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoice(Number(id));
  if (!invoice) notFound();
  const items = getInvoiceItems(invoice.id);
  const status = effectiveStatus(invoice.status, invoice.due_date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {invoice.number}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {invoice.client_name} · Issued {formatDate(invoice.issue_date)} ·
            Due {formatDate(invoice.due_date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === "draft" && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "sent")}>
              <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500">
                Mark as Sent
              </button>
            </form>
          )}
          {invoice.status === "sent" && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "paid")}>
              <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-500">
                Mark as Paid
              </button>
            </form>
          )}
          <Link
            href={`/invoices/${invoice.id}/print`}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50"
          >
            Print / PDF
          </Link>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteButton
            action={deleteInvoice.bind(null, invoice.id)}
            confirmText={`Delete invoice ${invoice.number}? This cannot be undone.`}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Rate</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3">{it.description}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {it.quantity}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {money(it.rate_cents)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {money(Math.round(it.quantity * it.rate_cents))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                Total due
              </td>
              <td className="px-4 py-3 text-right text-base font-bold">
                {money(invoice.total_cents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && (
        <p className="max-w-2xl text-sm text-gray-500">
          <span className="font-medium text-gray-700">Notes:</span>{" "}
          {invoice.notes}
        </p>
      )}
    </div>
  );
}
