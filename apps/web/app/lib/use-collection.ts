"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "./auth";
import { track } from "./track";

export function useCollectionIds() {
  const { member } = useAuth();
  const id = member?.id ?? "";
  return useQuery({
    queryKey: ["collectionIds", id],
    enabled: !!member,
    queryFn: async () => {
      const res = await fetch(
        `/api/collections?memberId=${encodeURIComponent(id)}`
      );
      const data = await res.json();
      return (data.collections as { articleId: string }[]).map(
        (c) => c.articleId
      );
    },
  });
}

export function useToggleSave(articleId: string) {
  const { member } = useAuth();
  const qc = useQueryClient();
  const id = member?.id ?? "";
  const key = ["collectionIds", id];

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: id, articleId }),
      });
      return res.json();
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, [...prev, articleId]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(key, ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["growth"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  const unsave = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/collections?memberId=${encodeURIComponent(id)}&articleId=${encodeURIComponent(articleId)}`,
        { method: "DELETE" }
      );
      return res.json();
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(
        key,
        prev.filter((x) => x !== articleId)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(key, ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });

  const isSaved = (qc.getQueryData<string[]>(key) ?? []).includes(articleId);

  const toggle = useCallback(() => {
    if (!member) {
      return;
    }
    if (isSaved) {
      track("story_uncollect", { articleId });
      unsave.mutate();
    } else {
      track("story_collect", { articleId });
      save.mutate();
    }
  }, [member, isSaved, articleId, save, unsave]);

  return { isSaved, toggle };
}
