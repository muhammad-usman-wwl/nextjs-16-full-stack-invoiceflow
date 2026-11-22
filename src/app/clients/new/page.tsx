import ClientForm from "@/components/ClientForm";
import { createClient } from "@/lib/actions";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New client</h1>
        <p className="text-sm text-gray-500">
          Add a client once — then bill them with two clicks.
        </p>
      </div>
      <ClientForm action={createClient} submitLabel="Create client" />
    </div>
  );
}
