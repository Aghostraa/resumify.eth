import type { DeveloperResume } from '../types';
import { chainName, formatDate } from '../utils/chains';

interface Props {
  stats: DeveloperResume['stats'];
}

export default function StatsRow({ stats }: Props) {
  const rate = Math.round(stats.verificationRate * 100);
  const topChains = stats.chainsDeployed.slice(0, 5);
  const overflow = stats.chainsDeployed.length - 5;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up">
      <StatCard label="Total Contracts" value={String(stats.totalDeployments)} />

      <div className="hm-card p-5">
        <p className="text-[9px] font-light tracking-[0.26em] uppercase text-white/[0.22] mb-2">
          Verified
        </p>
        <p className="font-display font-extralight text-3xl text-white mb-3">
          {stats.verifiedDeployments}
          <span className="text-white/30 text-base font-light"> / {stats.totalDeployments}</span>
        </p>
        <div className="h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
          <div
            className="h-full bg-hm-green rounded-sm transition-all duration-700"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="font-mono text-[10px] text-white/40 mt-2">{rate}% verification rate</p>
      </div>

      <div className="hm-card p-5">
        <p className="text-[9px] font-light tracking-[0.26em] uppercase text-white/[0.22] mb-2">
          Chains Deployed
        </p>
        <p className="font-display font-extralight text-3xl text-white mb-3">
          {stats.chainsDeployed.length}
        </p>
        <div className="flex flex-wrap gap-1">
          {topChains.map((id) => (
            <span
              key={id}
              className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.18] text-white/55"
            >
              {chainName(id)}
            </span>
          ))}
          {overflow > 0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.18] text-white/40">
              +{overflow}
            </span>
          )}
        </div>
      </div>

      <div className="hm-card p-5">
        <p className="text-[9px] font-light tracking-[0.26em] uppercase text-white/[0.22] mb-3">
          Activity
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-[9px] font-light tracking-[0.22em] uppercase text-white/30">First deploy</p>
            <p className="font-mono text-xs text-white/80">{formatDate(stats.firstDeployment)}</p>
          </div>
          <div>
            <p className="text-[9px] font-light tracking-[0.22em] uppercase text-white/30">Last deploy</p>
            <p className="font-mono text-xs text-white/80">{formatDate(stats.lastDeployment)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="hm-card p-5 flex flex-col justify-between">
      <p className="text-[9px] font-light tracking-[0.26em] uppercase text-white/[0.22] mb-3">{label}</p>
      <p className="font-display font-extralight text-4xl text-white">{value}</p>
    </div>
  );
}
