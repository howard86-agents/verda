"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type CmsRole = "editor" | "publisher" | "admin" | "customer-service";

export type CmsAction =
  | "create_draft"
  | "edit_draft"
  | "publish"
  | "unpublish"
  | "manage_taxonomy"
  | "manage_rules"
  | "point_adjust"
  | "member_delete"
  | "upload_media";

const POLICY: Record<CmsAction, CmsRole[]> = {
  create_draft: ["editor", "publisher", "admin"],
  edit_draft: ["editor", "publisher", "admin"],
  publish: ["publisher", "admin"],
  unpublish: ["publisher", "admin"],
  manage_taxonomy: ["admin"],
  manage_rules: ["admin"],
  point_adjust: ["admin", "customer-service"],
  member_delete: ["admin"],
  upload_media: ["editor", "publisher", "admin"],
};

export function can(action: CmsAction, role: CmsRole): boolean {
  return POLICY[action].includes(role);
}

const ADMIN_IDS: Record<CmsRole, string> = {
  editor: "admin_editor_01",
  publisher: "admin_publisher_01",
  admin: "admin_admin_01",
  "customer-service": "admin_cs_01",
};

export function adminIdFor(role: CmsRole): string {
  return ADMIN_IDS[role];
}

interface CmsAuthCtx {
  adminId: string;
  role: CmsRole;
  setRole: (role: CmsRole) => void;
}

const CmsAuthContext = createContext<CmsAuthCtx | null>(null);

const CMS_ROLE_KEY = "verda.cms.role";

export function CmsAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<CmsRole>(() => {
    if (typeof window === "undefined") {
      return "editor";
    }
    return (localStorage.getItem(CMS_ROLE_KEY) as CmsRole) || "editor";
  });

  const setRole = useCallback((r: CmsRole) => {
    setRoleState(r);
    localStorage.setItem(CMS_ROLE_KEY, r);
  }, []);

  const value = useMemo(
    () => ({ role, setRole, adminId: adminIdFor(role) }),
    [role, setRole]
  );

  return (
    <CmsAuthContext.Provider value={value}>{children}</CmsAuthContext.Provider>
  );
}

export function useCmsAuth(): CmsAuthCtx {
  const ctx = useContext(CmsAuthContext);
  if (!ctx) {
    throw new Error("useCmsAuth must be used within CmsAuthProvider");
  }
  return ctx;
}
