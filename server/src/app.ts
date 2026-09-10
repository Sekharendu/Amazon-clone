import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { guestSessionMiddleware } from './middleware/guestSession.js';
import { healthRouter } from './routes/health.js';
import { sessionRouter } from './routes/session.js';

export const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use('/api/health', healthRouter);
app.use('/api/session', guestSessionMiddleware, sessionRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});
