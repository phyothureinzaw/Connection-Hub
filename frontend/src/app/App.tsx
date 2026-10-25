import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { SystemPage } from '../features/system/SystemPage';

const queryClient = new QueryClient({ defaultOptions: { queries: {
  retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
} } });

export function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><Routes>
    <Route path="/" element={<SystemPage />} />
    <Route path="*" element={<main className="mx-auto max-w-xl p-10"><h1 className="text-3xl font-bold">Page not found</h1><a className="mt-6 inline-block text-indigo-700 underline" href="/">Back to ConnectHub</a></main>} />
  </Routes></BrowserRouter></QueryClientProvider>;
}
