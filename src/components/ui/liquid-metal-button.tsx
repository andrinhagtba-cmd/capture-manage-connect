import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface LiquidMetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Button with an animated "liquid metal" WebGL shader background.
 * The shader library is imported lazily inside useEffect so it never runs
 * during SSR. Each instance creates one WebGL context, so use it only on
 * prominent CTAs (not on repeated lists/cards).
 */
export const LiquidMetalButton = forwardRef<
  HTMLButtonElement,
  LiquidMetalButtonProps
>(({ className, children, onMouseEnter, onMouseLeave, ...props }, ref) => {
  const shaderRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mountRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { ShaderMount, liquidMetalFragmentShader } = await import(
          "@paper-design/shaders"
        );
        if (!active || !shaderRef.current) return;
        mountRef.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.6,
        );
      } catch (e) {
        console.error("[liquid-metal] shader failed to load", e);
      }
    })();
    return () => {
      active = false;
      mountRef.current?.destroy?.();
      mountRef.current = null;
    };
  }, []);

  const setSpeed = (v: number) => mountRef.current?.setSpeed?.(v);

  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full px-7 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onMouseEnter={(e) => {
        setSpeed(1.2);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setSpeed(0.6);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      <span ref={shaderRef} aria-hidden className="absolute inset-0" />
      <span className="absolute inset-0 bg-black/45" aria-hidden />
      <span className="relative z-10 flex items-center gap-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {children}
      </span>
    </button>
  );
});
LiquidMetalButton.displayName = "LiquidMetalButton";
