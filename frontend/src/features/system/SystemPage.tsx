import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

type Health = { status: 'ok' };
type Ready = { status: 'ready'; database: 'connected' };
const isHealth = (v: unknown): v is Health => typeof v === 'object' && v !== null && 'status' in v && v.status === 'ok';
const isReady = (v: unknown): v is Ready => typeof v === 'object' && v !== null && 'status' in v && v.status === 'ready' && 'database' in v && v.database === 'connected';

function StatusCard({ title, description, fetching, failed, success }: {
  title: string; description: string; fetching: boolean; failed: boolean; success: string;
}) {
  const state = fetching ? 'Checking' : failed ? 'Unavailable' : 'Connected';
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="mb-7 flex items-center justify-between gap-3">
      <div aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5"/></svg>
      </div>
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${fetching ? 'bg-indigo-50 text-indigo-700' : failed ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${fetching ? 'animate-pulse bg-indigo-600' : failed ? 'bg-amber-600' : 'bg-emerald-600'}`} />{state}
      </span>
    </div>
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    <div role="status" aria-live="polite" className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">
      {fetching ? 'Checking the connection…' : failed ? 'Connection unavailable. Check the service and try again.' : success}
    </div>
  </section>;
}

export function SystemPage() {
  const health = useQuery({ queryKey: ['system', 'health'], queryFn: ({ signal }) => apiGet('/health', signal, isHealth) });
  const ready = useQuery({ queryKey: ['system', 'ready'], queryFn: ({ signal }) => apiGet('/ready', signal, isReady) });
  const checking = health.isFetching || ready.isFetching;
  const unavailable = health.isError || ready.isError;
  return <div className="min-h-screen">
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5 sm:px-10">
        <div aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10 8 2-2a4 4 0 0 1 6 6l-2 2M14 16l-2 2a4 4 0 0 1-6-6l2-2M8 16l8-8"/></svg></div>
        <span className="text-lg font-bold tracking-tight">ConnectHub</span>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-6 pb-12 pt-14 sm:px-10 sm:pt-20">
      <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700"><span className="h-px w-6 bg-indigo-500" /> A place for connection</div>
      <h1 className="text-4xl font-bold tracking-[-0.045em] sm:text-6xl">ConnectHub</h1>
      <p className="mt-4 text-lg text-slate-500 sm:text-xl">Your space to connect.</p>
      <section aria-labelledby="status-heading" className="mt-12 sm:mt-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h2 id="status-heading" className="text-xl font-semibold tracking-tight">System status</h2><p className="mt-1 text-sm text-slate-500">A quick check of the services behind ConnectHub.</p></div>
          <button type="button" disabled={checking} onClick={() => { void health.refetch(); void ready.refetch(); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"><svg aria-hidden="true" className={checking ? 'animate-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg>{checking ? 'Checking…' : 'Check again'}</button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <StatusCard title="API status" description="The connection to the ConnectHub server." fetching={health.isPending || health.isFetching} failed={health.isError} success="The API is responding normally." />
          <StatusCard title="Database readiness" description="The server’s connection to the database." fetching={ready.isPending || ready.isFetching} failed={ready.isError} success="The database is connected and ready." />
        </div>
        <p role="status" className="mt-6 flex items-start gap-2 text-sm leading-6 text-slate-500"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />{checking ? 'Checking services. This will only take a moment.' : unavailable ? 'Some services are unavailable. You can check again when they’re ready.' : 'All services are connected. Everything is ready.'}</p>
      </section>
      <footer className="mt-16 border-t border-slate-200 pt-6 text-xs tracking-wide text-slate-500">ConnectHub <span aria-hidden="true" className="mx-2">/</span> Project foundation</footer>
    </main>
  </div>;
}
