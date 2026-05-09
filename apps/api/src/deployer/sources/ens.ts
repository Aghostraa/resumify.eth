import { createPublicClient, http, type Address } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import {
  getEnsAddress,
  getEnsName,
  getEnsText,
} from 'viem/ens';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://1rpc.io/eth'),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL_SEPOLIA ?? 'https://sepolia.drpc.org'),
});

const TEXT_KEYS = [
  'name',
  'description',
  'avatar',
  'com.github',
  'com.twitter',
  'url',
  'location',
  'email',
] as const;

export interface ENSProfile {
  ensName: string | null;
  address: string | null;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
  location: string | null;
  email: string | null;
}

export async function resolveENS(input: string): Promise<{ address: string; ensName: string | null }> {
  const isAddress = /^0x[0-9a-fA-F]{40}$/.test(input);

  if (isAddress) {
    // Try mainnet first, then Sepolia (for testnet-registered names like ahoura.eth on Sepolia)
    const [mainnetName, sepoliaName] = await Promise.all([
      getEnsName(client, { address: input as Address }).catch(() => null),
      getEnsName(sepoliaClient, { address: input as Address }).catch(() => null),
    ]);
    return { address: input, ensName: mainnetName ?? sepoliaName };
  }

  // Forward resolve: try mainnet then Sepolia
  const mainnetAddr = await getEnsAddress(client, { name: input }).catch(() => null);
  if (mainnetAddr) return { address: mainnetAddr, ensName: input };

  const sepoliaAddr = await getEnsAddress(sepoliaClient, { name: input }).catch(() => null);
  if (sepoliaAddr) return { address: sepoliaAddr, ensName: input };

  throw new Error(`Could not resolve ENS name: ${input}`);
}

export async function fetchENSProfile(ensName: string): Promise<ENSProfile> {
  const results = await Promise.allSettled(
    TEXT_KEYS.map((key) => getEnsText(client, { name: ensName, key }))
  );

  const get = (i: number) =>
    results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<string | null>).value : null;

  return {
    ensName,
    address: null,
    displayName: get(0),
    bio: get(1),
    avatar: get(2),
    github: get(3),
    twitter: get(4),
    website: get(5),
    location: get(6),
    email: get(7),
  };
}
