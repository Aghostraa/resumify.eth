export interface ChainInfo {
  id: number;
  name: string;
  testnet: boolean;
}

const CHAIN_DATA: ChainInfo[] = [
  { id: 1, name: 'Ethereum', testnet: false },
  { id: 10, name: 'Optimism', testnet: false },
  { id: 56, name: 'BNB Chain', testnet: false },
  { id: 100, name: 'Gnosis', testnet: false },
  { id: 137, name: 'Polygon', testnet: false },
  { id: 324, name: 'zkSync Era', testnet: false },
  { id: 8453, name: 'Base', testnet: false },
  { id: 42161, name: 'Arbitrum One', testnet: false },
  { id: 42220, name: 'Celo', testnet: false },
  { id: 43114, name: 'Avalanche', testnet: false },
  { id: 59144, name: 'Linea', testnet: false },
  { id: 11155111, name: 'Sepolia', testnet: true },
  { id: 17000, name: 'Holesky', testnet: true },
  { id: 84532, name: 'Base Sepolia', testnet: true },
  { id: 11155420, name: 'OP Sepolia', testnet: true },
  { id: 421614, name: 'Arbitrum Sepolia', testnet: true },
];

export const ALL_CHAINS = CHAIN_DATA;
export const MAINNET_CHAINS = CHAIN_DATA.filter((c) => !c.testnet);
export const TESTNET_CHAINS = CHAIN_DATA.filter((c) => c.testnet);

const nameMap = new Map(CHAIN_DATA.map((c) => [c.id, c.name]));

export function chainName(id: number): string {
  return nameMap.get(id) ?? `Chain ${id}`;
}

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}…${addr.slice(-end)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
