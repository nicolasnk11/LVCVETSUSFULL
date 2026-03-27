import React, { useState } from 'react';
import Layout from './Layout';
import { FaUserMd, FaIdBadge, FaTrophy, FaHistory, FaCheckCircle, FaMapMarkerAlt, FaEnvelope, FaPhone, FaShieldAlt, FaChartLine, FaDog } from 'react-icons/fa';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Perfil() {
    // 🧠 MOCK DE DADOS DO USUÁRIO
    const [usuario] = useState({
        nome: localStorage.getItem('lvcvetsus_usuario') || 'Nicolas Castro',
        cargo: 'Médico Veterinário Epidemiologista',
        registro: 'CRMV-CE 54321',
        email: 'nicolas.castro@saude.ce.gov.br',
        telefone: '(85) 99999-0000',
        zonaAtuacao: 'Distrito Sanitário III (Pici / Parquelândia)',
        dataEntrada: '12 de Janeiro de 2025',
        kpis: {
            animaisMonitorados: 142,
            casosDetectados: 18,
            taxaProtecao: 68 
        }
    });

    const produtividadeMeses = [
        { mes: 'Out', visitas: 25 },
        { mes: 'Nov', visitas: 38 },
        { mes: 'Dez', visitas: 45 },
        { mes: 'Jan', visitas: 30 },
        { mes: 'Fev', visitas: 52 },
        { mes: 'Mar', visitas: 22 }
    ];

    const ultimasAcoes = [
        { id: 1, acao: 'Registrou inquérito Censitário', alvo: 'Cão Rex', data: 'Hoje, 09:41', tipo: 'inquerito' },
        { id: 2, acao: 'Atualizou Status para POSITIVO', alvo: 'Cão Vozão', data: 'Ontem, 16:30', tipo: 'alerta' },
        { id: 3, acao: 'Prescreveu Milteforan', alvo: 'Cão Vozão', data: 'Ontem, 16:35', tipo: 'tratamento' },
        { id: 4, acao: 'Cadastrou novo paciente', alvo: 'Cão Caramelo', data: '05 Mar, 10:15', tipo: 'cadastro' }
    ];

    return (
        <Layout>
            <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px' }}>
                <div className="container-fluid p-0 mx-auto" style={{ maxWidth: '1200px' }}>
                    
                    <div className="d-flex justify-content-between align-items-end mb-4">
                        <div>
                            <h2 className="fw-black mb-1 text-dark" style={{ letterSpacing: '-1px' }}>Portal do Servidor</h2>
                            <p className="mb-0 fw-bold text-muted small">Gestão de Identidade e Produtividade</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        
                        {/* COLUNA ESQUERDA: CRACHÁ E INFO BÁSICA */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                                <div className="bg-primary p-4 text-center position-relative" style={{ height: '120px' }}>
                                    <FaShieldAlt className="text-white opacity-25 position-absolute" size={80} style={{ top: '-10px', right: '-10px' }}/>
                                </div>
                                <div className="card-body text-center px-4 pb-4 pt-0">
                                    <div className="d-flex justify-content-center mb-3" style={{ marginTop: '-50px' }}>
                                        <div className="bg-white p-2 rounded-circle shadow-sm d-inline-block">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '90px', height: '90px', fontSize: '2rem' }}>
                                                <FaUserMd />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="fw-black mb-0 text-dark">{usuario.nome}</h4>
                                    <p className="text-primary fw-bold small mb-2">{usuario.cargo}</p>
                                    <span className="badge bg-light text-dark border rounded-pill px-3 py-2 mb-3 shadow-sm d-inline-flex align-items-center gap-2">
                                        <FaIdBadge className="text-muted"/> {usuario.registro}
                                    </span>
                                    
                                    <hr className="opacity-10 my-3" />
                                    
                                    <div className="text-start small text-muted lh-lg">
                                        <div className="d-flex align-items-center gap-2 text-truncate"><FaEnvelope className="text-primary"/> {usuario.email}</div>
                                        <div className="d-flex align-items-center gap-2 text-truncate"><FaPhone className="text-primary"/> {usuario.telefone}</div>
                                        <div className="d-flex align-items-center gap-2 text-truncate"><FaMapMarkerAlt className="text-primary"/> {usuario.zonaAtuacao}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><FaTrophy className="text-warning"/> Metas de Vigilância (Março)</h6>
                                
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between small fw-bold mb-1">
                                        <span className="text-muted">Inquéritos Realizados</span>
                                        <span className="text-primary">22 / 50</span>
                                    </div>
                                    <div className="progress rounded-pill" style={{ height: '8px' }}>
                                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: '44%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="d-flex justify-content-between small fw-bold mb-1">
                                        <span className="text-muted">Cobertura de Coleiras</span>
                                        <span className="text-success">{usuario.kpis.taxaProtecao}%</span>
                                    </div>
                                    <div className="progress rounded-pill" style={{ height: '8px' }}>
                                        <div className="progress-bar bg-success" role="progressbar" style={{ width: `${usuario.kpis.taxaProtecao}%` }}></div>
                                    </div>
                                    <small className="text-muted d-block mt-2" style={{ fontSize: '0.7rem' }}>* Meta do Ministério da Saúde: 80%</small>
                                </div>
                            </div>
                        </div>

                        {/* COLUNA DIREITA: KPIs E AUDITORIA */}
                        <div className="col-lg-8">
                            
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white h-100 position-relative overflow-hidden">
                                        <FaDog className="position-absolute opacity-25" size={100} style={{ right: '-20px', bottom: '-20px' }}/>
                                        <h6 className="fw-bold opacity-75 mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Animais Monitorados</h6>
                                        <h2 className="fw-black mb-0 display-5">{usuario.kpis.animaisMonitorados}</h2>
                                        <p className="small mb-0 mt-2 opacity-75">No seu território de atuação</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 border-start border-danger border-5">
                                        <h6 className="fw-bold text-muted mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Casos Positivos Detectados</h6>
                                        <h2 className="fw-black mb-0 display-5 text-dark">{usuario.kpis.casosDetectados}</h2>
                                        <p className="small text-danger fw-bold mb-0 mt-2 d-flex align-items-center gap-1"><FaCheckCircle/> Ação rápida salva vidas</p>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-12">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                        <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><FaChartLine className="text-primary"/> Seu Desempenho Histórico</h6>
                                        <div style={{ width: '100%', minHeight: '220px' }}>
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart data={produtividadeMeses} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}/>
                                                    <Bar dataKey="visitas" radius={[6, 6, 6, 6]} barSize={40}>
                                                        {produtividadeMeses.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === produtividadeMeses.length - 1 ? '#3b82f6' : '#cbd5e1'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                                        <div className="card-header bg-white border-bottom p-4">
                                            <h6 className="fw-bold m-0 text-dark d-flex align-items-center gap-2"><FaHistory className="text-primary"/> Registro de Atividades (Auditoria)</h6>
                                        </div>
                                        <div className="card-body p-0">
                                            <ul className="list-group list-group-flush">
                                                {ultimasAcoes.map((acao, index) => (
                                                    <li key={acao.id} className={`list-group-item p-4 border-bottom ${index % 2 === 0 ? 'bg-light' : 'bg-white'}`}>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <p className="fw-bold text-dark mb-1">{acao.acao}</p>
                                                                <small className="text-muted">Alvo: <span className="fw-bold">{acao.alvo}</span></small>
                                                            </div>
                                                            <div className="text-end">
                                                                <small className="d-block text-muted fw-bold mb-1">{acao.data}</small>
                                                                <span className={`badge rounded-pill ${acao.tipo === 'alerta' ? 'bg-danger-subtle text-danger' : acao.tipo === 'tratamento' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                                    Log Automático
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="card-footer bg-white border-top text-center p-3">
                                            <button className="btn btn-link text-decoration-none fw-bold small text-primary">Ver Relatório Completo de Auditoria</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Perfil;