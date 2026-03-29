import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Ícones Premium
import { Dog, Plus, Search, Loader2, Syringe, AlertTriangle, Stethoscope, Edit3, UserPlus, MapPin, Phone, CheckCircle } from 'lucide-react';

// 🧩 COMPONENTE: Card de Estatística (Blindado)
const EstatisticaCard = ({ icon: Icon, bgIcon, colorIcon, badgeText, badgeBg, badgeTextCor, title, value, loading }) => (
    <div className="col-12 col-md-4">
        <div className="card-premium h-100 shadow-sm border-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="p-3 rounded-4 shadow-sm" style={{ background: bgIcon, color: colorIcon }}>
                    <Icon size={24} />
                </div>
                <span className={`badge ${badgeBg} ${badgeTextCor} rounded-pill px-3 py-2 fw-bold border`}>
                    {badgeText || '---'}
                </span>
            </div>
            <h1 className="fw-black mb-1 text-dark d-flex align-items-center gap-2">
                {loading ? <Loader2 className="spin-animation text-muted" size={32} /> : (value || 0)}
            </h1>
            <p className="text-muted small fw-bolder text-uppercase mb-0" style={{ letterSpacing: '1px' }}>{title}</p>
        </div>
    </div>
);

const Menu = () => {
    const navigate = useNavigate();
    const [proprietarios, setProprietarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalPets: 0, positivos: 0, tratamentos: 0 });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = () => {
        setLoading(true);
        axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
            .then(response => {
                // 🛡️ TRAVA 1: Garante que temos um array, independente de paginação ou erro 404
                const rawData = response?.data?.results || response?.data || [];
                const dadosTratados = Array.isArray(rawData) ? [...rawData].reverse() : [];
                
                // 🛡️ TRAVA 2: Processamento de Stats com checagem de nulidade (Evita crash no loop)
                let pCount = 0;
                let tCount = 0;
                let petsTotal = 0;

                dadosTratados.forEach(tutor => {
                    if (tutor && tutor.pets && Array.isArray(tutor.pets)) {
                        petsTotal += tutor.pets.length;
                        pCount += tutor.pets.filter(p => p?.status === 'POSITIVO').length;
                        tCount += tutor.pets.filter(p => p?.status === 'EM_TRATAMENTO').length;
                    }
                });

                setProprietarios(dadosTratados);
                setStats({ totalPets: petsTotal, positivos: pCount, tratamentos: tCount });
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro Crítico na API:", error);
                setProprietarios([]);
                setLoading(false);
            });
    };

    const irParaProntuario = (petId) => {
        if (petId) {
            navigate('/clinica', { state: { selectedPetId: petId } });
        } else {
            navigate('/clinica'); // Redirecionamento seguro para a página vazia
        }
    };

    const editarTutor = (tutor) => {
        if (tutor) navigate('/cadastro', { state: { tutorParaEditar: tutor } });
    };

    // 🛡️ TRAVA 3: Filtro blindado contra nomes/endereços nulos (Causa comum de erro ao digitar)
    const dadosFiltrados = proprietarios.filter(prop => {
        const nome = String(prop?.nome || "").toLowerCase();
        const endereco = String(prop?.endereco || "").toLowerCase();
        const busca = searchTerm.toLowerCase();
        return nome.includes(busca) || endereco.includes(busca);
    });

    return (
        <Layout>
            <div className="container-fluid p-0 mx-auto fade-in" style={{ maxWidth: '1300px', padding: '20px' }}>
                
                {/* HEADER OPERACIONAL COM BOTÕES ATUALIZADOS */}
                <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-5 gap-4">
                    <div>
                        <h2 className="fw-black m-0 text-dark" style={{ letterSpacing: '-1.5px' }}>Fila de Triagem</h2>
                        <p className="text-muted mt-1 fw-bold small text-uppercase" style={{ letterSpacing: '1px' }}>Vigilância Epidemiológica</p>
                    </div>
                    
                    <div className="d-flex flex-column flex-md-row gap-3 flex-wrap">
                        {/* Barra de Pesquisa */}
                        <div className="bg-white rounded-pill px-4 py-2 d-flex align-items-center shadow-sm border" style={{ minWidth: '300px', flexGrow: 1 }}>
                            <Search size={18} className="text-muted me-2" />
                            <input 
                                type="text" 
                                placeholder="Buscar por nome ou rua..." 
                                className="border-0 bg-transparent w-100 shadow-none fw-medium" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ outline: 'none' }}
                            />
                        </div>
                        
                        {/* 🚀 BOTÕES DE AÇÃO RÁPIDA (O que estava faltando) */}
                        <div className="d-flex gap-2 flex-wrap">
                            <button 
                                className="btn btn-success rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" 
                                onClick={() => irParaProntuario(null)}
                            >
                                <Stethoscope size={18} /> <span className="d-none d-sm-inline">Prontuários</span>
                            </button>
                            <button 
                                className="btn btn-outline-primary bg-white rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" 
                                onClick={() => navigate('/cadastro-pet')}
                            >
                                <Dog size={18} /> <span className="d-none d-sm-inline">Novo Pet</span>
                            </button>
                            <button 
                                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" 
                                onClick={() => navigate('/cadastro')}
                            >
                                <UserPlus size={18} /> <span className="d-none d-sm-inline">Novo Tutor</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="row g-4 mb-5">
                    <EstatisticaCard icon={Dog} bgIcon="#e0f2fe" colorIcon="#0284c7" badgeText={`${proprietarios.length} Tutores`} badgeBg="bg-primary-subtle" badgeTextCor="text-primary" title="Pets Vigiados" value={stats.totalPets} loading={loading} />
                    <EstatisticaCard icon={AlertTriangle} bgIcon="#fef3c7" colorIcon="#d97706" badgeText="Atenção" badgeBg="bg-warning-subtle" badgeTextCor="text-warning" title="Positivos LVC" value={stats.positivos} loading={loading} />
                    <EstatisticaCard icon={Syringe} bgIcon="#dcfce7" colorIcon="#16a34a" badgeText="Ativos" badgeBg="bg-success-subtle" badgeTextCor="text-success" title="Em Tratamento" value={stats.tratamentos} loading={loading} />
                </div>

                {/* TABELA DE REGISTROS */}
                <div className="card-premium p-0 overflow-hidden shadow-lg border-0 bg-white">
                    <div className="p-4 border-bottom">
                        <h5 className="fw-black m-0 text-dark">Últimos Cadastros</h5>
                    </div>
                    
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr className="text-muted small text-uppercase">
                                    <th className="ps-4 py-3">Tutor / Pacientes</th>
                                    <th>Localização</th>
                                    <th>Contato</th>
                                    <th className="pe-4 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-5"><Loader2 className="spin-animation text-primary" size={30}/></td></tr>
                                ) : dadosFiltrados.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-5 fw-bold text-muted opacity-50">NENHUM REGISTRO ENCONTRADO</td></tr>
                                ) : (
                                    dadosFiltrados.slice(0, 20).map((prop) => (
                                        prop && <tr key={prop.id} className="transition-hover">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center fw-black text-primary border" style={{ width: 42, height: 42 }}>
                                                        {String(prop?.nome || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{prop.nome || "Tutor sem nome"}</div>
                                                        <div className="d-flex gap-1 mt-1">
                                                            {(prop.pets || []).map(p => (
                                                                p && <span key={p.id} onClick={() => irParaProntuario(p.id)} className={`badge rounded-pill border cursor-pointer ${p.status === 'POSITIVO' ? 'bg-danger-subtle text-danger border-danger' : 'bg-light text-secondary border-light'}`} style={{ fontSize: '0.65rem' }}>
                                                                    <Dog size={10} className="me-1" />{p.nome}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted small fw-medium">{prop.endereco || "Endereço não cadastrado"}</td>
                                            <td><span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold">{prop.telefone || "---"}</span></td>
                                            <td className="pe-4 text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button className="btn btn-sm btn-light border text-secondary rounded-circle p-2" onClick={() => editarTutor(prop)} title="Editar"><Edit3 size={16} /></button>
                                                    <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold d-flex align-items-center gap-2" onClick={() => irParaProntuario(prop?.pets?.[0]?.id)}>
                                                        <CheckCircle size={14} /> <span className="d-none d-md-inline">Acessar</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`.fw-black { font-weight: 900; } .transition-hover:hover { background-color: #f8fafc; } .spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </Layout>
    );
};

export default Menu;