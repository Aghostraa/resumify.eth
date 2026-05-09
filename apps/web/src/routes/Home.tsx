import { useNavigate } from 'react-router-dom';
import SpellingLoader from '../components/SpellingLoader';

export default function Home() {
  const navigate = useNavigate();

  return (
    <section className="flex-1 flex flex-col items-center justify-center gap-8">
      <SpellingLoader size={200} />
      <div
        className="font-display font-extralight uppercase text-white leading-none select-none"
        style={{ fontSize: 52, letterSpacing: '0.26em' }}
      >
        Hallmark
      </div>
      <button
        onClick={() => navigate('/deployer')}
        className="rounded-full bg-white text-black font-light tracking-[0.28em] uppercase transition-opacity hover:opacity-85"
        style={{ padding: '12px 36px', fontSize: 11, border: '1px solid rgba(255,255,255,0.85)' }}
      >
        Explore
      </button>
    </section>
  );
}
