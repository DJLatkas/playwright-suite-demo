import { Router, Request, Response } from 'express';
import path from 'path';

export const viewRouter = Router();

const view = (name: string): string =>
  path.join(__dirname, '..', 'views', `${name}.html`);

viewRouter.get('/', (_req: Request, res: Response) => {
  res.redirect('/login');
});

viewRouter.get('/login', (_req: Request, res: Response) => {
  res.sendFile(view('login'));
});

viewRouter.get('/dashboard', (_req: Request, res: Response) => {
  res.sendFile(view('dashboard'));
});

viewRouter.get('/reports', (_req: Request, res: Response) => {
  res.sendFile(view('reports'));
});

viewRouter.get('/controls', (_req: Request, res: Response) => {
  res.sendFile(view('controls'));
});
