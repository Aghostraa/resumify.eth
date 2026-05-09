import { resolveENS, fetchENSProfile } from './sources/ens.js';
import { fetchDeploymentsAllChains } from './sources/blockscout.js';
import { fetchSourceifyVerified } from './sources/sourcify-bq.js';
import { fetchOLILabel } from './sources/oli.js';
import type { DeveloperResume, DeployedContract, ResumeOptions } from './types.js';

export type { DeveloperResume, DeployedContract, ResumeOptions };

// Default chains scanned by Blockscout for unverified contract discovery.
// BigQuery always covers all chains for verified contracts regardless of this list.
export const DEFAULT_BLOCKSCOUT_CHAINS = [1, 10, 56, 100, 137, 324, 8453, 42161, 42220, 43114];

export async function buildDeveloperResume(
  addressOrENS: string,
  options: ResumeOptions = {}
): Promise<DeveloperResume> {
  // chains controls Blockscout scan scope only (unverified discovery)
  // BigQuery always runs across all chains for verified contracts
  const blockscoutChains = options.chains ?? [
    ...DEFAULT_BLOCKSCOUT_CHAINS,
    ...(options.includeTestnets ? [11155111, 17000, 84532, 11155420, 421614] : []),
  ];

  const { address, ensName } = await resolveENS(addressOrENS);

  const [profileResult, blockscoutResult, sourcifyResult, oliResult] = await Promise.allSettled([
    ensName ? fetchENSProfile(ensName) : Promise.resolve(null),
    fetchDeploymentsAllChains(address, blockscoutChains),
    fetchSourceifyVerified(address),
    fetchOLILabel(address),
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const blockscoutDeployments = blockscoutResult.status === 'fulfilled' ? blockscoutResult.value : [];
  const sourcifyRecords = sourcifyResult.status === 'fulfilled' ? sourcifyResult.value : [];
  const oliLabel = oliResult.status === 'fulfilled' ? oliResult.value : null;

  // Index Sourcify records by chain:address for fast merge
  const sourcifyMap = new Map(
    sourcifyRecords.map((r) => [`${r.chainId}:${r.contractAddress.toLowerCase()}`, r])
  );

  // Start with BigQuery verified records as base (cross-chain, comprehensive)
  const deployments: DeployedContract[] = sourcifyRecords.map((sv) => ({
    address: sv.contractAddress,
    chainId: sv.chainId,
    txHash: sv.txHash,
    blockNumber: sv.blockNumber,
    deployedAt: sv.verifiedAt,
    contractName: sv.contractName,
    compiler: sv.compiler,
    compilerVersion: sv.compilerVersion,
    verified: true,
    isScam: false,
    blockscoutName: null,
  }));

  // Overlay Blockscout metadata onto matching verified records (richer tx data)
  const deploymentMap = new Map(deployments.map((d) => [`${d.chainId}:${d.address.toLowerCase()}`, d]));
  for (const bd of blockscoutDeployments) {
    const key = `${bd.chainId}:${bd.address.toLowerCase()}`;
    const existing = deploymentMap.get(key);
    if (existing) {
      // Enrich verified record with Blockscout tx data
      existing.txHash = existing.txHash ?? bd.txHash;
      existing.blockNumber = existing.blockNumber ?? bd.blockNumber;
      existing.deployedAt = existing.deployedAt ?? bd.deployedAt;
      existing.blockscoutName = bd.blockscoutName;
      existing.isScam = bd.isScam;
    } else if (!sourcifyMap.has(key)) {
      // Unverified contract not in BigQuery — add from Blockscout
      deployments.push(bd);
      deploymentMap.set(key, bd);
    }
  }

  deployments.sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

  const verifiedCount = deployments.filter((d) => d.verified).length;
  const chainSet = [...new Set(deployments.map((d) => d.chainId))];
  const timestamps = deployments.map((d) => d.deployedAt).filter(Boolean) as string[];

  return {
    address,
    ensName,
    profile: {
      displayName: profile?.displayName ?? null,
      bio: profile?.bio ?? null,
      avatar: profile?.avatar ?? null,
      github: profile?.github ?? null,
      twitter: profile?.twitter ?? null,
      website: profile?.website ?? null,
      location: profile?.location ?? null,
      email: profile?.email ?? null,
    },
    deployments,
    stats: {
      totalDeployments: deployments.length,
      verifiedDeployments: verifiedCount,
      verificationRate: deployments.length > 0 ? verifiedCount / deployments.length : 0,
      chainsDeployed: chainSet,
      firstDeployment: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null,
      lastDeployment: timestamps.length > 0 ? timestamps[0] : null,
    },
    oliLabel,
  };
}
