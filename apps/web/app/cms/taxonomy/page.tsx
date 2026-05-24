"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";

interface TaxItem {
  id: string;
  name: string;
}

function TaxSection({
  canManage,
  items,
  onAdd,
  onDelete,
  onRename,
  title,
}: {
  canManage: boolean;
  items: TaxItem[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  title: string;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center justify-between border-line border-b px-[18px] py-[12px]">
        <h2 className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]">
          {title}
          <span className="ml-2 text-muted">({items.length})</span>
        </h2>
      </div>
      {error && (
        <div className="border-vermilion border-b bg-vermilion/5 px-[18px] py-2 font-mono text-[11px] text-vermilion">
          {error}
        </div>
      )}
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div
            className="flex items-center gap-3 px-[18px] py-[10px]"
            key={item.id}
          >
            {editing === item.id ? (
              <>
                <input
                  className="flex-1 border border-line bg-paper px-2 py-1 font-sans text-[13px]"
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editValue.trim()) {
                      onRename(item.id, editValue.trim());
                      setEditing(null);
                    }
                    if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                  value={editValue}
                />
                <button
                  className="font-mono text-[10px] text-ink uppercase tracking-[0.12em]"
                  onClick={() => {
                    if (editValue.trim()) {
                      onRename(item.id, editValue.trim());
                    }
                    setEditing(null);
                  }}
                  type="button"
                >
                  Save
                </button>
                <button
                  className="font-mono text-[10px] text-muted uppercase tracking-[0.12em]"
                  onClick={() => setEditing(null)}
                  type="button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-sans text-[13px]">
                  {item.name}
                </span>
                {canManage && (
                  <>
                    <button
                      className="font-mono text-[10px] text-ink uppercase tracking-[0.12em]"
                      onClick={() => {
                        setEditing(item.id);
                        setEditValue(item.name);
                        setError(null);
                      }}
                      type="button"
                    >
                      Rename
                    </button>
                    <button
                      className="font-mono text-[10px] text-vermilion uppercase tracking-[0.12em]"
                      onClick={async () => {
                        setError(null);
                        try {
                          onDelete(item.id);
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "Delete failed"
                          );
                        }
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {canManage && (
        <div className="flex items-center gap-2 border-line border-t px-[18px] py-[10px]">
          <input
            className="flex-1 border border-line bg-paper px-2 py-1 font-sans text-[13px]"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                onAdd(newName.trim());
                setNewName("");
              }
            }}
            placeholder={`New ${title.toLowerCase().slice(0, -1)}…`}
            value={newName}
          />
          <button
            className="bg-ink px-3 py-1 font-mono text-[10px] text-cream uppercase tracking-[0.14em] disabled:opacity-50"
            disabled={!newName.trim()}
            onClick={() => {
              if (newName.trim()) {
                onAdd(newName.trim());
                setNewName("");
              }
            }}
            type="button"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaxonomyPage() {
  const { role } = useCmsAuth();
  const qc = useQueryClient();
  const canManage = can("manage_taxonomy", role);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<TaxItem[]>({
    queryKey: ["cms-categories"],
    queryFn: async () => {
      const res = await fetch("/api/cms/categories", {
        headers: { "x-cms-role": role },
      });
      return res.json();
    },
  });

  const { data: tags = [] } = useQuery<TaxItem[]>({
    queryKey: ["cms-tags"],
    queryFn: async () => {
      const res = await fetch("/api/cms/tags", {
        headers: { "x-cms-role": role },
      });
      return res.json();
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      await fetch("/api/cms/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-categories"] }),
  });

  const renameCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await fetch(`/api/cms/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/categories/${id}`, {
        method: "DELETE",
        headers: { "x-cms-role": role },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
    },
    onSuccess: () => {
      setDeleteError(null);
      qc.invalidateQueries({ queryKey: ["cms-categories"] });
    },
    onError: (e: Error) => setDeleteError(e.message),
  });

  const addTag = useMutation({
    mutationFn: async (name: string) => {
      await fetch("/api/cms/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-tags"] }),
  });

  const renameTag = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await fetch(`/api/cms/tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-tags"] }),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/tags/${id}`, {
        method: "DELETE",
        headers: { "x-cms-role": role },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
    },
    onSuccess: () => {
      setDeleteError(null);
      qc.invalidateQueries({ queryKey: ["cms-tags"] });
    },
    onError: (e: Error) => setDeleteError(e.message),
  });

  return (
    <CmsShell active="settings" breadcrumb="Settings / Taxonomy · 分類">
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Taxonomy<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            カテゴリ・タグ管理
          </span>
        </h1>
        {!canManage && (
          <div className="mt-4 font-mono text-[11px] text-vermilion uppercase tracking-[0.14em]">
            Admin role required to manage taxonomy.
          </div>
        )}
        {deleteError && (
          <div className="mt-4 border border-vermilion bg-vermilion/5 px-4 py-2 font-mono text-[11px] text-vermilion">
            {deleteError}
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 max-[860px]:grid-cols-1">
          <TaxSection
            canManage={canManage}
            items={categories}
            onAdd={(name) => addCategory.mutate(name)}
            onDelete={(id) => deleteCategory.mutate(id)}
            onRename={(id, name) => renameCategory.mutate({ id, name })}
            title="Categories"
          />
          <TaxSection
            canManage={canManage}
            items={tags}
            onAdd={(name) => addTag.mutate(name)}
            onDelete={(id) => deleteTag.mutate(id)}
            onRename={(id, name) => renameTag.mutate({ id, name })}
            title="Tags"
          />
        </div>
      </section>
      <div className="h-10" />
    </CmsShell>
  );
}
