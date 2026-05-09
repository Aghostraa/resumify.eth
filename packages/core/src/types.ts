export type ChainName =
  | 'mainnet' | 'sepolia'
  | 'base' | 'optimism' | 'arbitrum' | 'scroll' | 'linea'
  | 'base-sepolia' | 'optimism-sepolia' | 'arbitrum-sepolia' | 'scroll-sepolia' | 'linea-sepolia';

export type SecurityCheck = 'reentrancy' | 'frontrun' | 'access-control' | 'unchecked-call';

export interface SecurityFinding {
  check: SecurityCheck;
  passed: boolean;
  detail?: string;
  line?: number;
}

export type RiskSeverity = 'high' | 'medium' | 'low';

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  description?: string;
}

export interface ScoreBreakdown {
  total: number;
  verification: number;
  pattern: number;
  risk: number;
  ecosystem: number;
  security: number;
}

export interface OliLabel {
  ownerProject?: string;
  contractName?: string;
  usageCategory?: string;
  sourceCodeVerified?: 'sourcify' | 'blockscout' | 'etherscan' | string;
  audit?: string;
  ercType?: string[];
  raw?: Record<string, unknown>;
}

export interface Report {
  address: string;
  chainId: number;
  ensName?: string;
  score: ScoreBreakdown;
  riskFlags: RiskFlag[];
  security: SecurityFinding[];
  pattern?: string;
  sourcifyVerified?: 'true' | 'partial' | 'false';
  ownerProject?: string;
  oli?: OliLabel;
  similarTo?: string[];
  description?: string;
  classifiedAt?: string;
  url?: string;
  attestationUrl?: string;
}
