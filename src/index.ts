import dotenv from 'dotenv';
dotenv.config();
import express, { Express, Request, Response } from 'express';
import api from '@/routes/api';

const app: Express = express();

const { PORT } = process.env;

app.use('/api', api);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});