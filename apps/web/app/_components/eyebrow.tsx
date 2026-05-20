// Tokyo-style eyebrow: thin rule + uppercase mono EN + JP serif sub.

export function Eyebrow({
  en,
  jp,
  className = "",
}: {
  en: string;
  jp?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      <span className="inline-block h-px w-[18px] bg-ink opacity-70" />
      <span className="font-mono text-[10px] text-ink uppercase tracking-[0.22em]">
        {en}
      </span>
      {jp && (
        <span className="font-display text-[11px] text-muted tracking-[0.08em]">
          {jp}
        </span>
      )}
    </div>
  );
}
