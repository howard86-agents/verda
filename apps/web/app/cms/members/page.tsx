"use client";

// CMS · Member admin list. Search by id / name / email; soft-deleted
// members are filtered out server-side. Each row links to the detail
// view, where customer-service / admin can adjust points or remove
// the member.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { IconSearch } from "@/_components/glyphs";

interface MemberRow {
  balance: number;
  deletedAt: string | null;
  email: string;
  id: string;
  joined: string;
  level: number;
  name: string;
}

interface MemberListResponse {
  items: MemberRow[];
  total: number;
}

const GRID = "grid-cols-[1.5fr_1.6fr_1fr_0.8fr_0.8fr]";

export default function CmsMembersPage() {
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cms-members", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) {
        params.set("q", query);
      }
      const res = await fetch(`/api/cms/members?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load members");
      }
      return (await res.json()) as MemberListResponse;
    },
  });

  const items = data?.items ?? [];

  return (
    <CmsShell active="members" breadcrumb="Members · 会員">
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Members<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            会員管理
          </span>
        </h1>

        {/* Search bar */}
        <div className="mt-[22px] flex items-center gap-3 border-line border-t border-b py-3">
          <div className="flex w-full max-w-[420px] items-center gap-2 border border-line bg-paper px-3 py-[7px] text-[12px] text-muted">
            <IconSearch size={16} />
            <input
              aria-label="Search members"
              className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-muted"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, name or email…"
              type="search"
              value={query}
            />
          </div>
          <span className="ml-auto font-mono text-[10.5px] text-muted uppercase tracking-[0.16em]">
            {isLoading ? "Loading…" : `${items.length} active`}
          </span>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto border border-line bg-paper">
          <div className="min-w-[760px]">
            <div
              className={`grid ${GRID} items-center gap-4 border-ink border-b px-4 py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.16em]`}
            >
              <span>Member</span>
              <span>Email</span>
              <span>Joined</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Level</span>
            </div>
            {items.length === 0 && !isLoading && (
              <div className="px-4 py-8 text-center font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                {query ? "No members match your search" : "No members"}
              </div>
            )}
            {items.map((m) => (
              <Link
                className={`grid ${GRID} items-center gap-4 border-line border-b px-4 py-[14px] font-sans hover:bg-vermilion/[0.04]`}
                href={`/cms/members/${m.id}`}
                key={m.id}
              >
                <div>
                  <div className="font-display font-medium text-[15.5px] leading-[1.2]">
                    {m.name}
                  </div>
                  <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
                    {m.id}
                  </div>
                </div>
                <span className="text-[12.5px]">{m.email}</span>
                <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                  {m.joined}
                </span>
                <span className="text-right font-display font-medium text-[18px] text-vermilion">
                  {m.balance}
                </span>
                <span className="text-right font-mono text-[11px] text-ink uppercase tracking-[0.12em]">
                  Lv {String(m.level).padStart(2, "0")}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-[18px] pb-10 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
          Soft-deleted members are hidden from this list and remain in the audit
          log.
        </div>
      </section>
    </CmsShell>
  );
}
