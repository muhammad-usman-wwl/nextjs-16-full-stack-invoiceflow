import { notFound } from "next/navigation";
import ClientForm from "@/components/ClientForm";
import { updateClient } from "@/lib/actions";
import { getClient } from "@/lib/queries";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getClient(Number(id));
  if (!client) notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit client</h1>
        <p className="text-sm text-gray-500">{client.name}</p>
      </div>
      <ClientForm
        action={updateClient.bind(null, client.id)}
        client={client}
        submitLabel="Save changes"
      />
    </div>
  );
}
