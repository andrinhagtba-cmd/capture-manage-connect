import { useCallback, useEffect, useRef } from "react";

/**
 * iOS Safari (iPhone/iPad) só faz autoplay de vídeos que estejam REALMENTE
 * mudos. O React tem um bug conhecido: o atributo `muted` no JSX não é
 * aplicado de forma confiável à propriedade do elemento <video>, então o
 * Safari bloqueia o autoplay e o vídeo aparece em branco.
 *
 * Este ref callback força `muted = true` e dispara `play()` manualmente,
 * garantindo a reprodução inline no iPhone.
 */
export function useAutoplayVideoRef({ enabled = true }: { enabled?: boolean } = {}) {
  const videoEl = useRef<HTMLVideoElement | null>(null);

  const prepareVideo = useCallback((el: HTMLVideoElement) => {
    // Garante mudo antes de tentar tocar (exigência do iOS).
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.playsInline = true;
  }, []);

  const playVideo = useCallback((el: HTMLVideoElement) => {
    prepareVideo(el);
    if (el.readyState === 0) el.load();
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [prepareVideo]);

  useEffect(() => {
    const el = videoEl.current;
    if (!el) return;

    prepareVideo(el);

    if (!enabled) {
      el.pause();
      return;
    }

    let isVisible = false;
    const tryPlayIfVisible = () => {
      if (isVisible) playVideo(el);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting && entry.intersectionRatio > 0.15;
        if (isVisible) {
          playVideo(el);
        } else {
          el.pause();
        }
      },
      { threshold: [0, 0.15, 0.5] },
    );

    observer.observe(el);
    el.addEventListener("loadeddata", tryPlayIfVisible);
    el.addEventListener("canplay", tryPlayIfVisible);
    window.addEventListener("touchstart", tryPlayIfVisible, { passive: true });
    window.addEventListener("pointerdown", tryPlayIfVisible, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("loadeddata", tryPlayIfVisible);
      el.removeEventListener("canplay", tryPlayIfVisible);
      window.removeEventListener("touchstart", tryPlayIfVisible);
      window.removeEventListener("pointerdown", tryPlayIfVisible);
      el.pause();
    };
  }, [enabled, playVideo, prepareVideo]);

  return useCallback((el: HTMLVideoElement | null) => {
    videoEl.current = el;
    if (el) prepareVideo(el);
  }, [prepareVideo]);
}
