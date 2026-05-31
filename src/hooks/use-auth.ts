import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          // Defer role check to avoid deadlock inside callback
          setTimeout(() => checkStaff(sess.user.id), 0);
        } else {
          setIsStaff(false);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) checkStaff(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkStaff(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const staff = (data ?? []).some((r) =>
      ["admin", "editor", "vendedor"].includes(r.role as string),
    );
    setIsStaff(staff);
  }

  return { session, user, isStaff, loading };
}
