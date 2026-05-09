import 'dotenv/config';
import express from 'express';
import { buildDeveloperResume } from './index.js';
import {
  checkVerification,
  submitVerification,
  submitVerificationWithMetadata,
  getVerificationStatus,
  waitForVerification,
} from './sources/sourcify-verify.js';

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT ?? 3001);

// ── Resume endpoints ────────────────────────────────────────────────────────

app.get('/resume/:nameOrAddress', async (req, res) => {
  try {
    const includeTestnets = req.query.testnets === 'true';
    const chainsParam = req.query.chains as string | undefined;
    const chains = chainsParam
      ? chainsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
      : undefined;
    const resume = await buildDeveloperResume(req.params.nameOrAddress, { includeTestnets, chains });
    res.json(resume);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.get('/resume/:nameOrAddress/stats', async (req, res) => {
  try {
    const resume = await buildDeveloperResume(req.params.nameOrAddress);
    res.json({ address: resume.address, ensName: resume.ensName, stats: resume.stats });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Sourcify verification endpoints ────────────────────────────────────────

// GET /verify/:chainId/:address — check if contract is verified on Sourcify
app.get('/verify/:chainId/:address', async (req, res) => {
  try {
    const result = await checkVerification(Number(req.params.chainId), req.params.address);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /verify/:chainId/:address — submit std JSON input (Sourcify v2 API)
// Body: { stdJsonInput, compilerVersion, contractIdentifier, creationTransactionHash? }
app.post('/verify/:chainId/:address', async (req, res) => {
  try {
    const { stdJsonInput, compilerVersion, contractIdentifier, creationTransactionHash } = req.body as {
      stdJsonInput?: object;
      compilerVersion?: string;
      contractIdentifier?: string;
      creationTransactionHash?: string;
    };

    if (!stdJsonInput || !compilerVersion || !contractIdentifier) {
      res.status(400).json({ error: 'Body must include stdJsonInput, compilerVersion, contractIdentifier' });
      return;
    }

    const result = await submitVerification(Number(req.params.chainId), req.params.address, {
      stdJsonInput,
      compilerVersion,
      contractIdentifier,
      creationTransactionHash,
    });

    res.status('verificationId' in result ? 202 : 400).json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /verify/metadata/:chainId/:address — submit using Solidity metadata.json
// Body: { metadata: {}, sources: { "contracts/Foo.sol": "source content" } }
app.post('/verify/metadata/:chainId/:address', async (req, res) => {
  try {
    const { metadata, sources } = req.body as { metadata?: object; sources?: Record<string, string> };

    if (!metadata || !sources) {
      res.status(400).json({ error: 'Body must include metadata and sources' });
      return;
    }

    const result = await submitVerificationWithMetadata(
      Number(req.params.chainId),
      req.params.address,
      metadata,
      sources
    );

    res.status('verificationId' in result ? 202 : 400).json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /verify/status/:verificationId — poll a pending verification job
app.get('/verify/status/:verificationId', async (req, res) => {
  try {
    const result = await getVerificationStatus(req.params.verificationId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /verify/wait/:verificationId — block until done (max 30s)
app.get('/verify/wait/:verificationId', async (req, res) => {
  try {
    const result = await waitForVerification(req.params.verificationId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`resumify running on http://localhost:${PORT}`);
  console.log(`  GET  /resume/:nameOrAddress`);
  console.log(`  GET  /resume/:nameOrAddress/stats`);
  console.log(`  GET  /verify/:chainId/:address              — check Sourcify status`);
  console.log(`  POST /verify/:chainId/:address              — submit std JSON for verification`);
  console.log(`  POST /verify/metadata/:chainId/:address     — submit via metadata.json`);
  console.log(`  GET  /verify/status/:verificationId         — poll job status`);
  console.log(`  GET  /verify/wait/:verificationId           — wait until done`);
});
