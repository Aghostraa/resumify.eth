import { BigQuery } from '@google-cloud/bigquery';

export interface SourceifyRecord {
  contractAddress: string;
  chainId: number;
  txHash: string | null;
  blockNumber: number | null;
  contractName: string | null;
  compiler: string | null;
  compilerVersion: string | null;
  verifiedAt: string | null;
}

const bq = new BigQuery();

export async function fetchSourceifyVerified(address: string): Promise<SourceifyRecord[]> {
  const addressNoPrefix = address.toLowerCase().replace('0x', '');

  const query = `
    SELECT
      CONCAT('0x', TO_HEX(cd.address))           AS contract_address,
      cd.chain_id,
      CONCAT('0x', TO_HEX(cd.transaction_hash))  AS tx_hash,
      CAST(cd.block_number AS INT64)              AS block_number,
      cc.name                                     AS contract_name,
      cc.compiler,
      cc.version                                  AS compiler_version,
      CAST(vc.created_at AS STRING)               AS verified_at
    FROM \`sourcify.public_contract_deployments\` cd
    JOIN \`sourcify.public_verified_contracts\`   vc ON vc.deployment_id = cd.id
    JOIN \`sourcify.public_compiled_contracts\`   cc ON cc.id = vc.compilation_id
    WHERE cd.deployer = FROM_HEX(@address)
    ORDER BY cd.block_number DESC
  `;

  const [rows] = await bq.query({
    query,
    params: { address: addressNoPrefix },
    location: 'europe-west1',
  });

  return rows.map((r: Record<string, unknown>) => ({
    contractAddress: r.contract_address as string,
    chainId: Number(r.chain_id),
    txHash: r.tx_hash as string | null,
    blockNumber: r.block_number != null ? Number(r.block_number) : null,
    contractName: r.contract_name as string | null,
    compiler: r.compiler as string | null,
    compilerVersion: r.compiler_version as string | null,
    verifiedAt: r.verified_at as string | null,
  }));
}
