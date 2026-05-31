"use client";

import React, { useRef, useEffect } from "react";

interface GridGlowBackgroundProps {
  className?: string;
  gridColor?: string;
  gridSize?: number;
  glowColors?: string[];
  glowCount?: number;
}

export const GridGlowBackground: React.FC<GridGlowBackgroundProps> = ({
  className,
  gridColor = "rgba(255, 255, 255, 0.06)",
  gridSize = 50,
  glowColors = ["#e11d2e", "#ff4d4d", "#b00d20"],
  glowCount = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let glows: Glow[] = [];
    let frameId = 0;

    class Glow {
      x = 0;
      y = 0;
      targetX = 0;
      targetY = 0;
      radius = Math.random() * 90 + 50;
      speed = Math.random() * 0.015 + 0.008;
      color = glowColors[Math.floor(Math.random() * glowColors.length)];
      alpha = 0;

      constructor() {
        this.x = Math.floor(Math.random() * (canvas!.width / gridSize)) * gridSize;
        this.y = Math.floor(Math.random() * (canvas!.height / gridSize)) * gridSize;
        this.targetX = this.x;
        this.targetY = this.y;
        this.setNewTarget();
      }

      setNewTarget() {
        this.targetX = Math.floor(Math.random() * (canvas!.width / gridSize)) * gridSize;
        this.targetY = Math.floor(Math.random() * (canvas!.height / gridSize)) * gridSize;
      }

      update() {
        this.x += (this.targetX - this.x) * this.speed;
        this.y += (this.targetY - this.y) * this.speed;
        if (Math.abs(this.targetX - this.x) < 1 && Math.abs(this.targetY - this.y) < 1) {
          this.setNewTarget();
        }
        if (this.alpha < 1) this.alpha += 0.01;
      }

      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.alpha * 0.7;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      glows = Array.from({ length: glowCount }, () => new Glow());
    };

    const drawGrid = () => {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      glows.forEach((g) => {
        g.update();
        g.draw();
      });
      frameId = requestAnimationFrame(animate);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      glows.forEach((g) => g.draw());
    };

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let running = false;
    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      frameId = requestAnimationFrame(animate);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    resize();
    if (reduceMotion) {
      drawStatic();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    // Only animate while the canvas is actually visible on screen — this
    // prevents the rAF loop from janking the rest of the page (e.g. carousels).
    const visObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    visObserver.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduceMotion) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      resizeObserver.disconnect();
      visObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [gridColor, gridSize, glowColors, glowCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
};

export default GridGlowBackground;
