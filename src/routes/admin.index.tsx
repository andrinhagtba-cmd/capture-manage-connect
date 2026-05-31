import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, MessageSquareQuote, Users, Star } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function useCounts() {
  return useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [products, featured, quotesNew, leadsNew, recentQuotes] =
        await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("is_featured", true),
          supabase
            .from("quote_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "novo"),
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("status", "novo"),
          supabase
            .from("quote_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
      return {
        products: products.count ?? 0,
        featured: featured.count ?? 0,
        quotesNew: quotesNew.count ?? 0,
        leadsNew: leadsNew.count ?? 0,
        recentQuotes: recentQuotes.data ?? [],
      };
    },
  });
}

function Dashboard() {
  const { data } = useCounts();
  const cards = [
    { label: "Produtos cadastrados", value: data?.products ?? 0, icon: Package, to: "/admin/produtos" },
    { label: "Produtos em destaque", value: data?.featured ?? 0, icon: Star, to: "/admin/produtos" },
    { label: "Orçamentos novos", value: data?.quotesNew ?? 0, icon: MessageSquareQuote, to: "/admin/orcamentos" },
    { label: "Leads novos", value: data?.leadsNew ?? 0, icon: Users, to: "/admin/leads" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visão geral da operação da NL Foto e Vídeo.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="hover-lift rounded-xl border border-border bg-card p-5"
          >
            <c.icon className="h-6 w-6 text-primary" />
            <p className="mt-4 text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Últimos orçamentos</h2>
          <Link to="/admin/orcamentos" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {(data?.recentQuotes ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum orçamento ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {(data?.recentQuotes ?? []).map((q: any) => (
              <li key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{q.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{q.customer_phone}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
