import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import './styles/global.css';
import App from './App.jsx';
import { bootstrapAuthFromUrl } from './utils/apiClient';

bootstrapAuthFromUrl();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
