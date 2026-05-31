import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — NL Foto e Vídeo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsuariosAdmin,
});

const ROLES: { key: AppRole; label: string; desc: string }[] = [
  { key: "admin", label: "Administrador", desc: "Acesso total ao painel" },
  { key: "editor", label: "Editor", desc: "Conteúdo, páginas, banners e produtos" },
  { key: "vendedor", label: "Vendedor", desc: "Apenas leads e orçamentos" },
];

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: AppRole[];
}

function useUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserRow[]> => {
      const [{ data: profiles }, { data: userRoles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map<string, AppRole[]>();
      (userRoles ?? []).forEach((r) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        map.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        roles: map.get(p.id) ?? [],
      }));
    },
  });
}

function UsuariosAdmin() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const { data: users, isLoading } = useUsers();

  async function toggleRole(userId: string, role: AppRole, enabled: boolean) {
    if (enabled) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) return toast.error(error.message);
    }
    toast.success("Permissões atualizadas");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-bold">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apenas administradores podem gerenciar usuários e permissões.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários e Permissões</h1>
        <p className="text-sm text-muted-foreground">
          Defina o papel de cada usuário. Administrador edita tudo; Editor cuida
          do conteúdo; Vendedor acessa apenas leads e orçamentos.
        </p>
      </div>

      <div className="space-y-4">
        {(users ?? []).map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4">
              <p className="font-semibold">
                {u.full_name || "Sem nome"}
                {u.id === user?.id && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    você
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">{u.email}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {ROLES.map((r) => {
                const checked = u.roles.includes(r.key);
                const selfAdmin = u.id === user?.id && r.key === "admin";
                return (
                  <div
                    key={r.key}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Switch
                      checked={checked}
                      disabled={selfAdmin}
                      onCheckedChange={(v) => toggleRole(u.id, r.key, v)}
                    />
                    <div>
                      <Label className="text-sm">{r.label}</Label>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {(users ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
