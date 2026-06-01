import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { whatsappTo } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageCircle,
  Trash2,
  Users,
  Inbox,
  CheckCircle2,
  Phone,
  Mail,
  Tag,
} from "lucide-react";
import {
  AdminPageHero,
  StatusBadge,
  ViewToggle,
  EmptyStatePremium,
  type AdminView,
} from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  component: Leads,
});

const STATUS = ["novo", "contatado", "qualificado", "convertido", "perdido"];
const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  convertido: "Convertido",
  perdido: "Perdido",
};
const STATUS_TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  novo: "info",
  contatado: "warning",
  qualificado: "neutral",
  convertido: "success",
  perdido: "danger",
};

function Leads() {
  const qc = useQueryClient();
  const [view, setView] = useState<AdminView>("cards");
  const { data } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido.");
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
  }

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Visão Geral"
        title="Leads e CRM"
        subtitle="Acompanhe contatos captados pelo site, qualifique interesses e converta em vendas."
        icon={Users}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Leads / CRM" }]}
        metrics={[
          { label: "Total", value: list.length, icon: Users },
          { label: "Novos", value: list.filter((l: any) => l.status === "novo").length, icon: Inbox, tone: "info" },
          { label: "Convertidos", value: list.filter((l: any) => l.status === "convertido").length, icon: CheckCircle2, tone: "success" },
        ]}
      />

      {list.length === 0 ? (
        <EmptyStatePremium
          icon={Users}
          title="Nenhum lead cadastrado"
          description="Os contatos captados pelos formulários do site aparecerão aqui para você qualificar e converter."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "contato" : "contatos"}
            </p>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {view === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((l: any) => (
                <div
                  key={l.id}
                  className="hover-lift flex flex-col rounded-[20px] border border-border/70 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {(l.name ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold leading-tight">{l.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.source ?? "Origem desconhecida"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={STATUS_TONE[l.status] ?? "neutral"}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-sm">
                    {l.phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" /> {l.phone}
                      </p>
                    )}
                    {l.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" /> {l.email}
                      </p>
                    )}
                    {l.interest_brand && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4 shrink-0" /> {l.interest_brand}
                      </p>
                    )}
                  </div>

                  {l.message && (
                    <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      {l.message}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                    <Select value={l.status} onValueChange={(v) => setStatus(l.id, v)}>
                      <SelectTrigger className="h-9 flex-1 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {l.phone && (
                      <Button asChild variant="outline" size="icon" className="rounded-lg">
                        <a
                          href={whatsappTo(l.phone, `Olá ${l.name}! Aqui é da NL Foto e Vídeo.`)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 text-[#25D366]" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="rounded-lg" onClick={() => remove(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[20px] border border-border/70 bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="font-medium">{l.name}</p>
                        {l.message && (
                          <p className="max-w-xs text-xs text-muted-foreground">{l.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <p>{l.phone}</p>
                        {l.email && <p className="text-muted-foreground">{l.email}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.source ?? "—"}
                        {l.interest_brand && ` · ${l.interest_brand}`}
                      </TableCell>
                      <TableCell>
                        <Select value={l.status} onValueChange={(v) => setStatus(l.id, v)}>
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {l.phone && (
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={whatsappTo(l.phone, `Olá ${l.name}! Aqui é da NL Foto e Vídeo.`)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="h-4 w-4 text-[#25D366]" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
