const SOURCIFY_V2 = 'https://sourcify.dev/server/v2';

export interface VerifyRequest {
  stdJsonInput: object;
  compilerVersion: string;
  contractIdentifier: string;         // e.g. "contracts/SafeVault.sol:SafeVault"
  creationTransactionHash?: string;
}

export interface VerificationJob {
  verificationId: string;
  status: 'pending' | 'done' | 'error';
  match?: 'exact_match' | 'match' | null;
  errorMessage?: string;
}

export interface ContractStatus {
  address: string;
  chainId: number;
  verified: boolean;
  runtimeMatch: string | null;
  creationMatch: string | null;
}

// Submit contract for verification — returns a verificationId ticket
export async function submitVerification(
  chainId: number,
  address: string,
  payload: VerifyRequest
): Promise<{ verificationId: string } | { error: string; code: string }> {
  const res = await fetch(`${SOURCIFY_V2}/verify/${chainId}/${address}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (res.status === 409) {
    return { error: data.message as string, code: 'already_verified' };
  }
  if (!res.ok) {
    return { error: (data.message as string) ?? res.statusText, code: (data.customCode as string) ?? 'error' };
  }

  return { verificationId: data.verificationId as string };
}

// Submit using metadata.json + source files (simpler — no compiler version needed)
export async function submitVerificationWithMetadata(
  chainId: number,
  address: string,
  metadata: object,
  sources: Record<string, string>   // { "contracts/Foo.sol": "source content" }
): Promise<{ verificationId: string } | { error: string; code: string }> {
  const res = await fetch(`${SOURCIFY_V2}/verify/metadata/${chainId}/${address}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata, sources }),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (res.status === 409) {
    return { error: data.message as string, code: 'already_verified' };
  }
  if (!res.ok) {
    return { error: (data.message as string) ?? res.statusText, code: (data.customCode as string) ?? 'error' };
  }

  return { verificationId: data.verificationId as string };
}

// Poll verification job status
export async function getVerificationStatus(verificationId: string): Promise<VerificationJob> {
  const res = await fetch(`${SOURCIFY_V2}/verify/${verificationId}`);
  const data = (await res.json()) as Record<string, unknown>;
  const contract = data.contract as Record<string, unknown> | undefined;

  if (data.isJobCompleted) {
    return {
      verificationId,
      status: 'done',
      match: (contract?.match as VerificationJob['match']) ?? null,
    };
  }

  if (data.errorMessage) {
    return { verificationId, status: 'error', errorMessage: data.errorMessage as string };
  }

  return { verificationId, status: 'pending' };
}

// Poll until done (max 30s)
export async function waitForVerification(verificationId: string, timeoutMs = 30_000): Promise<VerificationJob> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await getVerificationStatus(verificationId);
    if (job.status !== 'pending') return job;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { verificationId, status: 'error', errorMessage: 'Verification timed out' };
}

// Check if already verified
export async function checkVerification(chainId: number, address: string): Promise<ContractStatus> {
  const res = await fetch(`${SOURCIFY_V2}/contract/${chainId}/${address}`);

  if (res.status === 404) {
    return { address, chainId, verified: false, runtimeMatch: null, creationMatch: null };
  }

  const data = (await res.json()) as Record<string, unknown>;
  return {
    address,
    chainId,
    verified: true,
    runtimeMatch: data.runtimeMatch as string | null,
    creationMatch: data.creationMatch as string | null,
  };
}
