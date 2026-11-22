import { notFound } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { updateInvoice } from "@/lib/actions";
import { getInvoice, getInvoiceItems, listClients } from "@/lib/queries";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoice(Number(id));
  if (!invoice) notFound();
  const items = getInvoiceItems(invoice.id);
  const clients = listClients();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {invoice.number}
        </h1>
        <p className="text-sm text-gray-500">
          Line items are replaced with what you save here.
        </p>
      </div>
      <InvoiceForm
        action={updateInvoice.bind(null, invoice.id)}
        clients={clients}
        invoice={invoice}
        items={items}
        submitLabel="Save changes"
      />
    </div>
  );
}
