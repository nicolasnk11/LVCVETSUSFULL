import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- PÁGINAS DO SISTEMA ---
import Menu from './Menu';
import Mapa from './Mapa';
import Cadastro from './Cadastro'; 
import CadastroPet from './CadastroPet';
import GestaoClinica from './GestaoClinica';
import Dashboard from './Dashboard';
import Login from './Login'; 
import ConsultaPublica from './ConsultaPublica';
import Perfil from './Perfil';
import Alertas from './Alertas';

// 🛡️ COMPONENTE DE PROTEÇÃO (Middlewere de Rotas)
const RotaPrivada = ({ children, isAuth }) => {
    // O "replace" limpa o histórico para o usuário não ficar preso no botão "Voltar" do navegador
    return isAuth ? children : <Navigate to="/login" replace />;
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('lvcvetsus_token');
        if (token) {
            setIsAuthenticated(true);
        }
        // Suaviza a transição inicial do sistema
        setTimeout(() => setLoadingAuth(false), 300);
    }, []);

    const handleLogin = () => {
        localStorage.setItem('lvcvetsus_token', 'token_ativo');
        setIsAuthenticated(true);
    };

    // ⏳ UX PREMIUM: Evita a tela em branco ao iniciar o sistema
    if (loadingAuth) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
                <Loader2 className="text-primary spin-animation mb-3" size={48} />
                <h6 className="text-secondary fw-bold" style={{ letterSpacing: '1px' }}>VERIFICANDO CREDENCIAIS...</h6>
                <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* 🔓 ROTAS PÚBLICAS */}
                <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
                <Route path="/consulta/:id" element={<ConsultaPublica />} />
                
                {/* 🔒 ROTAS PRIVADAS (Requerem Autenticação) */}
                <Route path="/" element={<RotaPrivada isAuth={isAuthenticated}><Menu /></RotaPrivada>} />
                <Route path="/mapa" element={<RotaPrivada isAuth={isAuthenticated}><Mapa /></RotaPrivada>} />
                <Route path="/cadastro" element={<RotaPrivada isAuth={isAuthenticated}><Cadastro /></RotaPrivada>} />
                <Route path="/cadastro-pet" element={<RotaPrivada isAuth={isAuthenticated}><CadastroPet /></RotaPrivada>} />
                <Route path="/clinica" element={<RotaPrivada isAuth={isAuthenticated}><GestaoClinica /></RotaPrivada>} />
                <Route path="/dashboard" element={<RotaPrivada isAuth={isAuthenticated}><Dashboard /></RotaPrivada>} />
                <Route path="/alertas" element={<RotaPrivada isAuth={isAuthenticated}><Alertas /></RotaPrivada>} />
                <Route path="/perfil" element={<RotaPrivada isAuth={isAuthenticated}><Perfil /></RotaPrivada>} />

                {/* 🚫 FALLBACK: Se o usuário digitar uma URL que não existe, joga ele pro início */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;