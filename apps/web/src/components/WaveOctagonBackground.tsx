import { useEffect, useRef, type RefObject } from 'react';

interface Props {
  /** When provided, this element's `style.opacity` is driven by the wave value at screen center. */
  textRef?: RefObject<HTMLElement | null>;
}

export default function WaveOctagonBackground({ textRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const OCT_SIZE = 22;
    const GAP = 4;
    const BASE_ALPHA = 0.045;
    const PEAK_ALPHA = 0.22;
    const FILL_PEAK = 0.035;
    const WAVE_SPEED = 0.00038;
    const WAVE_SCALE = 0.008;
    const TEXT_MIN = 0.06;
    const TEXT_MAX = 1.0;

    let W = 0;
    let H = 0;
    let octs: { x: number; y: number }[] = [];
    let textAlpha = TEXT_MIN;
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
          const ox = r % 2 === 0 ? 0 : cellW / 2;
          octs.push({ x: c * cellW + ox, y: r * cellH });
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

    function waveValue(x: number, y: number, ts: number) {
      const v1 = Math.sin((x + y) * WAVE_SCALE + ts * WAVE_SPEED * Math.PI * 2);
      const v2 =
        Math.sin((x - y * 0.6) * WAVE_SCALE * 0.75 + ts * WAVE_SPEED * Math.PI * 2 * 0.65 + 1.2) *
        0.6;
      return ((v1 + v2) / 1.6 + 1) / 2;
    }

    let lastFrame = 0;
    function draw(ts: number) {
      if (ts - lastFrame < 20) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = ts;
      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const centreWave = waveValue(cx, cy, ts);
      const centrePow = Math.pow(centreWave, 2.2);
      const targetText = TEXT_MIN + centrePow * (TEXT_MAX - TEXT_MIN);
      textAlpha += (targetText - textAlpha) * 0.035;
      const el = textRef?.current;
      if (el) el.style.opacity = textAlpha.toFixed(3);

      for (const o of octs) {
        const wave = waveValue(o.x, o.y, ts);
        const power = Math.pow(wave, 2.5);
        const alpha = BASE_ALPHA + power * (PEAK_ALPHA - BASE_ALPHA);
        if (alpha < 0.004) continue;

        drawOct(o.x, o.y);

        if (power > 0.15) {
          ctx!.fillStyle = `rgba(255,255,255,${power * FILL_PEAK})`;
          ctx!.fill();
        }
        ctx!.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx!.lineWidth = 0.6;
        ctx!.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }

    window.addEventListener('resize', onResize);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [textRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
