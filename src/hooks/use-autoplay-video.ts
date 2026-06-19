import { useCallback } from "react";

/**
 * iOS Safari (iPhone/iPad) só faz autoplay de vídeos que estejam REALMENTE
 * mudos. O React tem um bug conhecido: o atributo `muted` no JSX não é
 * aplicado de forma confiável à propriedade do elemento <video>, então o
 * Safari bloqueia o autoplay e o vídeo aparece em branco.
 *
 * Este ref callback força `muted = true` e dispara `play()` manualmente,
 * garantindo a reprodução inline no iPhone.
 */
export function useAutoplayVideoRef() {
  return useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    // Garante mudo antes de tentar tocar (exigência do iOS).
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.playsInline = true;

    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (el.readyState >= 2) {
      tryPlay();
    } else {
      el.addEventListener("loadeddata", tryPlay, { once: true });
      el.addEventListener("canplay", tryPlay, { once: true });
    }
  }, []);
}
