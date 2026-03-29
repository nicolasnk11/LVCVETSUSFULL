import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

//ATENÇÃO: O React.StrictMode foi intencionalmente desativado.
// A renderização dupla do StrictMode em ambiente de desenvolvimento 
// causa instabilidade e duplicação nas instâncias do mapa (Leaflet).
createRoot(document.getElementById('root')).render(
    <App />
);