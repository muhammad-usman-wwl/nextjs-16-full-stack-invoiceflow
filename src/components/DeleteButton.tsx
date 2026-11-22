"use client";

export default function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Are you sure? This cannot be undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-red-300 transition hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}
