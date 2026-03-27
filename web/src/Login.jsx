import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

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
            setErro('Por favor, preencha todos os campos.');
            setLoading(false);
            return;
        }

        axios.post('https://lvcvetsusfull.onrender.com/api/login/', {
            username: usuario,
            password: senha
        })
        .then(response => {
            localStorage.setItem('lvcvetsus_token', response.data.token);
            // ---> ADICIONE ESTA LINHA AQUI! <---
            // Guarda o nome digitado para a Sidebar usar
            localStorage.setItem('lvcvetsus_usuario', usuario);
            onLogin(); 
            navigate('/'); 
        })
        .catch(error => {
            console.error("Erro na autenticação:", error);
            setErro('Credenciais inválidas. Verifique o usuário e a senha.');
            setLoading(false);
        });
    };

    return (
        <>
            {/* ESTILOS AVANÇADOS (Animações e Efeitos Glassmorphism) */}
            <style>
                {`
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .fundo-animado {
                    background: linear-gradient(-45deg, #0f172a, #1e293b, #0284c7, #38bdf8);
                    background-size: 400% 400%;
                    animation: gradientBG 15s ease infinite;
                    min-height: 100vh;
                    position: relative;
                    overflow: hidden;
                }
                .esfera-blur {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                }
                .cartao-login {
                    z-index: 10;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transform: translateY(0);
                    transition: all 0.3s ease;
                }
                .cartao-login:hover {
                    box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
                }
                .input-moderno:focus-within {
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.4) !important;
                    border-color: #38bdf8 !important;
                }
                `}
            </style>

            <div className="d-flex justify-content-center align-items-center fundo-animado">
                
                {/* DECORAÇÃO DE FUNDO (Esferas Flutuantes estilo Apple/SaaS) */}
                <div className="esfera-blur" style={{ top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'rgba(56, 189, 248, 0.4)' }}></div>
                <div className="esfera-blur" style={{ bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'rgba(2, 132, 199, 0.5)' }}></div>

                <div className="card cartao-login rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: '950px', display: 'flex', flexDirection: 'row' }}>
                    
                    {/* LADO ESQUERDO: Branding Fundo Branco Premium */}
                    <div className="d-none d-md-flex flex-column justify-content-center align-items-center p-5" style={{ flex: '1.2', backgroundColor: '#ffffff', position: 'relative' }}>
                        
                        {/* Padrão geométrico suave no fundo branco */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        <img 
                            src="/logovetsus.jpg" 
                            alt="Logo LVCVETSUS" 
                            style={{ 
                                width: '280px', 
                                objectFit: 'contain',
                                marginBottom: '25px',
                                zIndex: 1
                            }} 
                        />
                        
                        <h5 className="fw-bolder mb-2" style={{ color: '#0f172a', letterSpacing: '-0.5px', zIndex: 1 }}>Plataforma Oficial</h5>
                        <p className="text-center fw-medium mb-0" style={{ fontSize: '0.95rem', color: '#64748b', zIndex: 1, lineHeight: '1.6', maxWidth: '85%' }}>
                            Sistema Integrado de Vigilância Epidemiológica para Leishmaniose Visceral Canina.
                        </p>
                        
                        <div className="mt-auto pt-4 border-top w-100 text-center" style={{ zIndex: 1, borderColor: '#f1f5f9' }}>
                            <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#f1f5f9', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                Governo Federal • SUS
                            </span>
                        </div>
                    </div>

                    {/* LADO DIREITO: Formulário Fundo Escuro Moderno */}
                    <div className="p-5 d-flex flex-column justify-content-center" style={{ flex: '1', backgroundColor: '#0f172a', position: 'relative' }}>
                        
                        {/* Brilho sutil dentro do formulário */}
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(56, 189, 248, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }}></div>

                        <div className="mb-5 text-center text-md-start position-relative" style={{ zIndex: 1 }}>
                            <h3 className="fw-bolder text-white mb-2">Acesso Restrito</h3>
                            <p className="small" style={{ color: '#94a3b8' }}>Insira suas credenciais para gerenciar a inteligência epidemiológica.</p>
                        </div>

                        {erro && <div className="alert alert-danger small py-2 rounded-3 text-center fw-bold border-0 shadow-sm" style={{ zIndex: 1 }}>{erro}</div>}

                        <form onSubmit={handleAcesso} style={{ zIndex: 1 }}>
                            <div className="mb-4">
                                <label className="form-label small fw-bold" style={{ color: '#cbd5e1', letterSpacing: '0.5px' }}>Usuário ou Matrícula</label>
                                <div className="input-group input-moderno rounded-3 overflow-hidden" style={{ transition: 'all 0.2s' }}>
                                    <span className="input-group-text border-0 text-primary" style={{ backgroundColor: '#1e293b' }}><FaUserMd /></span>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 text-white shadow-none" 
                                        style={{ backgroundColor: '#1e293b' }}
                                        placeholder="ex: admin.leishvet" 
                                        value={usuario} 
                                        onChange={(e) => setUsuario(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="form-label small fw-bold d-flex justify-content-between align-items-center" style={{ color: '#cbd5e1', letterSpacing: '0.5px' }}>
                                    Senha
                                    <a href="#" className="text-decoration-none" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600' }}>Esqueceu a senha?</a>
                                </label>
                                <div className="input-group input-moderno rounded-3 overflow-hidden" style={{ transition: 'all 0.2s' }}>
                                    <span className="input-group-text border-0 text-primary" style={{ backgroundColor: '#1e293b' }}><FaLock /></span>
                                    <input 
                                        type={mostrarSenha ? "text" : "password"} 
                                        className="form-control border-0 text-white shadow-none" 
                                        style={{ backgroundColor: '#1e293b' }}
                                        placeholder="••••••••" 
                                        value={senha} 
                                        onChange={(e) => setSenha(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="input-group-text border-0 text-muted shadow-none" 
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        style={{ cursor: 'pointer', backgroundColor: '#1e293b' }}
                                    >
                                        {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn w-100 py-3 rounded-3 fw-bold shadow-lg d-flex justify-content-center align-items-center gap-2" 
                                disabled={loading} 
                                style={{ 
                                    backgroundColor: '#0284c7', 
                                    color: 'white', 
                                    border: 'none',
                                    transition: 'all 0.3s',
                                    backgroundImage: 'linear-gradient(to right, #0284c7, #2563eb)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {loading ? <div className="spinner-border spinner-border-sm text-white" role="status"></div> : <><FaSignInAlt size={18} /> Entrar no Sistema</>}
                            </button>
                        </form>

                        <div className="text-center mt-5 pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)', zIndex: 1 }}>
                            <p className="small fw-medium mb-1" style={{ color: '#64748b' }}>Criptografia de Ponta a Ponta 🔒</p>
                            <p className="mb-0" style={{ fontSize: '0.7rem', color: '#475569' }}>Em conformidade total com a Lei Geral de Proteção de Dados (LGPD).</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;