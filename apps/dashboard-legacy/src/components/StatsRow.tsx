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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
      <StatCard label="total contracts" value={String(stats.totalDeployments)} />

      <div className="bg-ink-800 border border-ink-600 rounded-lg p-4">
        <p className="font-mono text-xs text-ink-500 mb-1">verified</p>
        <p className="font-mono text-2xl font-semibold text-ink-100 mb-2">
          {stats.verifiedDeployments}
          <span className="text-ink-500 text-base font-normal"> / {stats.totalDeployments}</span>
        </p>
        <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-acid-500 rounded-full transition-all duration-700"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="font-mono text-xs text-ink-400 mt-1">{rate}% verification rate</p>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-lg p-4">
        <p className="font-mono text-xs text-ink-500 mb-1">chains deployed</p>
        <p className="font-mono text-2xl font-semibold text-ink-100 mb-2">{stats.chainsDeployed.length}</p>
        <div className="flex flex-wrap gap-1">
          {topChains.map((id) => (
            <span key={id} className="font-mono text-xs px-1.5 py-0.5 rounded bg-ink-700 text-ink-300 border border-ink-600">
              {chainName(id)}
            </span>
          ))}
          {overflow > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-ink-700 text-ink-400">+{overflow}</span>
          )}
        </div>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-lg p-4">
        <p className="font-mono text-xs text-ink-500 mb-2">activity</p>
        <div className="space-y-1.5">
          <div>
            <p className="font-mono text-xs text-ink-500">first deploy</p>
            <p className="font-mono text-xs text-ink-200">{formatDate(stats.firstDeployment)}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-ink-500">last deploy</p>
            <p className="font-mono text-xs text-ink-200">{formatDate(stats.lastDeployment)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-lg p-4">
      <p className="font-mono text-xs text-ink-500 mb-1">{label}</p>
      <p className="font-mono text-3xl font-semibold text-ink-100">{value}</p>
    </div>
  );
}
