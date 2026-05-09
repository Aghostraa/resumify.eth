import type { DeveloperResume } from '../types';
import { truncateAddress } from '../utils/chains';

interface Props {
  resume: DeveloperResume;
}

export default function ProfileCard({ resume }: Props) {
  const { address, ensName, profile, oliLabel } = resume;

  return (
    <div className="bg-ink-800 border border-ink-600 rounded-lg p-5 flex gap-5 items-start animate-fade-in">
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt="avatar"
          className="w-16 h-16 rounded-full border-2 border-ink-600 shrink-0 object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-16 h-16 rounded-full border-2 border-ink-600 bg-ink-700 shrink-0 flex items-center justify-center">
          <span className="font-mono text-ink-400 text-xl">
            {(ensName ?? address).slice(0, 2)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <h2 className="text-ink-100 font-semibold text-lg leading-tight">
            {profile.displayName ?? ensName ?? truncateAddress(address)}
          </h2>
          {oliLabel?.primaryCategory && (
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-ink-700 border border-ink-600 text-purple-400">
              {oliLabel.primaryCategory}
            </span>
          )}
        </div>

        {ensName && (
          <p className="font-mono text-sm text-acid-500 mb-1">{ensName}</p>
        )}

        <p className="font-mono text-xs text-ink-400 mb-2 break-all">{address}</p>

        {profile.bio && (
          <p className="text-sm text-ink-300 mb-3 max-w-prose">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {profile.github && (
            <a
              href={`https://github.com/${profile.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-ink-400 hover:text-ink-100 transition-colors"
            >
              <GithubIcon />
              {profile.github}
            </a>
          )}
          {profile.twitter && (
            <a
              href={`https://x.com/${profile.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-ink-400 hover:text-ink-100 transition-colors"
            >
              <XIcon />
              {profile.twitter}
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-ink-400 hover:text-ink-100 transition-colors"
            >
              <GlobeIcon />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.location && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-ink-400">
              <PinIcon />
              {profile.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
