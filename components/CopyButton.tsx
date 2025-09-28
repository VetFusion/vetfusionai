"use client";

export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op: clipboard might be blocked; we just avoid crashing
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {label}
    </button>
  );
}
