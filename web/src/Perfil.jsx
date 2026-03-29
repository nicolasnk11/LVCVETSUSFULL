import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
// Ícones Premium e Minimalistas
import { 
    UserCircle, BadgeCheck, Trophy, History, CheckCircle2, 
    MapPin, Mail, Phone, ShieldCheck, TrendingUp, 
    Dog, Loader2, Activity, Target, ExternalLink 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// 🧩 COMPONENTE: Linha de Auditoria (Blindado contra nomes nulos)
const AuditoriaItem = ({ acao, alvo, data, tipo, isLast }) => (
    <div className={`p-4 ${!isLast ? 'border-bottom' : ''} transition-hover`}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
                <p className="fw-bold text-dark mb-1">{acao || "Ação Registrada"}</p>
                <small className="text-muted d-flex align-items-center gap-1">
                    <Dog size={12} /> Alvo: <span className="fw-black text-secondary">{alvo || "Não especificado"}</span>
                </small>
            </div>
            <div className="text-end">
                <small className="d-block text-muted fw-bold mb-1">{data}</small>
                <span className={`badge rounded-pill border fw-bold ${
                    tipo === 'alerta' ? 'bg-danger-subtle text-danger border-danger' : 
                    tipo === 'tratamento' ? 'bg-success-subtle text-success border-success' : 
                    'bg-light text-secondary border-secondary'
                }`} style={{ fontSize: '0.6rem' }}>
                    LOG DO SERVIDOR
                </span>
            </div>
        </div>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
function Perfil() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ monitorados: 0, positivos: 0 });
    
    // Dados Profissionais
    const [usuario] = useState({
        nome: localStorage.getItem('lvcvetsus_usuario') || 'Nicolas Castro',
        cargo: 'Médico Veterinário Epidemiologista',
        registro: 'CRMV-CE 54321',
        email: 'vigilancia.lvc@fortaleza.ce.gov.br',
        telefone: '(85) 99999-0000',
        zonaAtuacao: 'Distrito Sanitário III (Fortaleza)',
    });

    useEffect(() => {
        // 🛡️ TRAVA DE SEGURANÇA: Blindagem contra erro de API e tela branca
        axios.get('https://lvcvetsusfull.onrender.com/api/pets/')
            .then(res => {
                // Se a API falhar ou vier vazia, garante que vira um array vazio
                const rawData = res?.data?.results || res?.data || [];
                const pets = Array.isArray(rawData) ? rawData : [];

                const positivosCount = pets.filter(p => p?.status === 'POSITIVO').length;
                
                setStats({
                    monitorados: pets.length,
                    positivos: positivosCount
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao sincronizar dados do perfil:", err);
                setStats({ monitorados: 0, positivos: 0 }); // Fallback seguro
                setLoading(false);
            });
    }, []);

    const produtividadeMeses = [
        { mes: 'Out', visitas: 25 }, { mes: 'Nov', visitas: 38 },
        { mes: 'Dez', visitas: 45 }, { mes: 'Jan', visitas: 30 },
        { mes: 'Fev', visitas: 52 }, { mes: 'Mar', visitas: 22 }
    ];

    const ultimasAcoes = [
        { id: 1, acao: 'Registrou inquérito Censitário', alvo: 'Cão Rex', data: 'Hoje, 09:41', tipo: 'inquerito' },
        { id: 2, acao: 'Atualizou Status para POSITIVO', alvo: 'Cão Vozão', data: 'Ontem, 16:30', tipo: 'alerta' },
        { id: 3, acao: 'Prescreveu Medicamentação', alvo: 'Cão Luna', data: 'Ontem, 16:35', tipo: 'tratamento' },
        { id: 4, acao: 'Cadastrou novo paciente', alvo: 'Cão Caramelo', data: '05 Mar, 10:15', tipo: 'cadastro' }
    ];

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '80vh' }}>
                    <Loader2 className="text-primary spin-animation mb-3" size={48} />
                    <h6 className="text-primary fw-black" style={{ letterSpacing: '1px' }}>VALIDANDO IDENTIDADE...</h6>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container-fluid p-3 p-md-5 fade-in" style={{ maxWidth: '1300px', margin: '0 auto' }}>
                
                <div className="mb-5 text-center text-md-start">
                    <h2 className="fw-black text-dark mb-1" style={{ letterSpacing: '-1.5px' }}>Portal do Servidor</h2>
                    <p className="text-muted fw-bold small text-uppercase" style={{ letterSpacing: '1px' }}>Vigilância e Controle de Zoonoses</p>
                </div>

                <div className="row g-4">
                    
                    {/* COLUNA 1: INFO PESSOAL */}
                    <div className="col-12 col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                            <div className="bg-primary p-4 position-relative" style={{ height: '100px' }}>
                                <ShieldCheck className="text-white opacity-20 position-absolute" size={120} style={{ top: '-15px', right: '-15px' }}/>
                            </div>
                            <div className="card-body text-center px-4 pb-5 pt-0">
                                <div className="d-flex justify-content-center mb-3" style={{ marginTop: '-50px' }}>
                                    <div className="bg-white p-2 rounded-circle shadow-sm">
                                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white shadow-inner" style={{ width: '90px', height: '90px' }}>
                                            <UserCircle size={55} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                                <h4 className="fw-black mb-1 text-dark text-uppercase">{usuario.nome}</h4>
                                <p className="text-primary fw-bold small mb-4">{usuario.cargo}</p>
                                
                                <div className="badge bg-light text-dark border rounded-pill px-4 py-2 mb-4 shadow-sm d-inline-flex align-items-center gap-2">
                                    <BadgeCheck size={16} className="text-primary"/> <span className="fw-black">{usuario.registro}</span>
                                </div>
                                
                                <div className="text-start p-3 bg-light rounded-4 border border-white">
                                    <div className="d-flex align-items-center gap-3 text-muted small mb-3 text-truncate"><Mail size={16} className="text-primary opacity-75"/> {usuario.email}</div>
                                    <div className="d-flex align-items-center gap-3 text-muted small mb-3"><Phone size={16} className="text-primary opacity-75"/> {usuario.telefone}</div>
                                    <div className="d-flex align-items-center gap-3 text-muted small text-truncate"><MapPin size={16} className="text-primary opacity-75"/> {usuario.zonaAtuacao}</div>
                                </div>
                            </div>
                        </div>

                        {/* METAS MENSAL */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h6 className="fw-black text-dark mb-4 d-flex align-items-center gap-2 text-uppercase small"><Target className="text-danger" size={18}/> Ciclo de Metas (Março)</h6>
                            
                            <div className="mb-4">
                                <div className="d-flex justify-content-between small fw-bold mb-2">
                                    <span className="text-muted">Inquéritos em Campo</span>
                                    <span className="text-primary">22 / 50</span>
                                </div>
                                <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-primary shadow-sm" style={{ width: '44%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="d-flex justify-content-between small fw-bold mb-2">
                                    <span className="text-muted">Cobertura de Proteção</span>
                                    <span className="text-success">72%</span>
                                </div>
                                <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-success shadow-sm" style={{ width: '72%' }}></div>
                                </div>
                                <small className="text-muted d-block mt-3 fst-italic" style={{ fontSize: '0.65rem' }}>* Alinhado às diretrizes federais do SUS</small>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: PERFORMANCE REAL DO BACK-END */}
                    <div className="col-12 col-lg-8">
                        
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white h-100 position-relative overflow-hidden transition-hover">
                                    <Dog className="position-absolute opacity-15" size={130} style={{ right: '-25px', bottom: '-25px' }}/>
                                    <h6 className="fw-bold opacity-75 mb-1 text-uppercase small" style={{ letterSpacing: '1px' }}>Pets Vigiados</h6>
                                    <h2 className="fw-black mb-0 display-4">{stats.monitorados}</h2>
                                    <p className="small mb-0 mt-2 opacity-75 fw-medium">Sincronizado com o Render</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 border-start border-danger border-5 transition-hover">
                                    <h6 className="fw-bold text-muted mb-1 text-uppercase small" style={{ letterSpacing: '1px' }}>Focos Detectados</h6>
                                    <h2 className="fw-black mb-0 display-4 text-dark">{stats.positivos}</h2>
                                    <p className="small text-danger fw-black mb-0 mt-2 d-flex align-items-center gap-1"><Activity size={14}/> Diagnósticos positivos para LVC</p>
                                </div>
                            </div>
                        </div>

                        {/* GRÁFICO DE PRODUTIVIDADE */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 transition-hover">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-black text-dark m-0 text-uppercase small d-flex align-items-center gap-2"><TrendingUp className="text-primary" size={18}/> Evolução Mensal</h6>
                                <span className="badge bg-light text-primary border border-primary-subtle rounded-pill">Últimos 6 Meses</span>
                            </div>
                            <div style={{ width: '100%', height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={produtividadeMeses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '800' }} dy={10} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}/>
                                        <Bar dataKey="visitas" radius={[6, 6, 0, 0]} barSize={40}>
                                            {produtividadeMeses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === produtividadeMeses.length - 1 ? '#0ea5e9' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* AUDITORIA */}
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                                <h6 className="fw-black m-0 text-dark d-flex align-items-center gap-2 text-uppercase small"><History className="text-primary" size={18}/> Atividades Recentes</h6>
                                <button className="btn btn-light btn-sm fw-black border rounded-pill px-3 shadow-sm d-flex align-items-center gap-2" style={{fontSize: '0.7rem'}}>
                                    VER AUDITORIA <ExternalLink size={12}/>
                                </button>
                            </div>
                            <div className="card-body p-0">
                                {ultimasAcoes.map((acao, index) => (
                                    <AuditoriaItem 
                                        key={acao.id} 
                                        {...acao} 
                                        isLast={index === ultimasAcoes.length - 1} 
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            <style>
                {`
                .fw-black { font-weight: 900; }
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-3px); box-shadow: 0 1rem 3rem rgba(0,0,0,.08)!important; }
                .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
                `}
            </style>
        </Layout>
    );
}

export default Perfil;