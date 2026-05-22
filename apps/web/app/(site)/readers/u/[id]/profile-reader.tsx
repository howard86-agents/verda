"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { Plant } from "@/_components/plant";
import type { PublicReaderProfile } from "@/lib/reader-profile";

/**
 * Public reader-profile reader (issue #103).
 *
 * Mirrors the `/readers/[slug]` and `/topics/[id]` patterns: a
 * client-side `useQuery` against the public profile endpoint, with
 * dedicated loading / error / not-found states. The endpoint already
 * filters out email and the private nutrient ledger, so this surface
 * is privacy-safe by construction — it can only render what the
 * payload type carries.
 */
export function ProfileReader({ id }: { id: string }) {
  const profileQuery = useQuery<PublicReaderProfile, Error>({
    queryKey: ["reader-profile", id],
    queryFn: async () => {
      const res = await fetch(`/api/readers/u/${encodeURIComponent(id)}`);
      if (res.status === 404) {
        throw new Error("not_found");
      }
      if (!res.ok) {
        throw new Error(`Failed to load profile (${res.status})`);
      }
      return (await res.json()) as PublicReaderProfile;
    },
  });

  if (profileQuery.isLoading) {
    return <ProfileLoading />;
  }
  if (profileQuery.isError) {
    if (profileQuery.error.message === "not_found") {
      notFound();
    }
    return <ProfileError />;
  }
  const profile = profileQuery.data;
  if (!profile) {
    notFound();
  }
  return <ProfileBody profile={profile} />;
}

function ProfileLoading() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
          Loading profile…
        </p>
      </div>
    </div>
  );
}

function ProfileError() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.16em]">
          Failed to load profile.
        </p>
      </div>
    </div>
  );
}

function ProfileBody({ profile }: { profile: PublicReaderProfile }) {
  const initial = profile.member.name.trim().charAt(0).toUpperCase() || "?";
  const submissionCount = profile.submissions.length;

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Title block */}
        <section className="pt-10">
          <Eyebrow en="Reader profile · 読者の頁" jp="プロフィール" />
          <div className="mt-[14px] grid grid-cols-[auto_1fr_auto] items-end gap-7 max-[640px]:grid-cols-1 max-[640px]:items-start">
            <div className="flex h-[88px] w-[88px] items-center justify-center bg-ink font-display text-[42px] text-cream">
              {initial}
            </div>
            <div>
              <h1 className="font-display font-medium text-[56px] leading-[1.04] tracking-[-0.02em] max-[640px]:text-[40px]">
                {profile.member.name}
                <span className="text-vermilion">.</span>
              </h1>
              <p className="mt-2 font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
                {profile.member.joined}
              </p>
            </div>
            {profile.growth && (
              <div className="flex items-center gap-3 border border-ink bg-paper px-[18px] py-[14px]">
                <Plant level={profile.growth.level} size={56} />
                <div>
                  <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                    Plant · 育成中
                  </div>
                  <div className="mt-[4px] font-display font-medium text-[20px] leading-[1.1]">
                    Lv {String(profile.growth.level).padStart(2, "0")} ·{" "}
                    {profile.growth.name}
                  </div>
                  <div className="mt-[2px] font-display text-[13px] text-muted italic">
                    {profile.growth.jp}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Submissions list */}
        <section className="mt-12 border-t border-t-ink pt-7">
          <div className="flex items-baseline justify-between border-line border-b pb-3">
            <div>
              <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                Index · approved
              </div>
              <div className="mt-1 font-display font-medium text-[28px] tracking-[-0.005em]">
                Reader submissions
                <span className="ml-3 font-display text-[16px] text-muted italic">
                  {String(submissionCount).padStart(2, "0")} pieces
                </span>
              </div>
            </div>
            <Link
              className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
              href="/readers"
            >
              ← Browse all
            </Link>
          </div>

          {submissionCount === 0 ? (
            <div className="flex min-h-[24vh] items-center justify-center">
              <p className="font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
                No approved submissions yet.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-3 gap-7 max-[640px]:grid-cols-1 max-[900px]:grid-cols-2">
              {profile.submissions.map((s, i) => (
                <article className="flex flex-col" key={s.id}>
                  <Link className="relative" href={`/readers/${s.slug}`}>
                    <CoverImage
                      alt={s.title}
                      className="aspect-[4/5]"
                      gradient={s.img}
                      id={s.id}
                      kind="social"
                      sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 30vw"
                    />
                    <div className="absolute top-3 left-3 z-10 font-display font-medium text-[24px] text-white leading-none [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </Link>
                  <div className="mt-3 border-line border-b pb-4">
                    <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                      {s.kind} · {s.date}
                    </div>
                    <h3 className="mt-[6px] font-display font-medium text-[20px] leading-[1.15]">
                      <Link href={`/readers/${s.slug}`}>{s.title}</Link>
                    </h3>
                    {s.tag && (
                      <span className="mt-2 inline-block border-ink border-b pb-px font-mono text-[10px] text-ink tracking-[0.12em]">
                        #{s.tag}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
