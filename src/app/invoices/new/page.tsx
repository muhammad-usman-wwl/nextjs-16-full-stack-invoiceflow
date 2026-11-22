import InvoiceForm from "@/components/InvoiceForm";
import { createInvoice } from "@/lib/actions";
import { listClients } from "@/lib/queries";

// The client dropdown must include clients added a minute ago — dynamic.
export const dynamic = "force-dynamic";

export default function NewInvoicePage() {
  const clients = listClients();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
        <p className="text-sm text-gray-500">
          The invoice number is assigned automatically when you save.
        </p>
      </div>
      <InvoiceForm
        action={createInvoice}
        clients={clients}
        submitLabel="Create invoice"
      />
    </div>
  );
}
