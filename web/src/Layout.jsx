import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Ícones Premium
import { PieChart, ClipboardList, Bell, Map, PawPrint, User, LogOut, Menu, X, ShieldCheck } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Item de Navegação (Elimina repetição de código)
const NavLinkItem = ({ to, icon: Icon, label, badge, currentPath, onClick }) => {
    const isActive = currentPath === to;
    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 mb-2 text-decoration-none position-relative transition-all ${isActive ? 'active shadow-sm' : 'text-light opacity-75 hover-opacity-100'}`}
        >
            <Icon size={20} className={isActive ? 'text-white' : ''} /> 
            <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>{label}</span>
            
            {/* Badge de Alertas Inteligente */}
            {badge > 0 && (
                <span className="position-absolute top-50 end-0 translate-middle-y badge rounded-pill bg-danger me-3 shadow-sm pulse-animation" style={{ fontSize: '0.7rem' }}>
                    {badge}
                </span>
            )}
        </Link>
    );
};

// 🏥 COMPONENTE PRINCIPAL
const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [nomeUsuario, setNomeUsuario] = useState('Carregando...');
    const [alertCount, setAlertCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado do Menu Mobile

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem('lvcvetsus_usuario');
        setNomeUsuario(usuarioSalvo || 'Profissional de Saúde');
    }, []);

    // Busca alertas proativamente
    useEffect(() => {
        let isMounted = true; // Previne vazamento de memória

        axios.get('https://lvcvetsusfull.onrender.com/api/pets/')
            .then(res => {
                if (isMounted) {
                    const petsData = res.data.results || res.data;
                    setAlertCount(calcularAlertasAtivos(petsData));
                }
            })
            .catch(err => console.error("Erro ao sincronizar alertas na Sidebar:", err));

        return () => { isMounted = false; };
    }, [location.pathname]);

    const calcularAlertasAtivos = (petsData) => {
        const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
        const agora = new Date().getTime();
        let count = 0;

        petsData.forEach(pet => {
            const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;

            if (pet.status === 'SUSPEITO') {
                const idUnico = `exame-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
            }
            if (ultimaVisita && !ultimaVisita.usa_coleira && pet.status !== 'OBITO') {
                const idUnico = `coleira-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
            }
            if (pet.medicacoes && pet.medicacoes.length > 0) {
                pet.medicacoes.forEach(med => {
                    const idUnico = `med-${med.id}-pet-${pet.id}`;
                    if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
                });
            }
        });
        return count;
    };

    const handleLogout = () => {
        localStorage.removeItem('lvcvetsus_token'); 
        localStorage.removeItem('lvcvetsus_usuario'); 
        window.location.href = '/login'; 
    };

    const fecharMenuMobile = () => setIsMobileMenuOpen(false);

    return (
        <div className="d-flex flex-column flex-md-row min-vh-100 bg-light">
            
            {/* 📱 HEADER MOBILE (Só aparece em telas pequenas) */}
            <div className="d-md-none bg-white p-3 d-flex justify-content-between align-items-center shadow-sm sticky-top z-3">
                <div className="d-flex align-items-center gap-2">
                    <ShieldCheck className="text-primary" size={24} />
                    <h5 className="m-0 fw-black text-dark" style={{ letterSpacing: '-0.5px' }}>LVCVETSUS</h5>
                </div>
                <button className="btn btn-light border-0 shadow-none p-2" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={26} className="text-dark" />
                    {alertCount > 0 && <span className="position-absolute top-25 start-75 translate-middle p-1 bg-danger border border-light rounded-circle"></span>}
                </button>
            </div>

            {/* 🌑 OVERLAY MOBILE (Fundo escuro quando o menu abre) */}
            {isMobileMenuOpen && (
                <div className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 z-index-overlay fade-in" onClick={fecharMenuMobile}></div>
            )}

            {/* 🖥️ SIDEBAR PRINCIPAL */}
            <aside className={`sidebar d-flex flex-column shadow-lg transition-all z-index-sidebar ${isMobileMenuOpen ? 'mobile-open' : 'mobile-closed'}`}>
                
                {/* Botão Fechar Mobile */}
                <button className="d-md-none btn btn-link text-white position-absolute top-0 end-0 m-3 p-1" onClick={fecharMenuMobile}>
                    <X size={28} />
                </button>

                {/* LOGO OFICIAL */}
                <div className="mb-4 d-flex flex-column align-items-center text-center px-2">
                    <div className="bg-white p-2 rounded-4 shadow-sm w-100 d-flex justify-content-center align-items-center mb-3 transition-hover">
                        <img src="/logovetsus.jpg" alt="Logo LVCVETSUS" style={{ width: '100%', maxWidth: '140px', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                    <div className="border-top pt-3 w-100" style={{ borderColor: 'rgba(255,255,255,0.05)!important' }}>
                        <small style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                            Vigilância Epidemiológica
                        </small>
                    </div>
                </div>

                {/* NAVEGAÇÃO */}
                <nav className="flex-grow-1 overflow-auto custom-scrollbar pe-2">
                    <div className="nav-category">Visão Geral</div>
                    <NavLinkItem to="/dashboard" icon={PieChart} label="Dashboard" currentPath={location.pathname} onClick={fecharMenuMobile} />
                    <NavLinkItem to="/" icon={ClipboardList} label="Fila de Triagem" currentPath={location.pathname} onClick={fecharMenuMobile} />
                    <NavLinkItem to="/alertas" icon={Bell} label="Alertas Inteligentes" badge={alertCount} currentPath={location.pathname} onClick={fecharMenuMobile} />

                    <div className="nav-category mt-4">Epidemiologia</div>
                    <NavLinkItem to="/mapa" icon={Map} label="Mapa de Risco" currentPath={location.pathname} onClick={fecharMenuMobile} />
                    
                    <div className="nav-category mt-4">Gestão Clínica</div>
                    <NavLinkItem to="/clinica" icon={PawPrint} label="Prontuários Vet" currentPath={location.pathname} onClick={fecharMenuMobile} />
                </nav>

                {/* RODAPÉ: PERFIL E LOGOUT */}
                <div className="mt-auto pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)!important' }}>
                    <Link to="/perfil" onClick={fecharMenuMobile} className="d-flex align-items-center gap-3 mb-3 p-2 rounded-4 text-decoration-none transition-hover profile-card" 
                        style={{ background: location.pathname === '/perfil' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)', border: location.pathname === '/perfil' ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent' }}>
                        <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center text-white shadow-sm" style={{ width: 42, height: 42 }}>
                            <User size={20} />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p className="text-white m-0 fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>{nomeUsuario}</p>
                            <p className="m-0 d-flex align-items-center gap-1" style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Online
                            </p>
                        </div>
                    </Link>

                    <button onClick={handleLogout} className="btn w-100 d-flex justify-content-center align-items-center gap-2 fw-bold text-danger bg-danger-subtle border-0 rounded-4 py-2 transition-hover">
                        <LogOut size={18} /> Encerrar Sessão
                    </button>
                </div>
            </aside>

            {/* 📄 CONTEÚDO PRINCIPAL (As telas do sistema são injetadas aqui) */}
            <main className="main-content flex-grow-1 position-relative">
                {children}
            </main>

            <style>
                {`
                /* COMPORTAMENTO MOBILE DA SIDEBAR */
                .z-index-overlay { z-index: 1040; }
                .z-index-sidebar { z-index: 1050; }
                
                @media (max-width: 768px) {
                    .sidebar {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        width: 280px !important;
                        height: 100vh !important;
                        transform: translateX(-100%); /* Escondida por padrão */
                        background-color: #0f172a !important; /* Força fundo escuro no mobile */
                    }
                    .sidebar.mobile-open { transform: translateX(0); } /* Abre ao clicar */
                    .main-content { margin-left: 0 !important; padding-top: 20px !important; }
                }

                /* ESTÉTICA EXTRA */
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-2px); opacity: 1 !important; }
                .hover-opacity-100:hover { opacity: 1 !important; }
                .pulse-animation { animation: pulse 2s infinite; }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                /* Custom Scrollbar suave para o menu */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                `}
            </style>
        </div>
    );
};

export default Layout;