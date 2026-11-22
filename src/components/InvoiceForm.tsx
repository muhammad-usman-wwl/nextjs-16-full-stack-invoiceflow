"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/actions";
import type { Client, Invoice, InvoiceItem } from "@/lib/queries";
import { money } from "@/lib/format";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const labelCls = "block text-sm font-medium text-gray-700";

interface Row {
  description: string;
  quantity: number;
  rate: number; // dollars in the form; converted to cents in the action
}

export default function InvoiceForm({
  action,
  clients,
  invoice,
  items,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  clients: Client[];
  invoice?: Invoice;
  items?: InvoiceItem[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [rows, setRows] = useState<Row[]>(
    items && items.length > 0
      ? items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          rate: it.rate_cents / 100,
        }))
      : [{ description: "", quantity: 1, rate: 0 }]
  );

  const total = rows.reduce((acc, r) => acc + r.quantity * r.rate * 100, 0);

  function setRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className={labelCls} htmlFor="client_id">
            Client
          </label>
          <select
            id="client_id"
            name="client_id"
            required
            defaultValue={invoice?.client_id ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Choose a client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="issue_date">
            Issue date
          </label>
          <input
            id="issue_date"
            name="issue_date"
            type="date"
            required
            defaultValue={
              invoice?.issue_date ?? new Date().toISOString().slice(0, 10)
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="due_date">
            Due date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            required
            defaultValue={invoice?.due_date ?? ""}
            className={inputCls}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Line items</legend>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-6">
              <input
                name="item_desc"
                value={row.description}
                onChange={(e) => setRow(i, { description: e.target.value })}
                placeholder="Description of work"
                className={inputCls}
                aria-label="Item description"
              />
            </div>
            <div className="col-span-2">
              <input
                name="item_qty"
                type="number"
                min="0"
                step="0.5"
                value={row.quantity}
                onChange={(e) => setRow(i, { quantity: Number(e.target.value) })}
                className={inputCls}
                aria-label="Quantity"
              />
            </div>
            <div className="col-span-2">
              <input
                name="item_rate"
                type="number"
                min="0"
                step="0.01"
                value={row.rate}
                onChange={(e) => setRow(i, { rate: Number(e.target.value) })}
                className={inputCls}
                aria-label="Rate in dollars"
              />
            </div>
            <div className="col-span-1 pb-2 text-right text-sm font-medium text-gray-700">
              {money(Math.round(row.quantity * row.rate * 100))}
            </div>
            <div className="col-span-1 pb-1 text-right">
              <button
                type="button"
                onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                className="rounded-md px-2 py-1 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setRows((p) => [...p, { description: "", quantity: 1, rate: 0 }])
          }
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-300 transition hover:bg-indigo-50"
        >
          + Add item
        </button>
      </fieldset>

      <div>
        <label className={labelCls} htmlFor="notes">
          Notes (shown on the invoice)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={invoice?.notes ?? ""}
          className={inputCls}
          placeholder="Payment due within 14 days."
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <p className="text-base font-semibold text-gray-900">
          Total: {money(Math.round(total))}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
