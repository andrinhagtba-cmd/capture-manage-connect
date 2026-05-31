import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { whatsappUrl } from "@/lib/site";
import { track } from "@/lib/analytics";
import { MessageCircle } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  email: z.string().trim().email("E-mail inválido").max(255).or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
});

export function QuoteDialog({
  productId,
  productName,
  brandName,
  trigger,
}: {
  productId?: string;
  productName?: string;
  brandName?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      track("quote_request_started", {
        product_id: productId ?? null,
        content_name: productName ?? null,
        content_category: brandName ?? null,
      });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { data: quote, error } = await supabase
        .from("quote_requests")
        .insert({
          product_id: productId ?? null,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || null,
          message: form.message || null,
          preferred_contact_method: "whatsapp",
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // Also register a lead for the CRM
      await supabase.from("leads").insert({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        source: "orcamento",
        interest_brand: brandName ?? null,
        message: productName ? `Orçamento: ${productName}` : form.message || null,
      });
      track("quote_request_submitted", {
        product_id: productId ?? null,
        quote_request_id: quote?.id ?? null,
        content_name: productName ?? null,
        content_category: brandName ?? null,
      });
      toast.success("Solicitação enviada! Em breve entraremos em contato.");
      const waMsg = `Olá! Gostaria de um orçamento${
        productName ? ` para o ${productName}` : ""
      }. Meu nome é ${form.name}.`;
      track("whatsapp_click", { product_id: productId ?? null, metadata: { origin: "quote_dialog" } });
      window.open(whatsappUrl(waMsg), "_blank");
      setOpen(false);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Solicitar orçamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar orçamento</DialogTitle>
          <DialogDescription>
            {productName
              ? `Receba uma proposta personalizada para o ${productName}.`
              : "Conte o que você procura e nossa equipe retorna com a melhor condição."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="q-name">Nome *</Label>
            <Input
              id="q-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-phone">WhatsApp / Telefone *</Label>
            <Input
              id="q-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(61) 9 0000-0000"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-email">E-mail</Label>
            <Input
              id="q-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-msg">Mensagem</Label>
            <Textarea
              id="q-msg"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Detalhes, quantidade, prazo..."
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <MessageCircle className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar e abrir WhatsApp"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
