import { createRequire } from 'node:module';
import { JsonRpcProvider, Wallet } from 'ethers';
import type { OliLabel } from '@contractid/core';

// EAS SDK ships an ESM build with broken (extensionless) relative imports;
// load via createRequire to force the CJS bundle.
const easRequire = createRequire(import.meta.url);
const { EAS, SchemaEncoder, ZERO_BYTES32 } = easRequire('@ethereum-attestation-service/eas-sdk') as {
  EAS: new (address: string) => {
    connect: (signer: unknown) => void;
    getOffchain: () => Promise<{
      signOffchainAttestation: (
        args: {
          schema: string;
          recipient: string;
          time: bigint;
          expirationTime: bigint;
          revocable: boolean;
          refUID: string;
          data: string;
        },
        signer: unknown,
      ) => Promise<{ uid: string; [k: string]: unknown }>;
    }>;
  };
  SchemaEncoder: new (raw: string) => {
    encodeData: (items: { name: string; value: string; type: string }[]) => string;
  };
  ZERO_BYTES32: string;
};

const OLI_API_BASE = process.env.OLI_API_BASE ?? 'https://api.openlabelsinitiative.org';
const OLI_OFFCHAIN_URL = process.env.OLI_OFFCHAIN_URL ?? 'https://base.easscan.org/offchain/store';

const SCHEMA_UID_V2 = '0xcff83309b59685fdae9dad7c63d969150676d51d8eeda66799d1c4898b84556a';
const SCHEMA_RAW = 'string CAIP10,string tags_json';
const EAS_BASE_CONTRACT = '0x4200000000000000000000000000000000000021';
const BASE_CHAIN_ID = 8453;

export async function getLabels(address: string, chainId: number): Promise<OliLabel | null> {
  const apiKey = process.env.OLI_API_KEY;
  try {
    const url = `${OLI_API_BASE}/api/v1/labels?address=${address}&chain_id=eip155:${chainId}&limit=50`;
    const headers: Record<string, string> = apiKey ? { 'x-api-key': apiKey } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      address: string;
      labels: { tag_id: string; tag_value: string }[];
    };

    const get = (id: string) => data.labels.find((l) => l.tag_id === id)?.tag_value;
    const ercTypeRaw = get('erc_type');

    return {
      ownerProject: get('owner_project'),
      contractName: get('contract_name') ?? get('name'),
      usageCategory: get('usage_category'),
      sourceCodeVerified: get('source_code_verified'),
      audit: get('audit'),
      ercType: ercTypeRaw ? ercTypeRaw.split(',').map((s) => s.trim()) : undefined,
      raw: Object.fromEntries(data.labels.map((l) => [l.tag_id, l.tag_value])),
    };
  } catch {
    return null;
  }
}

export async function getSimilarContracts(ownerProject: string, excludeAddress: string, limit = 5): Promise<string[]> {
  if (!ownerProject) return [];
  try {
    const url = `${OLI_API_BASE}/api/v1/labels?owner_project=${encodeURIComponent(ownerProject)}&limit=${limit + 5}`;
    const apiKey = process.env.OLI_API_KEY;
    const headers: Record<string, string> = apiKey ? { 'x-api-key': apiKey } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: { address: string }[] };
    return (data.items ?? [])
      .map((it) => it.address)
      .filter((a) => a.toLowerCase() !== excludeAddress.toLowerCase())
      .slice(0, limit);
  } catch {
    return [];
  }
}

export interface AttestScoreInput {
  address: string;
  chainId: number;
  ensName: string;
  score: number;
  pattern?: string;
  sourcifyVerified: 'true' | 'partial' | 'false';
  scoreVersion?: string;
}

export interface AttestScoreResult {
  ok: boolean;
  uid?: string;
  ipfsHash?: string;
  attestationUrl?: string;
  reason?: string;
}

export async function attestScore(input: AttestScoreInput): Promise<AttestScoreResult> {
  const pk = process.env.EAS_PRIVATE_KEY ?? process.env.ENS_PRIVATE_KEY;
  const baseRpc = process.env.RPC_URL_BASE;
  if (!pk || !baseRpc) {
    return { ok: false, reason: 'EAS_PRIVATE_KEY or RPC_URL_BASE not set' };
  }

  try {
    const provider = new JsonRpcProvider(baseRpc, BASE_CHAIN_ID);
    const wallet = new Wallet(pk, provider);

    const eas = new EAS(EAS_BASE_CONTRACT);
    eas.connect(wallet);
    const offchain = await eas.getOffchain();

    const tagsJson: Record<string, string> = {
      contract_name: input.ensName,
      source_code_verified: input.sourcifyVerified === 'true' ? 'sourcify' : input.sourcifyVerified,
      _comment: `score=${input.score},version=${input.scoreVersion ?? '1.0'}${input.pattern ? `,pattern=${input.pattern}` : ''}`,
      _source: 'contractid.app',
    };

    const encoder = new SchemaEncoder(SCHEMA_RAW);
    const encoded = encoder.encodeData([
      { name: 'CAIP10', value: `eip155:${input.chainId}:${input.address}`, type: 'string' },
      { name: 'tags_json', value: JSON.stringify(tagsJson), type: 'string' },
    ]);

    const time = BigInt(Math.floor(Date.now() / 1000));
    const attestation = await offchain.signOffchainAttestation(
      {
        schema: SCHEMA_UID_V2,
        recipient: '0x0000000000000000000000000000000000000000',
        time,
        expirationTime: 0n,
        revocable: true,
        refUID: ZERO_BYTES32,
        data: encoded,
      },
      wallet as never,
    );

    const submitRes = await fetch(OLI_OFFCHAIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `${attestation.uid}.json`,
        textJson: JSON.stringify({
          sig: attestation,
          signer: wallet.address,
        }),
      }),
    }).catch(() => null);

    let ipfsHash: string | undefined;
    if (submitRes && submitRes.ok) {
      const submitData = (await submitRes.json().catch(() => null)) as { ipfsHash?: string } | null;
      ipfsHash = submitData?.ipfsHash;
    }

    return {
      ok: true,
      uid: attestation.uid,
      ipfsHash,
      attestationUrl: ipfsHash
        ? `https://base.easscan.org/offchain/attestation/view/${attestation.uid}`
        : undefined,
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'EAS attestation failed' };
  }
}
