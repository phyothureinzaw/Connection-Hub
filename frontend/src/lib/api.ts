export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId: string;
}

export class ApiError extends Error {
  constructor(public problem: ProblemDetails) { super(problem.detail); }
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

function isProblem(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return ['type', 'title', 'detail', 'instance', 'requestId'].every((key) => typeof p[key] === 'string') && typeof p.status === 'number';
}

export async function apiGet<T>(path: string, signal: AbortSignal, validate: (value: unknown) => value is T): Promise<T> {
  // Bound stalled diagnostics while preserving TanStack Query cancellation.
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]), headers: { Accept: 'application/json' } });
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    if (isProblem(body)) throw new ApiError(body);
    throw new Error('The service returned an unsuccessful response.');
  }
  if (!validate(body)) throw new Error('The service returned an unexpected response.');
  return body;
}
