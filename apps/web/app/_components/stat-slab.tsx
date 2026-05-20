// A stat cell: big display number + mono EN label + JP italic sub. Used in the
// Collection masthead (lg) and the CMS member detail (md). `divider` draws the
// left hairline between cells; `accent` is the vermilion-filled cell.

const SIZES = {
  lg: {
    pad: "px-6 py-[22px]",
    n: "text-[44px]",
    mt: "mt-[10px]",
    en: "text-[10.5px]",
    jp: "text-[12px]",
  },
  md: {
    pad: "px-[22px] py-[18px]",
    n: "text-[36px]",
    mt: "mt-2",
    en: "text-[10px]",
    jp: "text-[11px]",
  },
} as const;

export function StatSlab({
  n,
  en,
  jp,
  accent = false,
  divider = false,
  size = "md",
}: {
  n: string;
  en: string;
  jp: string;
  accent?: boolean;
  divider?: boolean;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  return (
    <div
      className={`${s.pad} ${accent ? "bg-vermilion text-cream" : "text-ink"} ${
        divider ? "border-ink border-l max-[640px]:border-l-0" : ""
      }`}
    >
      <div className={`font-display font-medium leading-none ${s.n}`}>{n}</div>
      <div
        className={`${s.mt} font-mono uppercase tracking-[0.2em] ${s.en} ${
          accent ? "text-cream opacity-85" : "text-muted"
        }`}
      >
        {en}
      </div>
      <div
        className={`mt-[2px] font-display italic ${s.jp} ${
          accent ? "text-cream opacity-[0.78]" : "text-muted"
        }`}
      >
        {jp}
      </div>
    </div>
  );
}
