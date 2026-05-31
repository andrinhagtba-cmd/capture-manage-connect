import { useState, useEffect } from "react";

type CoreSpinLoaderProps = {
  /** Cover the whole screen with a backdrop. Defaults to true. */
  fullscreen?: boolean;
  /** Static label. When omitted, an animated cycling label is shown. */
  text?: string;
  /** Hide the text entirely. */
  hideText?: boolean;
  className?: string;
};

const STATES = [
  "Carregando...",
  "Buscando dados..",
  "Sincronizando...",
  "Processando..",
  "Otimizando...",
];

export function CoreSpinLoader({
  fullscreen = true,
  text,
  hideText = false,
  className = "",
}: CoreSpinLoaderProps) {
  const [loadingText, setLoadingText] = useState(STATES[0]);

  useEffect(() => {
    if (text) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % STATES.length;
      setLoadingText(STATES[i]);
    }, 1000);
    return () => clearInterval(interval);
  }, [text]);

  const loader = (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className="relative h-28 w-28">
        {/* Base glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />

        {/* Outer dashed ring (slow) */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-border animate-spin"
          style={{ animationDuration: "9s" }}
        />

        {/* Main arc */}
        <div
          className="absolute inset-1 rounded-full border-[3px] border-transparent border-t-primary border-r-primary animate-spin"
          style={{ animationDuration: "1.4s" }}
        />

        {/* Reverse arc */}
        <div
          className="absolute inset-4 rounded-full border-2 border-transparent border-b-foreground/70 border-l-foreground/70 animate-spin"
          style={{ animationDuration: "2.2s", animationDirection: "reverse" }}
        />

        {/* Inner fast ring */}
        <div
          className="absolute inset-8 rounded-full border-2 border-transparent border-t-primary/60 animate-spin"
          style={{ animationDuration: "0.8s" }}
        />

        {/* Orbital dot */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "1.6s" }}>
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
        </div>

        {/* Center core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 rounded-full bg-primary shadow-[0_0_16px_4px_color-mix(in_oklab,var(--primary)_60%,transparent)] animate-pulse" />
        </div>
      </div>

      {!hideText && (
        <p className="text-sm font-medium tracking-wide text-muted-foreground tabular-nums">
          {text ?? loadingText}
        </p>
      )}
    </div>
  );

  if (!fullscreen) return loader;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      {loader}
    </div>
  );
}

export default CoreSpinLoader;
