export interface DeployedContract {
  address: string;
  chainId: number;
  txHash: string | null;
  blockNumber: number | null;
  deployedAt: string | null;
  contractName: string | null;
  compiler: string | null;
  compilerVersion: string | null;
  verified: boolean;
  isScam: boolean;
  blockscoutName: string | null;
}

export interface DeveloperResume {
  address: string;
  ensName: string | null;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    github: string | null;
    twitter: string | null;
    website: string | null;
    location: string | null;
    email: string | null;
  };
  deployments: DeployedContract[];
  stats: {
    totalDeployments: number;
    verifiedDeployments: number;
    verificationRate: number;
    chainsDeployed: number[];
    firstDeployment: string | null;
    lastDeployment: string | null;
  };
  oliLabel: {
    displayName: string | null;
    primaryCategory: string | null;
  } | null;
}

export type VerifyStatus = 'idle' | 'submitting' | 'polling' | 'done' | 'error';
