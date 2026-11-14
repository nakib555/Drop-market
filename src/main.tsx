import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {captureEarlyInstallPrompt} from './hooks/usePWAInstall.ts';
import './index.css';

captureEarlyInstallPrompt();

createRoot(document.getElementById('root')!).render(<App />);
