import { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient();
const RootWrapper = import.meta.env.DEV ? Fragment : StrictMode;

createRoot(document.getElementById('root')).render(
  <RootWrapper>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </RootWrapper>
);
