import { useEffect, useRef } from 'react';

export default function OctagonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const OCT_SIZE = 22;
    const GAP = 4;
    const BASE_ALPHA = 0.055;
    const PEAK_ALPHA = 0.30;
    const FILL_PEAK = 0.045;
    const RADIUS = 130;
    const DECAY = 0.05;

    let mouseX = -9999;
    let mouseY = -9999;
    let W = 0;
    let H = 0;
    let octs: { x: number; y: number; glow: number }[] = [];
    let raf = 0;
    let resizeTimer: number | undefined;

    const cellW = 2 * OCT_SIZE * Math.cos(Math.PI / 8) + GAP;
    const cellH = 2 * OCT_SIZE + GAP;

    const BASE_SHAPE = (() => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i + Math.PI / 8;
        pts.push({
          x: (OCT_SIZE - GAP / 2) * Math.cos(a),
          y: (OCT_SIZE - GAP / 2) * Math.sin(a),
        });
      }
      return pts;
    })();

    function buildGrid() {
      octs = [];
      const cols = Math.ceil(W / cellW) + 2;
      const rows = Math.ceil(H / cellH) + 2;
      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const offsetX = r % 2 === 0 ? 0 : cellW / 2;
          octs.push({ x: c * cellW + offsetX, y: r * cellH, glow: 0 });
        }
      }
    }

    function resize() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildGrid();
    }

    function drawOct(cx: number, cy: number) {
      ctx!.beginPath();
      BASE_SHAPE.forEach((p, i) =>
        i === 0 ? ctx!.moveTo(cx + p.x, cy + p.y) : ctx!.lineTo(cx + p.x, cy + p.y),
      );
      ctx!.closePath();
    }

    let lastFrame = 0;
    function draw(ts: number) {
      if (ts - lastFrame < 18) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = ts;
      ctx!.clearRect(0, 0, W, H);
      const rSq = RADIUS * RADIUS;

      for (let i = 0; i < octs.length; i++) {
        const o = octs[i];
        const dx = o.x - mouseX;
        const dy = o.y - mouseY;
        const dSq = dx * dx + dy * dy;

        let target = 0;
        if (dSq < rSq) {
          const norm = 1 - Math.sqrt(dSq) / RADIUS;
          target = norm * norm;
        }

        o.glow += target > o.glow ? (target - o.glow) * 0.20 : -o.glow * DECAY;
        if (o.glow < 0.004) o.glow = 0;

        const strokeAlpha = BASE_ALPHA + o.glow * (PEAK_ALPHA - BASE_ALPHA);
        if (strokeAlpha < 0.004) continue;

        drawOct(o.x, o.y);

        if (o.glow > 0.03) {
          ctx!.fillStyle = `rgba(255,255,255,${o.glow * FILL_PEAK})`;
          ctx!.fill();
        }
        ctx!.strokeStyle = `rgba(255,255,255,${strokeAlpha})`;
        ctx!.lineWidth = 0.6;
        ctx!.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    function onTouch(e: TouchEvent) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
    function onLeave() {
      mouseX = -9999;
      mouseY = -9999;
    }
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);

    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
