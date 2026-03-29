import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Ícones Premium
import { ShieldCheck, Lock, LogIn, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

function Login({ onLogin }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAcesso = (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        if (!usuario || !senha) {
            setErro('Por favor, preencha todos os campos obrigatórios.');
            setLoading(false);
            return;
        }

        axios.post('https://lvcvetsusfull.onrender.com/api/login/', {
            username: usuario,
            password: senha
        })
        .then(response => {
            localStorage.setItem('lvcvetsus_token', response.data.token);
            localStorage.setItem('lvcvetsus_usuario', usuario);
            onLogin(); 
            navigate('/'); 
        })
        .catch(error => {
            console.error("Erro na autenticação:", error);
            setErro('Credenciais inválidas. Verifique seu usuário e senha.');
            setLoading(false);
        });
    };

    return (
        <div className="login-container d-flex justify-content-center align-items-center position-relative overflow-hidden min-vh-100">
            
            {/* CSS ISOLADO APENAS PARA O LOGIN */}
            <style>
                {`
                .login-container {
                    background: linear-gradient(-45deg, #0f172a, #1e293b, #0284c7, #38bdf8);
                    background-size: 400% 400%;
                    animation: gradientBG 15s ease infinite;
                }
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .esfera-blur {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                }
                .cartao-login {
                    z-index: 10;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .cartao-login:hover {
                    box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
                }
                .input-moderno {
                    background-color: #1e293b;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .input-moderno:focus-within {
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
                    border-color: rgba(56, 189, 248, 0.5);
                }
                .input-moderno input { background-color: transparent !important; color: white !important; }
                .input-moderno input::placeholder { color: #64748b; font-weight: 500; }
                .input-moderno input:focus { box-shadow: none; outline: none; }
                .btn-login {
                    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                    transition: all 0.3s;
                    border: none;
                }
                .btn-login:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.4);
                }
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .fade-in-down { animation: fadeInDown 0.3s ease-out; }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>

            {/* ESFERAS FLUTUANTES (Efeito Apple Glassmorphism) */}
            <div className="esfera-blur" style={{ top: '-10%', left: '-10%', width: '50vw', height: '50vw', maxWidth: '500px', maxHeight: '500px', background: 'rgba(56, 189, 248, 0.3)' }}></div>
            <div className="esfera-blur" style={{ bottom: '-10%', right: '-10%', width: '60vw', height: '60vw', maxWidth: '600px', maxHeight: '600px', background: 'rgba(2, 132, 199, 0.4)' }}></div>

            <div className="container px-4">
                <div className="card cartao-login rounded-4 overflow-hidden mx-auto bg-transparent border-0 d-flex flex-column flex-md-row" style={{ maxWidth: '950px' }}>
                    
                    {/* LADO ESQUERDO: Branding (Some no Mobile, fica só o formulário) */}
                    <div className="d-none d-md-flex flex-column justify-content-center align-items-center p-5 position-relative" style={{ flex: '1.2', backgroundColor: '#ffffff' }}>
                        {/* Padrão Geométrico (Grid) */}
                        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ opacity: 0.03, backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '20px 20px', zIndex: 0 }}></div>
                        
                        <div className="position-relative z-1 text-center d-flex flex-column align-items-center">
                            <img src="/logovetsus.jpg" alt="Logo LVCVETSUS" className="mb-4 shadow-sm rounded-4" style={{ width: '100%', maxWidth: '280px', objectFit: 'contain' }} />
                            <h4 className="fw-black mb-2 text-dark" style={{ letterSpacing: '-0.5px' }}>Plataforma Oficial</h4>
                            <p className="fw-semibold text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '85%' }}>
                                Sistema Integrado de Vigilância Epidemiológica para Leishmaniose Visceral Canina.
                            </p>
                        </div>
                        
                        <div className="mt-auto pt-4 w-100 text-center position-relative z-1">
                            <span className="badge rounded-pill px-4 py-2 border shadow-sm" style={{ backgroundColor: '#f8fafc', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800' }}>
                                <ShieldCheck size={14} className="me-1 mb-1 text-success"/> Governo Federal • SUS
                            </span>
                        </div>
                    </div>

                    {/* LADO DIREITO: Formulário Escuro */}
                    <div className="p-4 p-md-5 d-flex flex-column justify-content-center position-relative" style={{ flex: '1', backgroundColor: '#0f172a' }}>
                        
                        {/* Brilho interno do formulário */}
                        <div className="position-absolute rounded-circle pointer-events-none" style={{ top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(56, 189, 248, 0.1)', filter: 'blur(40px)', zIndex: 0 }}></div>

                        <div className="mb-4 mb-md-5 text-center text-md-start position-relative z-1">
                            {/* Logo no mobile (quando o lado branco some) */}
                            <img src="/logovetsus.jpg" alt="LVCVETSUS" className="d-md-none mb-4 rounded-3 shadow" style={{ width: '150px' }} />
                            
                            <h3 className="fw-black text-white mb-2" style={{ letterSpacing: '-0.5px' }}>Acesso Restrito</h3>
                            <p className="small fw-medium mb-0" style={{ color: '#94a3b8' }}>Insira suas credenciais para acessar o painel epidemiológico.</p>
                        </div>

                        {erro && (
                            <div className="alert bg-danger-subtle text-danger border-0 border-start border-4 border-danger small py-3 px-3 rounded-3 fw-bold shadow-sm position-relative z-1 fade-in-down d-flex align-items-center gap-2">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span>{erro}</span>
                            </div>
                        )}

                        <form onSubmit={handleAcesso} className="position-relative z-1">
                            
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-uppercase" style={{ color: '#cbd5e1', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Usuário ou Matrícula</label>
                                <div className="input-group input-moderno rounded-3 overflow-hidden shadow-sm">
                                    <span className="input-group-text border-0 text-info bg-transparent px-3"><ShieldCheck size={18} /></span>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 shadow-none px-0" 
                                        placeholder="ex: admin.leishvet" 
                                        value={usuario} 
                                        onChange={(e) => setUsuario(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label small fw-bold text-uppercase m-0" style={{ color: '#cbd5e1', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Senha</label>
                                    <a href="#" className="text-decoration-none transition-hover" style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '700' }}>Recuperar acesso</a>
                                </div>
                                <div className="input-group input-moderno rounded-3 overflow-hidden shadow-sm">
                                    <span className="input-group-text border-0 text-info bg-transparent px-3"><Lock size={18} /></span>
                                    <input 
                                        type={mostrarSenha ? "text" : "password"} 
                                        className="form-control border-0 shadow-none px-0" 
                                        placeholder="••••••••" 
                                        value={senha} 
                                        onChange={(e) => setSenha(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="input-group-text border-0 text-muted bg-transparent px-3 transition-hover" 
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {mostrarSenha ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn w-100 py-3 rounded-3 fw-black shadow-lg d-flex justify-content-center align-items-center gap-2 btn-login text-white text-uppercase" 
                                disabled={loading} 
                                style={{ fontSize: '0.9rem', letterSpacing: '1px' }}
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="spin-animation text-white" /> AUTENTICANDO...</>
                                ) : (
                                    <><LogIn size={20} /> ENTRAR NO SISTEMA</>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-5 pt-4 border-top position-relative z-1" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <p className="small fw-bold mb-1" style={{ color: '#64748b' }}>Criptografia de Ponta a Ponta <Lock size={12} className="mb-1 d-inline"/></p>
                            <p className="mb-0 fw-medium" style={{ fontSize: '0.65rem', color: '#475569' }}>Sistema 100% aderente à Lei Geral de Proteção de Dados (LGPD).</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;