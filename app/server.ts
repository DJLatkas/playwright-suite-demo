import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';
import { viewRouter } from './routes/views';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? '3000';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use('/', viewRouter);

app.listen(PORT, () => {
  console.info(`Demo app running at http://localhost:${PORT}`);
});

export default app;
