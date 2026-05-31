import { QueryClient, QueryCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { CoreSpinLoader } from "@/components/ui/core-spin-loader";
import { supabase } from "@/integrations/supabase/client";

function isJwtExpired(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === "PGRST303" || /jwt expired/i.test(e.message ?? "");
}

export const getRouter = () => {
  let handlingExpiry = false;

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: async (error) => {
        if (typeof window === "undefined") return;
        if (!isJwtExpired(error) || handlingExpiry) return;
        handlingExpiry = true;
        try {
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !data.session) {
            await supabase.auth.signOut();
            window.location.href = "/login";
          } else {
            queryClient.invalidateQueries();
          }
        } finally {
          handlingExpiry = false;
        }
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 300,
    defaultPendingComponent: () => <CoreSpinLoader text="Carregando..." />,
  });

  return router;
};
