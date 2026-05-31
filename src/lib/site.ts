// Central site configuration & helpers for NL Foto e Vídeo

export const WHATSAPP_NUMBER = "556181871104"; // +55 61 8187-1104
export const WHATSAPP_DISPLAY = "(61) 8187-1104";
export const INSTAGRAM_URL = "https://instagram.com/nlfotoevideo";
export const COMPANY_NAME = "NL Foto e Vídeo";
export const COMPANY_TAGLINE =
  "Referência em Foto e Vídeo profissional há mais de 20 anos na Feira dos Importados de Brasília.";
export const ADDRESS =
  "Feira dos Importados de Brasília — Setor de Indústrias e Abastecimento, Brasília/DF";

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const BRAND_THEME: Record<
  string,
  { color: string; label: string; blurb: string }
> = {
  canon: {
    color: "#C40000",
    label: "Canon",
    blurb: "Sistemas EOS, lentes RF e soluções de imagem para profissionais.",
  },
  dji: {
    color: "#111111",
    label: "DJI",
    blurb: "Drones, estabilizadores e câmeras para criadores e cinema.",
  },
  sony: {
    color: "#0B6FB8",
    label: "Sony",
    blurb: "Linha Alpha full-frame, lentes G Master e áudio para criadores.",
  },
  gopro: {
    color: "#00AEEF",
    label: "GoPro",
    blurb: "Câmeras de ação HERO e 360 para qualquer aventura.",
  },
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  disponivel: "Disponível",
  sob_consulta: "Sob consulta",
  encomenda: "Sob encomenda",
  indisponivel: "Indisponível",
};

export const AVAILABILITY_TONE: Record<string, string> = {
  disponivel: "bg-emerald-100 text-emerald-800",
  sob_consulta: "bg-amber-100 text-amber-800",
  encomenda: "bg-sky-100 text-sky-800",
  indisponivel: "bg-muted text-muted-foreground",
};
