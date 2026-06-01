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
  MessageSquareQuote,
  Inbox,
  CheckCircle2,
  Calendar,
  Package,
  Phone,
  Mail,
} from "lucide-react";
import {
  AdminPageHero,
  StatusBadge,
  ViewToggle,
  EmptyStatePremium,
  type AdminView,
} from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orcamentos")({
  component: Orcamentos,
});

const STATUS = ["novo", "em_andamento", "respondido", "fechado", "perdido"];
const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  respondido: "Respondido",
  fechado: "Fechado",
  perdido: "Perdido",
};
const STATUS_TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  novo: "info",
  em_andamento: "warning",
  respondido: "neutral",
  fechado: "success",
  perdido: "danger",
};

function quoteWhatsappMessage(q: any) {
  let msg = `Olá ${q.customer_name}! Sobre seu pedido de orçamento na NL Foto e Vídeo`;
  if (q.products?.name) {
    msg += ` para o ${q.products.name}`;
    if (q.products.slug) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      msg += `: ${origin}/produto/${q.products.slug}`;
    }
  }
  return `${msg}...`;
}

function Orcamentos() {
  const qc = useQueryClient();
  const [view, setView] = useState<AdminView>("cards");
  const { data } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*, products(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase
      .from("quote_requests")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir orçamento?")) return;
    const { error } = await supabase.from("quote_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido.");
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
  }

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Visão Geral"
        title="Orçamentos"
        subtitle="Atenda clientes, acompanhe interesses e converta solicitações em vendas."
        icon={MessageSquareQuote}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Orçamentos" }]}
        metrics={[
          { label: "Total", value: list.length, icon: MessageSquareQuote },
          { label: "Novos", value: list.filter((q: any) => q.status === "novo").length, icon: Inbox, tone: "info" },
          { label: "Fechados", value: list.filter((q: any) => q.status === "fechado").length, icon: CheckCircle2, tone: "success" },
        ]}
      />

      {list.length === 0 ? (
        <EmptyStatePremium
          icon={MessageSquareQuote}
          title="Nenhum orçamento recebido"
          description="Quando um cliente solicitar um orçamento pelo site, ele aparecerá aqui para você atender."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "solicitação" : "solicitações"}
            </p>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {view === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((q: any) => (
                <div
                  key={q.id}
                  className="hover-lift flex flex-col rounded-[20px] border border-border/70 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {(q.customer_name ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold leading-tight">{q.customer_name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(q.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={STATUS_TONE[q.status] ?? "neutral"}>
                      {STATUS_LABEL[q.status] ?? q.status}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-sm">
                    {q.products?.name && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4 shrink-0" /> {q.products.name}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" /> {q.customer_phone}
                    </p>
                    {q.customer_email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" /> {q.customer_email}
                      </p>
                    )}
                  </div>

                  {q.message && (
                    <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      {q.message}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                    <Select value={q.status} onValueChange={(v) => setStatus(q.id, v)}>
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
                    <Button asChild variant="outline" size="icon" className="rounded-lg">
                      <a
                        href={whatsappTo(q.customer_phone, quoteWhatsappMessage(q))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 text-[#25D366]" />
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-lg" onClick={() => remove(q.id)}>
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <p className="font-medium">{q.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{q.customer_phone}</p>
                        {q.customer_email && (
                          <p className="text-xs text-muted-foreground">{q.customer_email}</p>
                        )}
                      </TableCell>
                      <TableCell>{q.products?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(q.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Select value={q.status} onValueChange={(v) => setStatus(q.id, v)}>
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
                        <Button asChild variant="ghost" size="icon">
                          <a
                            href={whatsappTo(q.customer_phone, quoteWhatsappMessage(q))}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle className="h-4 w-4 text-[#25D366]" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(q.id)}>
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
