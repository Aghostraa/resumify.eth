import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpellingLoader from '../components/SpellingLoader';
import WaveOctagonBackground from '../components/WaveOctagonBackground';

export default function Home() {
  const navigate = useNavigate();
  const wordmarkRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <WaveOctagonBackground textRef={wordmarkRef} />
      <section className="flex-1 flex flex-col items-center justify-center gap-8 pointer-events-none">
        <SpellingLoader size={200} />
        <div
          ref={wordmarkRef}
          className="font-display font-extralight uppercase text-white leading-none select-none"
          style={{ fontSize: 52, letterSpacing: '0.26em', opacity: 0 }}
        >
          Hallmark
        </div>
        <button
          onClick={() => navigate('/deployer')}
          className="pointer-events-auto rounded-full bg-white text-black font-light tracking-[0.28em] uppercase transition-opacity hover:opacity-85"
          style={{ padding: '12px 36px', fontSize: 11, border: '1px solid rgba(255,255,255,0.85)' }}
        >
          Explore
        </button>
      </section>
    </>
  );
}
