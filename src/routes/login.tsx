import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCompanySettings } from "@/lib/site-content";
import { COMPANY_NAME } from "@/lib/site";
import logoNlLight from "@/assets/logo-nl-light.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Área administrativa — NL Foto e Vídeo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { session, isStaff, loading } = useAuth();
  const { data: company } = useCompanySettings();
  const companyName = company?.company_name || COMPANY_NAME;
  const logoSrc = company?.logo_url || logoNlLight;
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && isStaff) {
      navigate({ to: "/admin" });
    }
  }, [loading, session, isStaff, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/admin",
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode acessar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao autenticar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full bg-surface-dark lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Left: cinematic video ===== */}
      <aside className="relative hidden overflow-hidden lg:block">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
        >
          <source src="/videos/auth-brand.webm" type="video/webm" />
        </video>

        {/* gradients for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/70" />

        {/* top brand */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink p-1.5">
              <img src={logoSrc} alt={companyName} className="h-full w-full object-contain" />
            </span>
            <span className="text-lg font-bold text-white">
              {companyName.split(" ")[0]}{" "}
              <span className="text-primary">{companyName.split(" ").slice(1).join(" ")}</span>
            </span>
          </Link>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            Painel ERP
          </span>
        </div>

        {/* bottom headline */}
        <div className="absolute inset-x-0 bottom-0 p-10 lg:p-14">
          <h2 className="font-cta text-5xl leading-[0.92] text-white xl:text-6xl">
            Gestão
            <br />
            <span className="text-primary">profissional</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Controle total do seu catálogo, marcas, leads e conteúdo do site em um
            painel premium feito para a NL Foto e Vídeo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: "Seguro" },
              { icon: Zap, label: "Rápido" },
              { icon: Sparkles, label: "Premium" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/85 backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ===== Right: form ===== */}
      <main className="relative flex flex-col bg-background lg:items-center lg:justify-center lg:px-8 lg:py-10">
        {/* mobile video hero */}
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden lg:hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
          >
            <source src="/videos/auth-brand.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/45 to-black/40" />

          <Link
            to="/"
            className="absolute left-5 top-5 flex items-center gap-1.5 text-sm text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>

          <div className="absolute inset-x-0 bottom-0 p-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink p-1.5">
                <img src={logoSrc} alt={companyName} className="h-full w-full object-contain" />
              </span>
              <span className="text-base font-bold text-white">
                {companyName.split(" ")[0]}{" "}
                <span className="text-primary">{companyName.split(" ").slice(1).join(" ")}</span>
              </span>
            </Link>
            <h2 className="font-cta mt-3 text-3xl leading-[0.95] text-white">
              Gestão <span className="text-primary">profissional</span>
            </h2>
          </div>
        </div>

        <Link
          to="/"
          className="absolute left-8 top-6 hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <div className="w-full max-w-md animate-fade-up px-5 py-8 sm:px-8 lg:p-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {mode === "login" ? "Acesso restrito" : "Novo acesso"}
          </div>

          <h1 className="font-cta text-4xl leading-none text-foreground">
            {mode === "login" ? "Bem-vindo" : "Criar conta"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse o painel de gestão da NL Foto e Vídeo."
              : "Cadastre-se para acessar o painel administrativo."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                className="h-11"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                className="h-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              className="font-cta h-12 w-full text-sm tracking-wider"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <span className="font-semibold text-primary">Cadastre-se</span>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <span className="font-semibold text-primary">Entrar</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
