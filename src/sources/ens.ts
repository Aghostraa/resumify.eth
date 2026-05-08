import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import {
  getEnsAddress,
  getEnsName,
  getEnsText,
} from 'viem/ens';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://1rpc.io/eth'),
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
    const ensName = await getEnsName(client, { address: input as Address }).catch(() => null);
    return { address: input, ensName };
  }

  const address = await getEnsAddress(client, { name: input }).catch(() => null);
  if (!address) throw new Error(`Could not resolve ENS name: ${input}`);
  return { address, ensName: input };
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
