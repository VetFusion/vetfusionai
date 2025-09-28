export default function GlowCard({
  className = "",
  children,
}: { className?: string; children: React.ReactNode }) {
  return <section className={`vf-glass vf-glow p-4 md:p-5 ${className}`}>{children}</section>;
}
