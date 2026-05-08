import { resolveENS, fetchENSProfile } from './sources/ens.js';
import { fetchDeploymentsAllChains } from './sources/blockscout.js';
import { fetchSourceifyVerified } from './sources/sourcify-bq.js';
import { fetchOLILabel } from './sources/oli.js';
import type { DeveloperResume, DeployedContract, ResumeOptions } from './types.js';
import { DEFAULT_CHAINS } from './types.js';

export type { DeveloperResume, DeployedContract, ResumeOptions };

export async function buildDeveloperResume(
  addressOrENS: string,
  options: ResumeOptions = {}
): Promise<DeveloperResume> {
  const chains = options.chains ?? DEFAULT_CHAINS;

  const { address, ensName } = await resolveENS(addressOrENS);

  const [profileResult, blockscoutResult, sourcifyResult, oliResult] = await Promise.allSettled([
    ensName ? fetchENSProfile(ensName) : Promise.resolve(null),
    fetchDeploymentsAllChains(address, chains),
    fetchSourceifyVerified(address),
    fetchOLILabel(address),
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const blockscoutDeployments = blockscoutResult.status === 'fulfilled' ? blockscoutResult.value : [];
  const sourcifyRecords = sourcifyResult.status === 'fulfilled' ? sourcifyResult.value : [];
  const oliLabel = oliResult.status === 'fulfilled' ? oliResult.value : null;

  // Index Sourcify records by lowercase address for fast merge
  const sourcifyMap = new Map(
    sourcifyRecords.map((r) => [`${r.chainId}:${r.contractAddress.toLowerCase()}`, r])
  );

  // Merge: Blockscout is source of truth, Sourcify overlays verification metadata
  const deployments: DeployedContract[] = blockscoutDeployments.map((d) => {
    const key = `${d.chainId}:${d.address.toLowerCase()}`;
    const sv = sourcifyMap.get(key);
    return {
      ...d,
      verified: sv ? true : d.verified,
      contractName: sv?.contractName ?? d.contractName,
      compiler: sv?.compiler ?? null,
      compilerVersion: sv?.compilerVersion ?? null,
      deployedAt: d.deployedAt ?? sv?.verifiedAt ?? null,
    };
  });

  // Also add any Sourcify-verified contracts not caught by Blockscout
  const blockscoutKeys = new Set(deployments.map((d) => `${d.chainId}:${d.address.toLowerCase()}`));
  for (const sv of sourcifyRecords) {
    const key = `${sv.chainId}:${sv.contractAddress.toLowerCase()}`;
    if (!blockscoutKeys.has(key)) {
      deployments.push({
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
      });
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
