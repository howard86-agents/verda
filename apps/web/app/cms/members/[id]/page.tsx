import { MEMBER } from "@verda/data";
import { CmsShell } from "@/_components/cms-shell";
import { IconDrop } from "@/_components/glyphs";
import { StatSlab } from "@/_components/stat-slab";

export function generateStaticParams() {
  return [{ id: "m_4421" }];
}

interface LogRow {
  amt: string;
  d: string;
  ev: string;
  ip: string;
  src: string;
  warn?: boolean;
  when: string;
}

const LOG: LogRow[] = [
  {
    ev: "story_read_complete",
    d: "Letters to a slower year",
    amt: "+10",
    when: "today · 14:08",
    src: "web",
    ip: "114.42.x.x",
  },
  {
    ev: "daily_check_in",
    d: "May 20 check-in",
    amt: "+5",
    when: "today · 09:02",
    src: "webview",
    ip: "118.166.x.x",
  },
  {
    ev: "login_91app",
    d: "SSO via 91APP token",
    amt: "—",
    when: "today · 09:01",
    src: "webview",
    ip: "118.166.x.x",
  },
  {
    ev: "story_collect",
    d: "Reading the soil",
    amt: "+2",
    when: "yesterday",
    src: "web",
    ip: "114.42.x.x",
  },
  {
    ev: "story_read_complete",
    d: "A spring bowl in 5 colors",
    amt: "+10",
    when: "May 16",
    src: "web",
    ip: "114.42.x.x",
  },
  {
    ev: "daily_check_in",
    d: "May 16 check-in",
    amt: "+5",
    when: "May 16",
    src: "webview",
    ip: "118.166.x.x",
  },
  {
    ev: "reward_throttled",
    d: "Duplicate read attempt — ignored",
    amt: "+0",
    when: "May 15",
    src: "web",
    ip: "114.42.x.x",
    warn: true,
  },
];

interface AuditRow {
  amt: string;
  when: string;
  who: string;
  why: string;
}

const AUDIT: AuditRow[] = [
  { who: "H. Tsai", amt: "+25", why: "CS goodwill · #2018", when: "2 min ago" },
  {
    who: "H. Tsai",
    amt: "+0",
    why: "Reviewed throttling event",
    when: "today 11:02",
  },
  { who: "sys", amt: "−5", why: "Auto-rollback — duplicate", when: "May 15" },
];

export default async function CmsMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <CmsShell
      actions={
        <>
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            type="button"
          >
            Export CSV
          </button>
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            type="button"
          >
            Audit log
          </button>
          <button
            className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
            type="button"
          >
            Adjust nutrients
          </button>
        </>
      }
      active="members"
      breadcrumb={`Members / ${MEMBER.name}`}
    >
      <section className="px-8 pt-6 max-[860px]:px-5">
        {/* Member header */}
        <div className="grid grid-cols-[88px_1fr_auto] items-center gap-[22px] max-[700px]:grid-cols-1">
          <div className="flex size-[88px] items-center justify-center bg-ink font-display font-medium text-[38px] text-cream">
            {MEMBER.initial}
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              91APP {MEMBER.memberId} · {MEMBER.joined}
            </div>
            <h1 className="mt-1 mb-0 font-display font-medium text-[36px] leading-none tracking-[-0.015em]">
              {MEMBER.name}
              <span className="text-vermilion">.</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-[14px] font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
              <span className="flex items-center gap-[6px]">
                <span className="size-[6px] bg-vermilion" />
                ACTIVE · LAST OPEN 14:08 TODAY
              </span>
              <span>·</span>
              <span>{MEMBER.email}</span>
              <span>·</span>
              <span>Lv 0{MEMBER.level} · Sprout</span>
            </div>
          </div>
          <div className="flex gap-[10px]">
            <button
              className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.14em]"
              type="button"
            >
              Email
            </button>
            <button
              className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.14em]"
              type="button"
            >
              Open in 91APP
            </button>
          </div>
        </div>

        {/* Stat slab row */}
        <div className="mt-6 grid grid-cols-5 border border-ink max-[700px]:grid-cols-2">
          <StatSlab
            accent
            en="Nutrients"
            jp="滋養"
            n={String(MEMBER.nutrients)}
          />
          <StatSlab divider en="Read" jp="読了" n={String(MEMBER.read)} />
          <StatSlab divider en="Saved" jp="保存" n={String(MEMBER.saved)} />
          <StatSlab divider en="Level" jp="芽" n={`0${MEMBER.level}`} />
          <StatSlab
            divider
            en="Redeemed"
            jp="未引換"
            n={String(MEMBER.redeemed)}
          />
        </div>

        {/* Main grid */}
        <div className="mt-7 grid grid-cols-[1.4fr_1fr] gap-6 max-[1000px]:grid-cols-1">
          {/* Behaviour log */}
          <div>
            <div className="flex items-baseline justify-between border-ink border-b pb-2">
              <div>
                <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                  Behaviour log
                </div>
                <div className="mt-[2px] font-display text-[18px] text-muted italic">
                  行動の記録
                </div>
              </div>
              <div className="flex gap-3 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                <span className="border-vermilion border-b-2 pb-1 text-ink">
                  All
                </span>
                <span>Rewards</span>
                <span>Logins</span>
                <span>Errors</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[480px]">
                {LOG.map((r) => (
                  <div
                    className="grid grid-cols-[56px_160px_1fr_80px_80px] items-center gap-[14px] border-line border-b py-3 font-sans text-[13px]"
                    key={`${r.when}-${r.ev}`}
                  >
                    <span
                      className={`flex items-center gap-1 font-display font-medium text-[16px] ${
                        r.amt === "+0" ? "text-muted" : "text-vermilion"
                      }`}
                    >
                      {r.amt !== "+0" && (
                        <span className="inline-flex text-vermilion">
                          <IconDrop />
                        </span>
                      )}
                      {r.amt}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                        r.warn ? "text-vermilion" : "text-ink"
                      }`}
                    >
                      {r.ev}
                    </span>
                    <span className="text-ink-soft">{r.d}</span>
                    <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.08em]">
                      {r.src}
                    </span>
                    <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                      {r.when}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — adjustment + audit + integration */}
          <div className="flex flex-col gap-5">
            {/* Manual adjustment slab */}
            <div className="border border-ink bg-paper p-[18px]">
              <div className="flex items-baseline gap-2 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                Manual adjustment
                <span className="font-display text-[12px] text-muted normal-case italic tracking-normal">
                  手動調整
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-[10px]">
                <button
                  className="border border-line bg-paper py-2 font-mono text-[11px] text-vermilion uppercase tracking-[0.14em]"
                  type="button"
                >
                  + Add
                </button>
                <button
                  className="border border-line bg-paper py-2 font-mono text-[11px] text-muted uppercase tracking-[0.14em]"
                  type="button"
                >
                  − Deduct
                </button>
              </div>
              <div className="mt-[14px] flex items-baseline gap-2 border border-line bg-paper-alt px-3 py-[10px]">
                <label
                  className="font-display font-medium text-[28px] text-vermilion"
                  htmlFor="adjust-amount"
                >
                  +
                </label>
                <input
                  className="w-12 border-0 bg-transparent font-display font-medium text-[28px] text-vermilion outline-none"
                  defaultValue="25"
                  id="adjust-amount"
                  inputMode="numeric"
                />
                <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
                  nutrients · 滋養
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted tracking-[0.1em]">
                  NEW BAL: 112
                </span>
              </div>
              <div className="mt-[10px]">
                <label
                  className="mb-1 block font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]"
                  htmlFor="adjust-reason"
                >
                  Reason · 理由 (required)
                </label>
                <textarea
                  className="w-full resize-none border border-ink bg-white px-[10px] py-2 font-sans text-[13px] text-ink"
                  defaultValue="CS goodwill — refund for 14 May reward not credited (ticket #2018)."
                  id="adjust-reason"
                  rows={2}
                />
              </div>
              <button
                className="mt-[14px] w-full bg-vermilion py-[10px] font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
                type="button"
              >
                Apply &amp; sign audit
              </button>
              <div className="mt-[10px] font-mono text-[9.5px] text-muted uppercase tracking-[0.06em]">
                Logged as ledger txn + audit row · cannot be deleted
              </div>
            </div>

            {/* Recent audit */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-2">
                <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                  Audit · 監査
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  last 30d
                </div>
              </div>
              {AUDIT.map((a) => (
                <div
                  className="grid grid-cols-[60px_1fr_auto] gap-[10px] border-line border-b py-[10px]"
                  key={`${a.when}-${a.why}`}
                >
                  <span
                    className={`font-display font-medium text-[16px] ${
                      a.amt.startsWith("+") ? "text-vermilion" : "text-muted"
                    }`}
                  >
                    {a.amt}
                  </span>
                  <div>
                    <div className="font-sans text-[13px]">{a.why}</div>
                    <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
                      by {a.who}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted tracking-[0.06em]">
                    {a.when}
                  </span>
                </div>
              ))}
            </div>

            {/* Integration summary */}
            <div className="border-vermilion border-l-4 bg-ink p-[18px] text-cream">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                Integration · 連携
              </div>
              <div className="mt-[10px] grid grid-cols-2 gap-[10px] font-mono text-[10.5px] tracking-[0.06em]">
                <span className="text-white/60">91APP token</span>
                <span>valid · 14:08</span>
                <span className="text-white/60">WebView</span>
                <span>iOS 17.4</span>
                <span className="text-white/60">GA4 ID</span>
                <span>G-VERDA1·MAIN</span>
                <span className="text-white/60">Events / 30d</span>
                <span>312 · 0 errors</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[60px]" />
      </section>
    </CmsShell>
  );
}
