"use client";

import { AI_MATCHES } from "@verda/data";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";
import { CCY, formatCcy } from "../../lib/currency";
import { ImageOrPlaceholder } from "../_components/product-image";
import { useLocale } from "../providers";

interface FormState {
  brand: string;
  budgetHi: string;
  budgetLow: string;
  cond: string;
  deadline: string;
  model: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  brand: "Birkett",
  model: "Saddle 25 · Étoupe",
  budgetLow: "USD 10,000",
  budgetHi: "USD 14,500",
  notes: "",
  cond: "Excellent · pre-loved, no visible wear",
  deadline: "Before September",
};

const AI_DELAY_MS = 1400;

function UploadStep({
  uploadPreview,
  setUploadPreview,
  runningAI,
  aiDone,
  runAI,
}: {
  uploadPreview: string | null;
  setUploadPreview: (v: string | null) => void;
  runningAI: boolean;
  aiDone: boolean;
  runAI: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasUpload = uploadPreview !== null;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="stack-lg">
      <div className="field gap-[10px]">
        <label htmlFor="req-piece-upload">01 · The piece</label>
        <div className="upload-zone" data-has={hasUpload ? "1" : "0"}>
          <div className="drop-target">
            {hasUpload ? (
              <div
                className="ph ph-square brackets size-full bg-center bg-cover"
                data-ph="reference · uploaded"
                style={{ backgroundImage: `url(${uploadPreview})` }}
              />
            ) : (
              <div className="muted text-center text-[12px]">
                <div className="display text-[56px] text-ink-3 italic leading-none">
                  +
                </div>
                <div className="mono mt-2 text-[10px] tracking-[0.16em]">
                  DRAG · OR · BROWSE
                </div>
              </div>
            )}
          </div>
          <div>
            <h3>
              {hasUpload
                ? "A handsome reference."
                : "Add the piece you have in mind."}
            </h3>
            <p>
              {hasUpload
                ? "Add up to 4 more photographs from different angles, a link, or a sentence about what you remember."
                : "Drop a screenshot, a runway photo, or even a snapshot taken in a friend’s closet. We accept JPG, HEIC, PNG up to 24MB."}
            </p>
            <div className="actions">
              {hasUpload ? (
                <>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setUploadPreview(null)}
                    type="button"
                  >
                    Replace photograph
                  </button>
                  {!aiDone && (
                    <button
                      className="btn btn-primary"
                      disabled={runningAI}
                      onClick={runAI}
                      type="button"
                    >
                      {runningAI
                        ? "Identifying…"
                        : "Identify with our assistant"}{" "}
                      <span>→</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => fileRef.current?.click()}
                    type="button"
                  >
                    Choose a photograph
                  </button>
                  <button className="btn btn-ghost" type="button">
                    Paste a link instead
                  </button>
                </>
              )}
            </div>
            <input
              accept="image/*"
              hidden
              id="req-piece-upload"
              onChange={onFile}
              ref={fileRef}
              type="file"
            />
          </div>
        </div>
      </div>

      {hasUpload && (runningAI || aiDone) && (
        <div className="ai-card fade-in">
          <div className="row1">
            <span className="pulse" />
            <span>Concierge assistant — suggestion only</span>
          </div>
          <div className="summary">
            {runningAI && !aiDone ? (
              <>Reading hardware, stitching, and grain…</>
            ) : (
              <>
                This appears to be a{" "}
                <em>Birkett Saddle, size 25, Étoupe Togo</em> — circa 2023,
                hardware in palladium.
              </>
            )}
          </div>
          {aiDone && (
            <>
              <div className="matches">
                {AI_MATCHES.map((m) => (
                  <div className="m" key={m.id}>
                    <ImageOrPlaceholder
                      alt={`${m.brand} ${m.name}`}
                      aspect="square"
                      caption={m.id}
                      id={m.id}
                      kind="matches"
                      sizes="120px"
                    />
                    <div className="body">
                      <div className="nm">{m.name}</div>
                      <div className="pr">{m.brand}</div>
                      <div className="pct">{m.confidence}% confidence</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="footnote">
                <strong>A note from VERDA.</strong> Identification is a
                suggestion to speed your concierge along — never a verification.
                Your dossier is reviewed and confirmed by a human within 24
                hours.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailsStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
}) {
  const upd = (k: keyof FormState, v: string) => setForm({ ...form, [k]: v });
  return (
    <div className="stack-lg">
      <div className="grid grid-cols-2 gap-8">
        <div className="field">
          <label htmlFor="req-brand">02 · Maison or house</label>
          <input
            id="req-brand"
            onChange={(e) => upd("brand", e.target.value)}
            placeholder="e.g. Birkett, Aurel, Couronne"
            value={form.brand}
          />
        </div>
        <div className="field">
          <label htmlFor="req-model">02 · Model or reference</label>
          <input
            id="req-model"
            onChange={(e) => upd("model", e.target.value)}
            placeholder="Saddle 25 · Étoupe · 2023"
            value={form.model}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="field">
          <label htmlFor="req-budget-low">03 · Budget — comfortable</label>
          <input
            id="req-budget-low"
            onChange={(e) => upd("budgetLow", e.target.value)}
            placeholder="USD 10,000"
            value={form.budgetLow}
          />
          <div className="field-help">
            What we should aim for if the perfect piece appears.
          </div>
        </div>
        <div className="field">
          <label htmlFor="req-budget-hi">03 · Budget — ceiling</label>
          <input
            id="req-budget-hi"
            onChange={(e) => upd("budgetHi", e.target.value)}
            placeholder="USD 14,500"
            value={form.budgetHi}
          />
          <div className="field-help">
            The line beyond which we should pause and ask.
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="req-notes">04 · Notes for your concierge</label>
        <textarea
          id="req-notes"
          onChange={(e) => upd("notes", e.target.value)}
          placeholder="The pre-loved kind is welcome, but please nothing visibly worn at the corners. The colour should read warmer in daylight than the reference photograph — closer to a milky coffee."
          rows={4}
          value={form.notes}
        />
        <div className="field-help">
          Anything specific, sentimental, or non-negotiable. Your concierge
          reads every word.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="field">
          <label htmlFor="req-cond">05 · Acceptable condition</label>
          <select
            id="req-cond"
            onChange={(e) => upd("cond", e.target.value)}
            value={form.cond}
          >
            <option>New, unworn — original packaging</option>
            <option>Excellent · pre-loved, no visible wear</option>
            <option>Vintage · any era, original elements only</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="req-deadline">05 · Latest acceptable delivery</label>
          <input
            id="req-deadline"
            onChange={(e) => upd("deadline", e.target.value)}
            placeholder="No rush · or specify a date"
            value={form.deadline}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: FormState }) {
  return (
    <div className="stack-lg">
      <div className="card-paper p-8">
        <div className="row-between items-start">
          <div>
            <div className="eyebrow">File · ready to dispatch</div>
            <h2 className="display mx-0 mt-3 mb-1 font-normal text-[40px] tracking-[-0.015em]">
              <em className="text-accent italic">{form.brand || "Birkett"}</em>{" "}
              {form.model || "Saddle 25 · Étoupe"}
            </h2>
            <div className="muted">
              {form.budgetLow || "USD 10,000"}
              <span className="mx-2 text-ink-3">—</span>
              {form.budgetHi || "USD 14,500"}
              <span className="mx-3">·</span>
              {form.cond}
            </div>
          </div>
          <ImageOrPlaceholder
            alt="Customer reference photograph"
            aspect="none"
            caption="reference"
            id="reference"
            kind="reference"
            sizes="96px"
            style={{ width: 96, height: 96 }}
          />
        </div>
        <div className="hairline my-6" />
        <div className="grid grid-cols-[120px_1fr] gap-[14px] text-[13px]">
          <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
            NOTES
          </div>
          <div>
            {form.notes ||
              "Pre-loved is welcome, nothing visibly worn at corners. Warmer reading than the reference photograph — closer to milky coffee."}
          </div>
          <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
            BY
          </div>
          <div>{form.deadline || "No fixed date"}</div>
          <div className="mono text-[10px] text-ink-3 tracking-[0.14em]">
            CHANNEL
          </div>
          <div className="row flex-wrap gap-[14px]">
            <span>
              Concierge channel · LINE
              <span className="muted ml-[6px] font-mono">@verda_concierge</span>
            </span>
            <span className="tag border-positive text-positive">
              <span className="dot bg-positive" /> connected
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(
          [
            ["T+0", "You submit the file", "Now"],
            ["T+24h", "Your concierge dossier arrives", "Wed · 14 May"],
            ["T+3–6w", "Piece in the vault, ready to ship", "mid · June"],
          ] as const
        ).map(([tlabel, w, when]) => (
          <div className="card-paper p-[18px]" key={tlabel}>
            <div className="mono text-[10px] text-accent tracking-[0.14em]">
              {tlabel}
            </div>
            <div className="display mt-2 text-[17px] leading-[1.2]">{w}</div>
            <div className="mono mt-[6px] text-[10px] text-ink-3 tracking-[0.1em]">
              {when}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RequestClient() {
  const router = useRouter();
  const { ccy } = useLocale();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [runningAI, setRunningAI] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const runAI = () => {
    setRunningAI(true);
    setAiDone(false);
    setTimeout(() => {
      setRunningAI(false);
      setAiDone(true);
    }, AI_DELAY_MS);
  };

  const lines: [string, string, string][] = [
    ["Concierge service fee", "USD 480", "flat — included in quote"],
    ["Authentication & inspection", "USD 120", "two-stage, in Taipei vault"],
    ["Insured carriage", "USD 95", "door-to-door, signature"],
    [
      "Reference exchange",
      `${CCY[ccy].sym} · ${CCY[ccy].rate}`,
      "live · 15-min refresh",
    ],
  ];

  return (
    <div className="fade-in shell">
      <div className="req-header pt-12">
        <div>
          <div className="eyebrow">Concierge file · new</div>
          <h1>
            Request a <em>piece</em>.
          </h1>
        </div>
        <div className="req-step-list">
          <span className="step" data-on={step === 1 ? "1" : "0"}>
            01 The piece
          </span>
          <span className="text-line-2">—</span>
          <span className="step" data-on={step === 2 ? "1" : "0"}>
            02 Details
          </span>
          <span className="text-line-2">—</span>
          <span className="step" data-on={step === 3 ? "1" : "0"}>
            03 Review
          </span>
        </div>
      </div>

      <div className="req">
        <div className="req-form">
          {step === 1 && (
            <UploadStep
              aiDone={aiDone}
              runAI={runAI}
              runningAI={runningAI}
              setUploadPreview={(v) => {
                setUploadPreview(v);
                if (v === null) {
                  setAiDone(false);
                  setRunningAI(false);
                }
              }}
              uploadPreview={uploadPreview}
            />
          )}
          {step === 2 && <DetailsStep form={form} setForm={setForm} />}
          {step === 3 && <ReviewStep form={form} />}
        </div>

        <aside className="req-aside">
          <h4>File preview</h4>
          <div className="price-block">
            <span className="mb-1 block font-mono text-[10px] text-ink-3 tracking-[0.14em]">
              EST. ALL-IN
            </span>
            {formatCcy(13_150, ccy)}
            <div className="mt-[6px] font-sans text-[12px] text-ink-3">
              Indicative — final quote arrives within 24 hours.
            </div>
          </div>
          <div className="breakdown">
            {lines.map(([k, v, s]) => (
              <div className="row" key={k}>
                <div className="k">
                  {k}
                  <div className="mt-[2px] text-[10.5px] text-ink-3 italic">
                    {s}
                  </div>
                </div>
                <div className="v ml-auto">{v}</div>
              </div>
            ))}
          </div>
          <div className="total">
            <div className="k">Hold deposit · refundable</div>
            <div className="v">{formatCcy(200, ccy)}</div>
          </div>
          <div className="mt-[22px] flex gap-[10px]">
            {step > 1 && (
              <button
                className="btn btn-ghost flex-none"
                onClick={() =>
                  setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
                }
                type="button"
              >
                ← back
              </button>
            )}
            {step < 3 ? (
              <button
                className="btn btn-primary flex-1"
                disabled={step === 1 && uploadPreview === null}
                onClick={() =>
                  setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))
                }
                type="button"
              >
                {step === 1 ? "Continue to details" : "Continue to review"}{" "}
                <span>→</span>
              </button>
            ) : (
              <button
                className="btn btn-primary flex-1"
                onClick={() => router.push("/quote")}
                type="button"
              >
                Dispatch file · {formatCcy(200, ccy)} hold
              </button>
            )}
          </div>
          <div className="fine mt-[18px] leading-[1.6]">
            Hold deposit is refunded in full if the quote is declined. We never
            charge it until a dossier is delivered.
          </div>
        </aside>
      </div>
    </div>
  );
}
