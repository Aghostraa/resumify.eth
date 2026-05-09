import { useEffect, useRef } from 'react';

interface Props {
  size?: number;
}

export default function NavMark({ size = 36 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = size;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const R_OUT = SIZE * 0.42;
    const R_IN = SIZE * 0.28;
    const SIDES = 8;
    const CYCLE = 6000;
    const BASE = -Math.PI / 2 + Math.PI / SIDES;

    function pts(r: number, off: number) {
      const a: { x: number; y: number }[] = [];
      for (let i = 0; i < SIDES; i++) {
        const angle = (Math.PI * 2 / SIDES) * i + off;
        a.push({ x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
      }
      return a;
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function lp(p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
      return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
    }
    function eio(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let pRot = 0;
    let tRot = 0;
    let iRot = 0;
    let lastE = -1;
    let snapStart = 0;
    let raf = 0;
    const SNAP = 180;

    function draw(ts: number) {
      ctx!.clearRect(0, 0, SIZE, SIZE);
      const t = (ts % CYCLE) / CYCLE;
      const ei = Math.floor(t * SIDES) % SIDES;
      const et = (t * SIDES) % 1;

      if (ei !== lastE) {
        lastE = ei;
        pRot = iRot;
        tRot = (Math.PI * 2 / SIDES) * (ei + 1);
        snapStart = ts;
      }
      iRot = lerp(pRot, tRot, eio(Math.min(1, (ts - snapStart) / SNAP)));

      const op = pts(R_OUT, BASE);

      // outer octagon
      ctx!.beginPath();
      op.forEach((p, i) => (i === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)));
      ctx!.closePath();
      ctx!.strokeStyle = 'rgba(255,255,255,0.13)';
      ctx!.lineWidth = 0.6;
      ctx!.stroke();

      // corner dots
      op.forEach((p) => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255,255,255,0.22)';
        ctx!.fill();
      });

      // light travel
      const eA = op[ei];
      const eB = op[(ei + 1) % SIDES];
      const easedT = eio(et);
      const lPos = lp(eA, eB, easedT);
      const tS = lp(eA, eB, Math.max(0, easedT - 0.4));
      const tg = ctx!.createLinearGradient(tS.x, tS.y, lPos.x, lPos.y);
      tg.addColorStop(0, 'rgba(255,255,255,0)');
      tg.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx!.beginPath();
      ctx!.moveTo(tS.x, tS.y);
      ctx!.lineTo(lPos.x, lPos.y);
      ctx!.strokeStyle = tg;
      ctx!.lineWidth = 1.1;
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.arc(lPos.x, lPos.y, 1.4, 0, Math.PI * 2);
      ctx!.fillStyle = '#fff';
      ctx!.fill();

      // inner gear
      const tc = 20;
      ctx!.beginPath();
      for (let i = 0; i <= tc * 2; i++) {
        const a = (i / (tc * 2)) * Math.PI * 2 + BASE + iRot;
        const r = i % 2 === 0 ? R_IN : R_IN + 3;
        ctx!.lineTo(CX + r * Math.cos(a), CY + r * Math.sin(a));
      }
      ctx!.closePath();
      ctx!.fillStyle = 'rgba(0,0,0,0.9)';
      ctx!.fill();
      ctx!.strokeStyle = 'rgba(255,255,255,0.40)';
      ctx!.lineWidth = 0.55;
      ctx!.stroke();

      // H mark
      const bW = 1.4;
      const bH = SIZE * 0.21;
      const bY = CY - bH / 2;
      const lX = CX - 4;
      const rX = CX + 4 - bW;
      ctx!.fillStyle = 'rgba(255,255,255,0.92)';
      ctx!.beginPath();
      ctx!.roundRect(lX, bY, bW, bH, 0.7);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.roundRect(rX, bY, bW, bH, 0.7);
      ctx!.fill();
      ctx!.fillStyle = 'rgba(255,255,255,0.38)';
      ctx!.beginPath();
      ctx!.roundRect(lX, CY - 0.65, rX + bW - lX, 1.3, 0.65);
      ctx!.fill();

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block flex-shrink-0"
      aria-hidden
    />
  );
}
