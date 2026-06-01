import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CoreSpinLoader } from "@/components/ui/core-spin-loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  MessageSquareQuote,
  Users,
  LogOut,
  Camera,
  ExternalLink,
  Building2,
  PanelBottom,
  Menu as MenuIcon,
  Image as ImageIcon,
  GalleryHorizontalEnd,
  Home as HomeIcon,
  Tag,
  FileText,
  UserCog,
  Megaphone,
  Search,
  Plus,
  Upload,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel — NL Foto e Vídeo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

import logoNlFull from "@/assets/logo-nl-full.png";
import logoNlEmblem from "@/assets/logo-nl-emblem.png";

type RoleGate = "any" | "admin" | "content";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  gate: RoleGate;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true, gate: "any" },
      { title: "Orçamentos", url: "/admin/orcamentos", icon: MessageSquareQuote, gate: "any" },
      { title: "Leads / CRM", url: "/admin/leads", icon: Users, gate: "any" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/admin/produtos", icon: Package, gate: "content" },
      { title: "Páginas de Marca", url: "/admin/marcas", icon: Tag, gate: "content" },
    ],
  },
  {
    label: "Conteúdo do Site",
    items: [
      { title: "Banners e Heros", url: "/admin/banners", icon: GalleryHorizontalEnd, gate: "content" },
      { title: "Home Page", url: "/admin/home", icon: HomeIcon, gate: "content" },
      { title: "Páginas do Site", url: "/admin/paginas", icon: FileText, gate: "content" },
      { title: "Footer", url: "/admin/footer", icon: PanelBottom, gate: "content" },
      { title: "Menu / Navegação", url: "/admin/menu", icon: MenuIcon, gate: "content" },
      { title: "Biblioteca de Mídia", url: "/admin/midia", icon: ImageIcon, gate: "content" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Marketing e Pixels", url: "/admin/marketing", icon: Megaphone, gate: "admin" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Configurações da Empresa", url: "/admin/empresa", icon: Building2, gate: "content" },
      { title: "Usuários", url: "/admin/usuarios", icon: UserCog, gate: "admin" },
    ],
  },
];

function AdminLayout() {
  const { loading, session, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!session || !isStaff)) {
      navigate({ to: "/login" });
    }
  }, [loading, session, isStaff, navigate]);

  if (loading || !session || !isStaff) {
    return <CoreSpinLoader text="Carregando painel..." />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 space-y-6 p-4 md:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminTopbar() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const roleLabel = roles.includes("admin")
    ? "Administrador"
    : roles.includes("editor")
      ? "Editor"
      : "Vendedor";

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger />

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar no painel…"
          className="h-10 w-full rounded-[14px] border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="hidden gap-2 rounded-xl sm:inline-flex">
          <Link to="/admin/produtos">
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="hidden gap-2 rounded-xl lg:inline-flex">
          <Link to="/admin/midia">
            <Upload className="h-4 w-4" /> Mídia
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="gap-2 rounded-xl">
          <Link to="/" target="_blank">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Ver site</span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 transition-colors hover:bg-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-bold text-background">
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-xs font-semibold">
                {email}
              </span>
              <span className="block text-[10px] text-muted-foreground">{roleLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/usuarios">
                <UserCog className="mr-2 h-4 w-4" /> Usuários e permissões
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" /> Ver site público
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, hasRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isActive = (url: string, exact?: boolean) =>
    exact ? path === url : path.startsWith(url);

  const canContent = isAdmin || hasRole("editor");

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        label: g.label,
        items: g.items.filter((item) => {
          if (item.gate === "admin") return isAdmin;
          if (item.gate === "content") return canContent;
          return true;
        }),
      })).filter((g) => g.items.length > 0),
    [isAdmin, canContent],
  );

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-2.5 px-4 py-5">
          {collapsed ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-primary/20">
              <img src={logoNlEmblem} alt="NL Foto e Vídeo" className="h-full w-full object-contain p-0.5" />
            </span>
          ) : (
            <span className="flex w-full items-center justify-center rounded-xl bg-white px-3 py-2 shadow-lg shadow-primary/20">
              <img src={logoNlFull} alt="NL Foto e Vídeo" className="h-7 w-auto object-contain" />
            </span>
          )}
        </div>

        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/40">
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url, item.exact);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
