import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor" | "vendedor";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          // Defer role check to avoid deadlock inside callback
          setTimeout(() => loadRoles(sess.user.id), 0);
        } else {
          setRoles([]);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadRoles(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadRoles(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const list = (data ?? [])
      .map((r) => r.role as AppRole)
      .filter((r) => ["admin", "editor", "vendedor"].includes(r));
    setRoles(list);
  }

  const isStaff = roles.length > 0;
  const isAdmin = roles.includes("admin");
  const hasRole = (role: AppRole) => roles.includes(role);

  return { session, user, roles, isStaff, isAdmin, hasRole, loading };
}
