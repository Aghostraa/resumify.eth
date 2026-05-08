import express from 'express';
import { buildDeveloperResume } from './index.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.get('/resume/:nameOrAddress', async (req, res) => {
  try {
    const resume = await buildDeveloperResume(req.params.nameOrAddress);
    res.json(resume);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.get('/resume/:nameOrAddress/stats', async (req, res) => {
  try {
    const resume = await buildDeveloperResume(req.params.nameOrAddress);
    res.json({ address: resume.address, ensName: resume.ensName, stats: resume.stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`resumify running on http://localhost:${PORT}`);
});
