import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { whatsappTo } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MessageCircle, Trash2 } from "lucide-react";
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

function Orcamentos() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*, products(name)")
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

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Solicitações recebidas pelo site.
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
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
            {(data ?? []).map((q: any) => (
              <TableRow key={q.id}>
                <TableCell>
                  <p className="font-medium">{q.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{q.customer_phone}</p>
                  {q.customer_email && (
                    <p className="text-xs text-muted-foreground">{q.customer_email}</p>
                  )}
                  {q.message && (
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">{q.message}</p>
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
                      href={whatsappTo(
                        q.customer_phone,
                        `Olá ${q.customer_name}! Sobre seu pedido de orçamento na NL Foto e Vídeo...`,
                      )}
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
        {(data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum orçamento recebido.
          </p>
        )}
      </div>
    </div>
  );
}
