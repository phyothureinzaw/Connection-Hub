import { Writable } from 'node:stream';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { errorHandler } from '../src/shared/middleware/error-handler.js';
import { requestContext } from '../src/shared/middleware/request-context.js';

const logger = pino({ level: 'silent' });
const makeApp = (checkDatabase = async () => {}) => createApp({ corsOrigin: 'http://localhost:5173', checkDatabase, logger });

describe('foundation API', () => {
  it('liveness never calls the database and includes security, CORS and request ID headers', async () => {
    const check = vi.fn().mockRejectedValue(new Error('database offline'));
    const res = await request(makeApp(check)).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(check).not.toHaveBeenCalled();
    expect(res.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
  it('readiness checks the database', async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    const res = await request(makeApp(check)).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', database: 'connected' });
    expect(check).toHaveBeenCalledOnce();
  });
  it('returns safe 503 Problem Details when the database is unavailable', async () => {
    const res = await request(makeApp(async () => { throw new Error('postgresql://secret:password@private/db'); })).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toEqual({ type: 'about:blank', title: 'Service Unavailable', status: 503,
      detail: 'The database is currently unavailable. Please try again.', instance: '/api/ready',
      requestId: res.headers['x-request-id'] });
    expect(res.text).not.toContain('password');
  });
  it('returns Problem Details for an unknown API route without query strings', async () => {
    const res = await request(makeApp()).get('/api/missing?token=secret');
    expect(res.status).toBe(404);
    expect(res.body.instance).toBe('/api/missing');
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
    expect(res.text).not.toContain('secret');
  });
  it('sanitizes unexpected failures in responses and logs without a production test route', async () => {
    let logs = '';
    const sink = new Writable({ write(chunk, _encoding, done) { logs += String(chunk); done(); } });
    const testLogger = pino({}, sink);
    const app = express();
    app.use(requestContext(testLogger));
    app.get('/', () => { throw new Error('secret-password and internal stack'); });
    app.use(errorHandler(testLogger));
    const res = await request(app).get('/?token=secret-token').set('Authorization', 'Bearer secret-auth').set('Cookie', 'secret-cookie');
    expect(res.status).toBe(500);
    expect(res.body.detail).toBe('An unexpected error occurred.');
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
    expect(res.text + logs).not.toMatch(/secret-|internal stack/);
    expect(logs).toContain(res.body.requestId);
  });
  it('handles malformed and oversized JSON safely', async () => {
    const malformed = await request(makeApp()).post('/api/health').set('Content-Type', 'application/json').send('{');
    expect(malformed.status).toBe(400);
    const large = await request(makeApp()).post('/api/health').send({ value: 'x'.repeat(17000) });
    expect(large.status).toBe(413);
  });
  it('validates configuration without disclosing values', () => {
    expect(() => loadEnv({ DATABASE_URL: 'secret-value', PORT: 'wrong' })).toThrow(/PORT, DATABASE_URL/);
    try { loadEnv({ DATABASE_URL: 'secret-value' }); } catch (error) {
      expect(String(error)).not.toContain('secret-value');
    }
    expect(loadEnv({ DATABASE_URL: 'postgresql://app:password@localhost/connecthub_dev' }).PORT).toBe(4000);
  });
});
