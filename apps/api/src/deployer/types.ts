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

export interface ResumeOptions {
  chains?: number[];
  includeTestnets?: boolean;
  writeToENS?: boolean;
}

// All Sourcify-supported mainnet chain IDs
export const SOURCIFY_MAINNET_CHAINS = [
  1, 10, 30, 56, 61, 100, 109, 122, 130, 137, 148, 177, 239, 314,
  324, 360, 480, 488, 592, 612055, 685689, 690, 698, 714, 747, 869,
  1135, 1514, 1729, 1829, 1868, 1890, 2288, 2366, 3946, 4326, 6497,
  7000, 8021, 8453, 8822, 13371, 32769, 34443, 41923, 42161, 42170,
  42220, 42793, 57073, 73115, 102030, 245022934,
];

// All Sourcify-supported testnet chain IDs
export const SOURCIFY_TESTNET_CHAINS = [
  17000, 560048, 31, 63, 81, 123, 300, 545, 1073, 1076, 1301, 1315,
  1891, 1946, 2368, 2391, 3941, 3945, 4202, 4801, 4888, 5042002,
  6343, 6398, 7001, 8408, 10200, 11011, 11142220, 11155111, 11155420,
  13473, 33101, 69420, 73114, 84532, 89346162, 102031, 102032, 127823,
  222888, 245022926, 314159, 323432, 421614, 534351, 612044, 656476,
  685685, 695569, 763373, 5278000, 3735928814,
];

// Default: all Sourcify/Blockscout mainnet chains
export const DEFAULT_CHAINS = SOURCIFY_MAINNET_CHAINS;

// Default testnet chains
export const DEFAULT_TESTNET_CHAINS = SOURCIFY_TESTNET_CHAINS;
