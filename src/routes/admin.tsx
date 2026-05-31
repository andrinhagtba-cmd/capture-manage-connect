import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  MessageSquareQuote,
  Users,
  LogOut,
  Camera,
  Loader2,
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

type RoleGate = "any" | "admin" | "content";

const NAV: {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  gate: RoleGate;
}[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true, gate: "any" },
  { title: "Produtos", url: "/admin/produtos", icon: Package, gate: "content" },
  { title: "Páginas de Marca", url: "/admin/marcas", icon: Tag, gate: "content" },
  { title: "Banners e Heros", url: "/admin/banners", icon: GalleryHorizontalEnd, gate: "content" },
  { title: "Home Page", url: "/admin/home", icon: HomeIcon, gate: "content" },
  { title: "Páginas do Site", url: "/admin/paginas", icon: FileText, gate: "content" },
  { title: "Configurações da Empresa", url: "/admin/empresa", icon: Building2, gate: "content" },
  { title: "Footer", url: "/admin/footer", icon: PanelBottom, gate: "content" },
  { title: "Menu / Navegação", url: "/admin/menu", icon: MenuIcon, gate: "content" },
  { title: "Biblioteca de Mídia", url: "/admin/midia", icon: ImageIcon, gate: "content" },
  { title: "Orçamentos", url: "/admin/orcamentos", icon: MessageSquareQuote, gate: "any" },
  { title: "Leads / CRM", url: "/admin/leads", icon: Users, gate: "any" },
  { title: "Usuários", url: "/admin/usuarios", icon: UserCog, gate: "admin" },
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
            <SidebarTrigger />
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/" target="_blank">
                Ver site <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </header>
          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isActive = (url: string, exact?: boolean) =>
    exact ? path === url : path.startsWith(url);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-background">
            <Camera className="h-4 w-4" />
          </span>
          <span className="font-bold">NL ERP</span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
