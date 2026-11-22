import Link from "next/link";
import { listClients } from "@/lib/queries";
import { deleteClient } from "@/lib/actions";
import { money } from "@/lib/format";
import DeleteButton from "@/components/DeleteButton";

// Live database read on every request — never prerendered at build time.
export const dynamic = "force-dynamic";

export default function ClientsPage() {
  const clients = listClients();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} clients</p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          + New Client
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Invoices</th>
              <th className="px-4 py-3 text-right font-medium">Total billed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.contact || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.invoice_count}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {money(c.billed_cents)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/clients/${c.id}/edit`}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    {c.invoice_count === 0 && (
                      <DeleteButton
                        action={deleteClient.bind(null, c.id)}
                        confirmText={`Delete client "${c.name}"? This cannot be undone.`}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No clients yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        A client with invoices cannot be deleted — their billing history stays
        intact.
      </p>
    </div>
  );
}
