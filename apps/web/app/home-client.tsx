"use client";

import { HOUSES, PRODUCTS } from "@verda/data";
import Link from "next/link";
import { TRANSLATIONS } from "../lib/translations";
import { ProductCard } from "./_components/product-card";
import { ImageOrPlaceholder } from "./_components/product-image";
import { useLocale } from "./providers";

function HeroA() {
  const { lang } = useLocale();
  const t = TRANSLATIONS[lang];
  const h = t.headline;
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">{t.hero.eyebrow}</div>
        <h1 className="hero-headline mt-[22px]">
          {h.line1}
          <br />
          {h.line2}
          <br />
          {h.line3}{" "}
          <em>
            {h.line4em.split("\n").map((seg, i, arr) => (
              <span key={seg}>
                {seg}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </em>
        </h1>
        <p className="hero-sub">{t.hero.sub}</p>
        <div className="hero-cta">
          <Link className="btn btn-primary" href="/request">
            {t.cta.request} <span>→</span>
          </Link>
          <Link className="btn btn-ghost" href="/collection">
            {t.cta.browse}
          </Link>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-cell">
            <div className="num display">2,418</div>
            <div className="lbl">pieces sourced last quarter</div>
          </div>
          <div className="hero-meta-cell">
            <div className="num display">
              36
              <span className="ml-1 text-[14px] text-ink-3">hr</span>
            </div>
            <div className="lbl">median time to first dossier</div>
          </div>
          <div className="hero-meta-cell">
            <div className="num display">
              98.4
              <span className="ml-1 text-[14px] text-ink-3">%</span>
            </div>
            <div className="lbl">authenticated on first inspection</div>
          </div>
        </div>
      </div>
      <ImageOrPlaceholder
        alt="A sourced Birkett Saddle 25 in Étoupe, photographed in studio"
        aspect="3x4"
        brackets
        caption="hero · sourced piece, hand-styled"
        id="p1"
        kind="products"
        priority
        sizes="(min-width: 1280px) 40vw, 100vw"
        style={{ minHeight: 480 }}
      />
    </section>
  );
}

function Maisons() {
  return (
    <section className="section py-8">
      <div className="shell">
        <div className="maisons">
          {HOUSES.map((h) => (
            <span className="house" key={h}>
              {h}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const { lang } = useLocale();
  const t = TRANSLATIONS[lang].process;
  return (
    <section className="section">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">{t.kicker}</div>
            <h2 className="mt-[14px]">
              <em>{t.title}</em>
            </h2>
          </div>
          <div className="meta">
            Every file is handled by one concierge from request to delivery. You
            will know their name, their voice, and their working hours.
          </div>
        </div>
        <div className="process-list">
          {t.steps.map((s) => (
            <div className="step" key={s.n}>
              <div className="num">{s.n}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Collection() {
  return (
    <section className="section">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">In rotation · May</div>
            <h2 className="mt-[14px]">
              Eight quiet <em>arrivals</em>.
            </h2>
          </div>
          <div className="meta">
            Updated as files close. Marked{" "}
            <span className="mono text-ink-2">IN VAULT</span> if confirmed in
            Taipei; <span className="mono text-accent">ESTIMATED</span> if
            sourcing on quote.
          </div>
        </div>
        <div className="grid-4">
          {PRODUCTS.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AtelierNote() {
  return (
    <section className="section">
      <div className="shell">
        <div className="atelier-note">
          <div>
            <div className="eyebrow">A note from the atelier</div>
            <h3 className="mt-[14px]">
              We work in <em>three languages</em>,<br />
              five currencies, and one voice.
            </h3>
          </div>
          <div>
            <p className="mb-4">
              Switch currency at any moment — every figure on the platform
              reflects the live mid-market rate, refreshed every fifteen minutes
              and marked with a timestamp. We hold orders in the currency we
              paid, then settle at delivery, so a swing in the yen never reaches
              your invoice unannounced.
            </p>
            <button className="btn btn-link" type="button">
              Read how we handle exchange-rate risk
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tiers() {
  const tiers = [
    {
      name: "Normal",
      it: false,
      cur: false,
      spend: "No minimum",
      bens: [
        "One concierge channel",
        "Quotes within 36 hours",
        "Insured shipping at cost",
      ],
    },
    {
      name: "Professional",
      it: true,
      cur: true,
      spend: "NT$ 600,000 / year",
      bens: [
        "Dedicated concierge",
        "Quotes within 12 hours",
        "Complimentary shipping & duties",
        "Quarterly atelier preview",
      ],
    },
    {
      name: "Diamond",
      it: true,
      cur: false,
      spend: "By invitation",
      bens: [
        "Pair of concierges, 24/7",
        "Trunk-show priority access",
        "Private viewings, Taipei vault",
        "Lifetime resale-buyback offer",
      ],
    },
  ];
  return (
    <section className="section">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">Three memberships</div>
            <h2 className="mt-[14px]">
              Choose the rhythm <em>of your file</em>.
            </h2>
          </div>
          <div className="meta">
            Upgrade happens quietly — based on a year of activity, never on a
            sales call.
            <br />
            Downgrade is just as discreet.
          </div>
        </div>
        <div className="tiers">
          {tiers.map((tt) => (
            <div className={`tier ${tt.cur ? "cur" : ""}`} key={tt.name}>
              <div className="badge">{tt.cur ? "— your tier" : tt.spend}</div>
              <div className="name">{tt.it ? <em>{tt.name}</em> : tt.name}</div>
              <ul>
                {tt.bens.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeClient() {
  return (
    <div className="fade-in">
      <div className="shell">
        <HeroA />
      </div>
      <Maisons />
      <Process />
      <Collection />
      <AtelierNote />
      <Tiers />
    </div>
  );
}
