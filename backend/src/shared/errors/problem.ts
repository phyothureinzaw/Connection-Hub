import type { Request, Response } from 'express';

export class AppError extends Error {
  constructor(public status: number, public title: string, public detail: string) {
    super(title);
  }
}

export function sendProblem(req: Request, res: Response, status: number, title: string, detail: string) {
  res.status(status).type('application/problem+json').json({
    type: 'about:blank', title, status, detail,
    instance: req.path,
    requestId: res.locals.requestId as string,
  });
}
