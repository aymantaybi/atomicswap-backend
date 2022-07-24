require("dotenv").config();

import express, { Express, Request, Response } from 'express';
import cors from "cors";
import helmet from "helmet";

import api from './routes/api';
import stream from './routes/stream';

const { PORT } = process.env;

const app: Express = express();

app.set('trust proxy', true);

app.use(express.json());

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({ origin: '*', credentials: true }));

app.use('/api', api);
app.use('/stream', stream);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});