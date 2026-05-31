import { createFileRoute } from "@tanstack/react-router";
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
import { MessageCircle, Trash2 } from "lucide-react";
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

function Leads() {
  const qc = useQueryClient();
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

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Leads / CRM</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Contatos captados pelo site e formulários.
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
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
            {(data ?? []).map((l: any) => (
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
        {(data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum lead cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
