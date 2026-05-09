import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { deployerRouter } from './deployer/routes.js';
import { analyzerRouter } from './analyzer/routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use(deployerRouter);
app.use(analyzerRouter);

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => {
  console.log(`ContractID api on http://localhost:${PORT}`);
  console.log(`  deployer:  /resume/:nameOrAddress  /verify/:chainId/:address`);
  console.log(`  analyzer:  POST /api/analyze        GET /api/agent  /api/health`);
});
