// Small display helpers shared by pages and components.

export function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type EffectiveStatus = "draft" | "sent" | "paid" | "overdue";

/** A "sent" invoice whose due date has passed is effectively overdue. */
export function effectiveStatus(
  status: string,
  dueDate: string
): EffectiveStatus {
  if (status === "sent") {
    const today = new Date();
    const todayIso =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    if (dueDate < todayIso) return "overdue";
  }
  return status as EffectiveStatus;
}

export const STATUS_STYLES: Record<EffectiveStatus, string> = {
  draft: "bg-gray-100 text-gray-700 ring-gray-300",
  sent: "bg-blue-50 text-blue-700 ring-blue-300",
  paid: "bg-green-50 text-green-700 ring-green-300",
  overdue: "bg-red-50 text-red-700 ring-red-300",
};
