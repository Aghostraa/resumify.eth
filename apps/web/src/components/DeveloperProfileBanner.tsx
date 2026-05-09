import { useState, useEffect } from 'react';

interface ProfileInfo {
  label: string;
  profileName: string;
  resumeName: string;
  ensProfileUrl: string;
}

interface Props {
  developerAddress: string;
  developerEnsName?: string | null;
}

type BannerState = 'loading' | 'unregistered' | 'registering' | 'registered' | 'error';

export default function DeveloperProfileBanner({ developerAddress, developerEnsName }: Props) {
  const [bannerState, setBannerState] = useState<BannerState>('loading');
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ ...(developerEnsName ? { ensName: developerEnsName } : {}) });
    fetch(`/api/developer/${developerAddress}?${params}`)
      .then((r) => r.json())
      .then((data: ProfileInfo) => {
        setProfile(data);
        // Check if resume namespace exists by trying to resolve it
        return fetch(`/api/cached/check-resume?label=${encodeURIComponent(data.label)}`)
          .then((r) => r.json())
          .then((d: { exists: boolean }) => setBannerState(d.exists ? 'registered' : 'unregistered'))
          .catch(() => setBannerState('unregistered'));
      })
      .catch(() => setBannerState('unregistered'));
  }, [developerAddress, developerEnsName]);

  async function handleRegister() {
    if (!profile) return;
    setBannerState('registering');
    setError(null);
    try {
      const res = await fetch('/api/developer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: developerAddress, ensName: developerEnsName }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'registration failed');
      }
      const data = await res.json() as { profileName: string; resumeName: string; label: string };
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      setBannerState('registered');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBannerState('error');
    }
  }

  if (bannerState === 'loading') return null;

  if (bannerState === 'registered' && profile) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-hm-green/20 bg-hm-green/[0.04] animate-fade-in">
        <span className="hm-eyebrow-dot shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-light tracking-[0.18em] uppercase text-white/40 mr-2">Resume namespace</span>
          <a
            href={profile.ensProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-hm-green hover:underline"
          >
            {profile.resumeName}
          </a>
        </div>
        <span className="text-[9px] font-light tracking-[0.22em] uppercase text-hm-green/60 shrink-0">active</span>
      </div>
    );
  }

  if (bannerState === 'error') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-hm-red/20 bg-hm-red/[0.04]">
        <span className="text-[10px] text-hm-red/80">{error ?? 'Registration failed'}</span>
        <button
          onClick={() => setBannerState('unregistered')}
          className="text-[9px] tracking-[0.18em] uppercase text-white/40 hover:text-white/70 transition-colors"
        >
          retry
        </button>
      </div>
    );
  }

  if (bannerState === 'registering') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 bg-hm-green rounded-full animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        <span className="text-[10px] font-light tracking-[0.18em] uppercase text-white/40">
          Registering resume namespace on ENS…
        </span>
      </div>
    );
  }

  // unregistered
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-light tracking-[0.04em] text-white/60 mb-0.5">
            Register your resume namespace on ENS
          </p>
          {profile && (
            <p className="font-mono text-[10px] text-white/25 truncate">
              {profile.resumeName}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleRegister}
        className="shrink-0 text-[10px] font-light tracking-[0.22em] uppercase px-4 py-2 rounded-full border border-hm-green/30 text-hm-green/70 hover:border-hm-green/60 hover:text-hm-green transition-colors"
      >
        Register →
      </button>
    </div>
  );
}
