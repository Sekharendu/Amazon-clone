import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/health', healthRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});
