"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions";
import type { Client } from "@/lib/queries";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const labelCls = "block text-sm font-medium text-gray-700";

export default function ClientForm({
  action,
  client,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  client?: Client;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}
      <div>
        <label className={labelCls} htmlFor="name">
          Client / company name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={client?.name ?? ""}
          className={inputCls}
          placeholder="Bright Bean Coffee Co."
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="email">
          Billing email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          required
          defaultValue={client?.email ?? ""}
          className={inputCls}
          placeholder="orders@example.com"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="contact">
          Contact person
        </label>
        <input
          id="contact"
          name="contact"
          defaultValue={client?.contact ?? ""}
          className={inputCls}
          placeholder="Alex Reed"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
