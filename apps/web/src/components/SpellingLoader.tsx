import { useEffect, useRef } from 'react';

interface Props {
  size?: number;
}

export default function SpellingLoader({ size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = size;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const SIDES = 8;
    const WORD = 'HALLMARK';
    const LETTERS = WORD.split('');

    const R_OUTER = SIZE * 0.43;
    const R_INNER = SIZE * 0.28;
    const R_CENTER = SIZE * 0.17;

    const EDGE_DUR = 900;
    const SNAP_DUR = 220;
    const CYCLE = EDGE_DUR * SIDES;
    const BASE = -Math.PI / 2 + Math.PI / SIDES;

    function octPts(cx: number, cy: number, r: number, angleOffset: number) {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < SIDES; i++) {
        const a = ((Math.PI * 2) / SIDES) * i + angleOffset;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      return pts;
    }
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }
    function lerpPt(p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
      return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
    }
    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }
    function easeInOut(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let prevLetter = '';
    let currLetter = LETTERS[0];
    let prevRot = 0;
    let targetRot = 0;
    let innerRot = 0;
    let letterAlpha = 1;
    let prevAlpha = 0;
    let lastCorner = -1;
    let raf = 0;

    function draw(ts: number) {
      ctx!.fillStyle = '#000';
      ctx!.fillRect(0, 0, SIZE, SIZE);

      const cycleT = (ts % CYCLE) / CYCLE;
      const edgeIdx = Math.floor(cycleT * SIDES);
      const edgeT = (cycleT * SIDES) % 1;

      if (edgeIdx !== lastCorner) {
        lastCorner = edgeIdx;
        prevLetter = currLetter;
        currLetter = LETTERS[edgeIdx % SIDES];
        prevAlpha = 1;
        letterAlpha = 0;
        prevRot = innerRot;
        targetRot = ((Math.PI * 2) / SIDES) * (edgeIdx + 1);
      }

      const snapFrac = Math.min(1, (edgeT * EDGE_DUR) / SNAP_DUR);
      const snapE = easeOut(snapFrac);
      innerRot = lerp(prevRot, targetRot, snapE);
      letterAlpha = easeOut(snapFrac);
      prevAlpha = 1 - letterAlpha;

      const outerPts = octPts(CX, CY, R_OUTER, BASE);
      const innerPts = octPts(CX, CY, R_INNER, BASE + innerRot);

      // Outer octagon
      ctx!.beginPath();
      outerPts.forEach((p, i) => (i === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)));
      ctx!.closePath();
      ctx!.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx!.lineWidth = 0.9;
      ctx!.stroke();

      // Corner dots with arrival/departure glow
      outerPts.forEach((p, i) => {
        const isArrival = edgeIdx === i && edgeT < 0.18;
        const isDeparture = edgeIdx === (i - 1 + SIDES) % SIDES && edgeT > 0.82;
        const dotBright = isArrival
          ? 0.7 + 0.3 * easeOut(1 - edgeT / 0.18)
          : isDeparture
          ? 0.7 + 0.3 * easeOut((edgeT - 0.82) / 0.18)
          : 0.7;

        if (dotBright > 0.3) {
          const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
          g.addColorStop(0, `rgba(255,255,255,${dotBright * 0.4})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx!.fillStyle = g;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${dotBright})`;
        ctx!.fill();
      });

      // Light traveler
      const eA = outerPts[edgeIdx];
      const eB = outerPts[(edgeIdx + 1) % SIDES];
      const easedEdgeT = easeInOut(edgeT);
      const lightPos = lerpPt(eA, eB, easedEdgeT);
      const trailStart = lerpPt(eA, eB, Math.max(0, easedEdgeT - 0.38));

      const tg = ctx!.createLinearGradient(trailStart.x, trailStart.y, lightPos.x, lightPos.y);
      tg.addColorStop(0, 'rgba(255,255,255,0)');
      tg.addColorStop(0.6, 'rgba(255,255,255,0.15)');
      tg.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx!.beginPath();
      ctx!.moveTo(trailStart.x, trailStart.y);
      ctx!.lineTo(lightPos.x, lightPos.y);
      ctx!.strokeStyle = tg;
      ctx!.lineWidth = 1.6;
      ctx!.stroke();

      const halo = ctx!.createRadialGradient(lightPos.x, lightPos.y, 0, lightPos.x, lightPos.y, 13);
      halo.addColorStop(0, 'rgba(255,255,255,0.45)');
      halo.addColorStop(0.4, 'rgba(255,255,255,0.08)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx!.beginPath();
      ctx!.arc(lightPos.x, lightPos.y, 13, 0, Math.PI * 2);
      ctx!.fillStyle = halo;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(lightPos.x, lightPos.y, 2.2, 0, Math.PI * 2);
      ctx!.fillStyle = '#fff';
      ctx!.fill();

      // Inner gear octagon
      const toothCount = 32;
      ctx!.beginPath();
      for (let i = 0; i <= toothCount * 2; i++) {
        const angle = (i / (toothCount * 2)) * Math.PI * 2 + BASE + innerRot;
        const r = i % 2 === 0 ? R_INNER : R_INNER + 5;
        if (i === 0) ctx!.moveTo(CX + r * Math.cos(angle), CY + r * Math.sin(angle));
        else ctx!.lineTo(CX + r * Math.cos(angle), CY + r * Math.sin(angle));
      }
      ctx!.closePath();
      ctx!.fillStyle = '#000';
      ctx!.fill();
      ctx!.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx!.lineWidth = 0.9;
      ctx!.stroke();

      // Snap pulse
      const glowPulse = (1 - snapFrac) * 0.12;
      if (glowPulse > 0.005) {
        ctx!.beginPath();
        innerPts.forEach((p, i) => (i === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)));
        ctx!.closePath();
        ctx!.strokeStyle = `rgba(255,255,255,${glowPulse})`;
        ctx!.lineWidth = 8;
        ctx!.stroke();
      }

      // Center disc
      ctx!.beginPath();
      ctx!.arc(CX, CY, R_CENTER, 0, Math.PI * 2);
      ctx!.fillStyle = '#000';
      ctx!.fill();
      ctx!.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx!.lineWidth = 0.6;
      ctx!.stroke();

      // Letters
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.font = '300 28px Outfit';

      if (prevLetter && prevAlpha > 0.01) {
        ctx!.save();
        ctx!.globalAlpha = prevAlpha;
        const s = 1 + (1 - prevAlpha) * 0.2;
        ctx!.translate(CX, CY);
        ctx!.scale(s, s);
        ctx!.fillStyle = '#fff';
        ctx!.fillText(prevLetter, 0, 1);
        ctx!.restore();
      }
      if (currLetter && letterAlpha > 0.01) {
        ctx!.save();
        ctx!.globalAlpha = letterAlpha;
        const s = 1 + (1 - letterAlpha) * 0.15;
        ctx!.translate(CX, CY);
        ctx!.scale(s, s);
        ctx!.fillStyle = '#fff';
        ctx!.fillText(currLetter, 0, 1);
        ctx!.restore();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} width={size} height={size} className="block bg-black" aria-hidden />;
}
