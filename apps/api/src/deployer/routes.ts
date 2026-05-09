import { Router, type Router as ExpressRouter } from 'express';
import { buildDeveloperResume } from './index.js';
import {
  checkVerification,
  submitVerification,
  submitVerificationWithMetadata,
  getVerificationStatus,
  waitForVerification,
} from './sources/sourcify-verify.js';

export const deployerRouter: ExpressRouter = Router();

deployerRouter.get('/api/resume/:nameOrAddress', async (req, res) => {
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

deployerRouter.get('/api/resume/:nameOrAddress/stats', async (req, res) => {
  try {
    const resume = await buildDeveloperResume(req.params.nameOrAddress);
    res.json({ address: resume.address, ensName: resume.ensName, stats: resume.stats });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

deployerRouter.get('/verify/:chainId/:address', async (req, res) => {
  try {
    const result = await checkVerification(Number(req.params.chainId), req.params.address);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

deployerRouter.post('/verify/:chainId/:address', async (req, res) => {
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

deployerRouter.post('/verify/metadata/:chainId/:address', async (req, res) => {
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
      sources,
    );
    res.status('verificationId' in result ? 202 : 400).json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

deployerRouter.get('/verify/status/:verificationId', async (req, res) => {
  try {
    const result = await getVerificationStatus(req.params.verificationId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

deployerRouter.get('/verify/wait/:verificationId', async (req, res) => {
  try {
    const result = await waitForVerification(req.params.verificationId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
