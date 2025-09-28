"use client";
import PrintButton from "@/components/PrintButton";

export default function Toolbar({ backHref = "/tracker" }: { backHref?: string }) {
  return (
    <div className="flex items-center justify-between print:hidden">
      <a href={backHref} className="text-sm underline">← Back to Tracker</a>
      <PrintButton className="px-3 py-2 rounded-lg border" />
    </div>
  );
}
