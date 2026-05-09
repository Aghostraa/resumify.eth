// Dashboard (deployer) types — match apps/api deployer response
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

export interface PipelineStep {
  step: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

// Analyzer types — match apps/api analyzer pipeline response
export interface RiskFlag {
  id: string;
  severity: 'high' | 'medium' | 'low';
  evidence?: string;
}

export interface AxisDetail {
  value: number;
  max: number;
  reason: string;
  source: string;
}

export interface AnalyzerScore {
  total: number;
  label: string;
  breakdown: {
    verification: AxisDetail;
    patternMatch: AxisDetail;
    riskFlag: AxisDetail;
    ecosystem: AxisDetail;
    security: AxisDetail;
  };
}

export interface SecurityFinding {
  check: 'reentrancy' | 'frontrun' | 'access-control' | 'unchecked-call';
  passed: boolean;
  detail?: string;
  line?: number;
}

export interface OliLabel {
  ownerProject?: string;
  contractName?: string;
  usageCategory?: string;
  sourceCodeVerified?: string;
  audit?: string;
  ercType?: string[];
  raw?: Record<string, unknown>;
}

export interface MintResult {
  name: string;
  namehash: string;
  owner: string;
  resolver: string;
  records: Record<string, string>;
  contractType: 'Ownable' | 'ReverseClaimer' | 'Unknown';
  forwardSet: boolean;
  reverseSet: boolean;
  txHashes: { subname?: string; forward?: string; reverse?: string; setText: string[] };
  explorerUrl: string;
}

export interface AnalyzerResult {
  address: string;
  chainId: number;
  sourcify: { verified?: boolean; partial?: boolean; contractName?: string };
  oli: OliLabel | null;
  classification: {
    pattern: string;
    confidence: number;
    reasoning?: string;
    riskFlags: RiskFlag[];
    matchedSignatures: string[];
  };
  security: SecurityFinding[];
  score: AnalyzerScore;
  explanation: string;
  ens: MintResult | null;
  attestation: { ok: boolean; uid?: string; ipfsHash?: string; attestationUrl?: string; reason?: string } | null;
  steps: { step: string; ok: boolean; detail?: string; error?: string }[];
  classifiedAt: string;
}

export interface AgentInfo {
  ensName: string | null;
  namespace?: string;
  ensProfileUrl: string | null;
  ensipCompliance: string[];
  model: string;
  records: Record<string, string> | null;
  recordsError: string | null;
  resolver: string;
}
