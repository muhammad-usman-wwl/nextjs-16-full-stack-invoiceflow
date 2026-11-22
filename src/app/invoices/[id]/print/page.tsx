import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, getInvoice, getInvoiceItems } from "@/lib/queries";
import { formatDate, money } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

// The printable invoice: same database row, presented as a clean sheet
// the freelancer can print or save as a PDF and send to the client.
// Print CSS in globals.css strips the app navigation and background.

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoice(Number(id));
  if (!invoice) notFound();
  const client = getClient(invoice.client_id);
  const items = getInvoiceItems(invoice.id);

  return (
    <div className="space-y-4">
      <div className="print-hidden flex items-center justify-between">
        <Link
          href={`/invoices/${invoice.id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to {invoice.number}
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-xl font-bold tracking-tight">
              Invoice<span className="text-indigo-600">Flow</span> Studio
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Web design & development services
              <br />
              billing@invoiceflow.example
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight">INVOICE</p>
            <p className="mt-1 text-sm text-gray-500">{invoice.number}</p>
          </div>
        </div>

        <div className="flex justify-between py-6 text-sm">
          <div>
            <p className="font-semibold text-gray-900">Billed to</p>
            <p className="mt-1 text-gray-600">
              {client?.name}
              <br />
              {client?.contact && <>Attn: {client.contact}<br /></>}
              {client?.email}
            </p>
          </div>
          <div className="text-right text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Issued:</span>{" "}
              {formatDate(invoice.issue_date)}
            </p>
            <p>
              <span className="font-medium text-gray-900">Due:</span>{" "}
              {formatDate(invoice.due_date)}
            </p>
            <p className="mt-1 capitalize">
              <span className="font-medium text-gray-900">Status:</span>{" "}
              {invoice.status}
            </p>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-y border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5">{it.description}</td>
                <td className="py-2.5 text-right text-gray-600">{it.quantity}</td>
                <td className="py-2.5 text-right text-gray-600">
                  {money(it.rate_cents)}
                </td>
                <td className="py-2.5 text-right font-medium">
                  {money(Math.round(it.quantity * it.rate_cents))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td colSpan={3} className="py-3 text-right font-semibold">
                Total due
              </td>
              <td className="py-3 text-right text-lg font-bold">
                {money(invoice.total_cents)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <p className="mt-6 text-sm text-gray-500">{invoice.notes}</p>
        )}
        <p className="mt-10 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
          Thank you for your business.
        </p>
      </div>
    </div>
  );
}
