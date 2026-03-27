import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- IMPORTAR AS TELAS AQUI ---
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

// --- O "GUARDA-COSTAS" DE ROTAS ---
// Se não estiver logado, ele chuta a pessoa de volta pro "/login"
const RotaPrivada = ({ children, isAuth }) => {
    return isAuth ? children : <Navigate to="/login" />;
};

function App() {
    // Estado para saber se o cara está logado
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Quando o App abre, ele verifica se já existe uma "chave" no navegador
    useEffect(() => {
        const token = localStorage.getItem('lvcvetsus_token');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoadingAuth(false);
    }, []);

    // Função ativada quando o usuário acerta a senha no Login.jsx
    const handleLogin = () => {
        localStorage.setItem('lvcvetsus_token', 'token_seguro_simulado'); // Salva a sessão
        setIsAuthenticated(true);
    };

    if (loadingAuth) return null; // Evita piscar a tela enquanto verifica o acesso

    return (
        <BrowserRouter>
            <Routes>
                {/* Rota Pública (Livre) */}
                <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
                
                {/* --- ROTAS PRIVADAS (Só entra se isAuthenticated for true) --- */}
                <Route path="/" element={<RotaPrivada isAuth={isAuthenticated}><Menu /></RotaPrivada>} />
                <Route path="/mapa" element={<RotaPrivada isAuth={isAuthenticated}><Mapa /></RotaPrivada>} />
                <Route path="/cadastro" element={<RotaPrivada isAuth={isAuthenticated}><Cadastro /></RotaPrivada>} />
                <Route path="/cadastro-pet" element={<RotaPrivada isAuth={isAuthenticated}><CadastroPet /></RotaPrivada>} />
                <Route path="/clinica" element={<RotaPrivada isAuth={isAuthenticated}><GestaoClinica /></RotaPrivada>} />
                <Route path="/dashboard" element={<RotaPrivada isAuth={isAuthenticated}><Dashboard /></RotaPrivada>} />
                <Route path="/consulta/:id" element={<ConsultaPublica />} />
                <Route path="/alertas" element={<RotaPrivada isAuth={isAuthenticated}><Alertas /></RotaPrivada>} />
                
                {/* AQUI ESTAVA O ERRO: AGORA USAMOS A SUA "RotaPrivada" */}
                <Route path="/perfil" element={<RotaPrivada isAuth={isAuthenticated}><Perfil /></RotaPrivada>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;