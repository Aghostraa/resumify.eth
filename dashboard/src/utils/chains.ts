export interface ChainInfo {
  id: number;
  name: string;
  testnet: boolean;
}

const CHAIN_DATA: ChainInfo[] = [
  // Mainnets (Sourcify-supported)
  { id: 1, name: 'Ethereum', testnet: false },
  { id: 10, name: 'Optimism', testnet: false },
  { id: 30, name: 'Rootstock', testnet: false },
  { id: 56, name: 'BNB Chain', testnet: false },
  { id: 61, name: 'Ethereum Classic', testnet: false },
  { id: 100, name: 'Gnosis', testnet: false },
  { id: 109, name: 'Shibarium', testnet: false },
  { id: 122, name: 'Fuse', testnet: false },
  { id: 130, name: 'Unichain', testnet: false },
  { id: 137, name: 'Polygon', testnet: false },
  { id: 148, name: 'Shimmer EVM', testnet: false },
  { id: 177, name: 'Hashkey Chain', testnet: false },
  { id: 239, name: 'ZKFair', testnet: false },
  { id: 314, name: 'Filecoin', testnet: false },
  { id: 324, name: 'zkSync Era', testnet: false },
  { id: 360, name: 'Shape', testnet: false },
  { id: 480, name: 'World Chain', testnet: false },
  { id: 488, name: 'Blast', testnet: false },
  { id: 592, name: 'Astar', testnet: false },
  { id: 690, name: 'Redstone', testnet: false },
  { id: 698, name: 'Matchain', testnet: false },
  { id: 714, name: 'BNB Greenfield', testnet: false },
  { id: 747, name: 'Flow EVM', testnet: false },
  { id: 869, name: 'Rollux', testnet: false },
  { id: 1135, name: 'Lisk', testnet: false },
  { id: 1514, name: 'Story', testnet: false },
  { id: 1729, name: 'Reya', testnet: false },
  { id: 1829, name: 'Amoy', testnet: false },
  { id: 1868, name: 'Soneium', testnet: false },
  { id: 1890, name: 'LightLink', testnet: false },
  { id: 2288, name: 'Kava EVM', testnet: false },
  { id: 2366, name: 'Carbon EVM', testnet: false },
  { id: 3946, name: 'Ryoshi', testnet: false },
  { id: 4326, name: 'Elixir', testnet: false },
  { id: 6497, name: 'Oasis Sapphire', testnet: false },
  { id: 7000, name: 'ZetaChain', testnet: false },
  { id: 8021, name: 'Boba BNB', testnet: false },
  { id: 8453, name: 'Base', testnet: false },
  { id: 8822, name: 'IOTA EVM', testnet: false },
  { id: 13371, name: 'Immutable zkEVM', testnet: false },
  { id: 32769, name: 'Zilliqa EVM', testnet: false },
  { id: 34443, name: 'Mode', testnet: false },
  { id: 41923, name: 'Plume', testnet: false },
  { id: 42161, name: 'Arbitrum One', testnet: false },
  { id: 42170, name: 'Arbitrum Nova', testnet: false },
  { id: 42220, name: 'Celo', testnet: false },
  { id: 42793, name: 'Etherlink', testnet: false },
  { id: 57073, name: 'Ink', testnet: false },
  { id: 73115, name: 'Sei EVM', testnet: false },
  { id: 102030, name: 'Boba Ethereum', testnet: false },
  { id: 245022934, name: 'Neon EVM', testnet: false },
  { id: 612055, name: 'Telos EVM', testnet: false },
  { id: 685689, name: 'Kaia', testnet: false },
  // Testnets
  { id: 11155111, name: 'Sepolia', testnet: true },
  { id: 17000, name: 'Holesky', testnet: true },
  { id: 84532, name: 'Base Sepolia', testnet: true },
  { id: 11155420, name: 'OP Sepolia', testnet: true },
  { id: 421614, name: 'Arbitrum Sepolia', testnet: true },
  { id: 300, name: 'zkSync Sepolia', testnet: true },
  { id: 1301, name: 'Unichain Sepolia', testnet: true },
  { id: 1315, name: 'Story Testnet', testnet: true },
  { id: 534351, name: 'Scroll Sepolia', testnet: true },
  { id: 80002, name: 'Polygon Amoy', testnet: true },
  { id: 4202, name: 'Lisk Sepolia', testnet: true },
  { id: 7001, name: 'ZetaChain Athens', testnet: true },
  { id: 10200, name: 'Gnosis Chiado', testnet: true },
  { id: 560048, name: 'Holesky (alt)', testnet: true },
  { id: 31, name: 'Rootstock Testnet', testnet: true },
  { id: 63, name: 'Mordor', testnet: true },
  { id: 81, name: 'Shimmber EVM Testnet', testnet: true },
  { id: 123, name: 'Fuse Spark', testnet: true },
  { id: 545, name: 'Flow EVM Testnet', testnet: true },
  { id: 1073, name: 'Shimmer EVM Testnet', testnet: true },
  { id: 1076, name: 'Boba Sepolia', testnet: true },
  { id: 1891, name: 'LightLink Pegasus', testnet: true },
  { id: 1946, name: 'Soneium Minato', testnet: true },
  { id: 2368, name: 'Kava Testnet', testnet: true },
  { id: 2391, name: 'Carbon Testnet', testnet: true },
  { id: 3941, name: 'Ryoshi Testnet', testnet: true },
  { id: 3945, name: 'Elixir Testnet', testnet: true },
  { id: 4801, name: 'World Chain Sepolia', testnet: true },
  { id: 4888, name: 'Plume Testnet', testnet: true },
  { id: 6343, name: 'Sei Testnet', testnet: true },
  { id: 6398, name: 'Oasis Sapphire Testnet', testnet: true },
  { id: 8408, name: 'Kaia Testnet', testnet: true },
  { id: 11011, name: 'Shape Sepolia', testnet: true },
  { id: 11142220, name: 'Celo Alfajores', testnet: true },
  { id: 11155420, name: 'OP Sepolia', testnet: true },
  { id: 13473, name: 'Immutable Testnet', testnet: true },
  { id: 33101, name: 'Zilliqa Testnet', testnet: true },
  { id: 69420, name: 'Redstone Garnet', testnet: true },
  { id: 73114, name: 'Ink Sepolia', testnet: true },
  { id: 89346162, name: 'ZKFair Testnet', testnet: true },
  { id: 102031, name: 'Boba BNB Testnet', testnet: true },
  { id: 102032, name: 'Boba Goerli', testnet: true },
  { id: 127823, name: 'Etherlink Testnet', testnet: true },
  { id: 222888, name: 'Reya Cronos', testnet: true },
  { id: 245022926, name: 'Neon EVM Devnet', testnet: true },
  { id: 314159, name: 'Filecoin Calibration', testnet: true },
  { id: 323432, name: 'Hashkey Testnet', testnet: true },
  { id: 656476, name: 'Ink Sepolia (alt)', testnet: true },
  { id: 685685, name: 'Kaia Kairos', testnet: true },
  { id: 695569, name: 'Shibarium Puppynet', testnet: true },
  { id: 763373, name: 'Ink Mainnet Beta', testnet: true },
  { id: 5042002, name: 'Astar zKyoto', testnet: true },
  { id: 5278000, name: 'Plume Phoenix', testnet: true },
  { id: 3735928814, name: 'BEEF', testnet: true },
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
