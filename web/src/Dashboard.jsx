import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartPie, FaDog, FaShieldAlt, FaExclamationCircle, FaPrint, FaClipboardList, FaChevronRight, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from './Layout';
import * as XLSX from 'xlsx';
import { FaFileExcel } from 'react-icons/fa';

function Dashboard() {
    const [pets, setPets] = useState([]);
    const [tutoresMap, setTutoresMap] = useState({}); // 🔥 NOVO: Memória para guardar os nomes dos tutores
    const [loading, setLoading] = useState(true);
    
    // Estados dos Filtros
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroSexo, setFiltroSexo] = useState('TODOS');
    
    const navigate = useNavigate();
    const componentRef = useRef();
    
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Boletim_Epidemiologico_LVCVETSUS_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
    });

    useEffect(() => {
        // 🔥 TRUQUE: Bater nas duas rotas ao mesmo tempo para cruzar ID com Nome
        Promise.all([
            axios.get('https://lvcvetsusfull.onrender.com/api/pets/'),
            axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
        ]).then(([resPets, resProps]) => {
            // Cria o dicionário de tutores
            const mapa = {};
            resProps.data.forEach(tutor => {
                mapa[tutor.id] = tutor.nome;
            });
            setTutoresMap(mapa);
            setPets(resPets.data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao buscar dados:", err);
            setLoading(false);
        });
    }, []);

    // --- 🧠 FUNIL DE DADOS: Aplica os filtros escolhidos ---
    const petsFiltrados = pets.filter(pet => {
        const matchStatus = filtroStatus === 'TODOS' || pet.status === filtroStatus;
        const matchSexo = filtroSexo === 'TODOS' || pet.sexo === filtroSexo;
        return matchStatus && matchSexo;
    });

    // Exportação Padrão SINAN com DADOS FILTRADOS e NOME DO TUTOR
    const exportarParaExcel = () => {
        if (petsFiltrados.length === 0) {
            alert("Nenhum dado corresponde a este filtro para exportar!");
            return;
        }

        const dadosReais = petsFiltrados.map(pet => {
            const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;
            const nomeTutor = tutoresMap[pet.proprietario] || 'Sem Tutor Cadastrado';

            return {
                "ID do Animal": pet.id,
                "Nome do Paciente": pet.nome.toUpperCase(),
                "Sexo": pet.sexo === 'M' ? 'Macho' : 'Fêmea',
                "Idade": `${pet.idade_anos}a ${pet.idade_meses}m`,
                "Tutor": nomeTutor, // 🔥 Agora puxa o NOME certinho na planilha!
                "Status LVC": pet.status,
                "Usa Coleira?": ultimaVisita && ultimaVisita.usa_coleira ? 'Sim' : 'Não',
                "Último DPP": ultimaVisita ? ultimaVisita.resultado_dpp : 'Não Realizado',
                "Último ELISA": ultimaVisita ? ultimaVisita.resultado_elisa : 'Não Realizado',
                "Data de Cadastro": new Date(pet.data_cadastro).toLocaleDateString('pt-BR')
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dadosReais);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes_Filtrados");

        XLSX.writeFile(workbook, "Relatorio_SINAN_OFICIAL.xlsx");
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f4f7f6' }}>
                    <div className="spinner-grow text-primary mb-3 shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <h5 className="text-primary fw-bolder mb-0" style={{ letterSpacing: '1px' }}>PROCESSANDO DADOS...</h5>
                </div>
            </Layout>
        );
    }

    // --- 🧠 INTELIGÊNCIA DE DADOS (AGORA UTILIZA APENAS petsFiltrados) ---
    const totalPets = petsFiltrados.length;
    const positivos = petsFiltrados.filter(p => p.status === 'POSITIVO').length;
    const negativos = petsFiltrados.filter(p => p.status === 'NEGATIVO').length;
    const suspeitos = petsFiltrados.filter(p => p.status === 'SUSPEITO');

    const comColeira = petsFiltrados.filter(p => p.visitas?.some(v => v.usa_coleira)).length;
    const vacinados1Dose = petsFiltrados.filter(p => p.tomou_dose_1).length;
    const vacinadosCompletos = petsFiltrados.filter(p => p.tomou_dose_3).length;

    let sEmagrecimento = 0, sAlopecia = 0, sDescamacao = 0, sOnicogrifose = 0, sFeridas = 0;
    petsFiltrados.forEach(pet => {
        pet.visitas?.forEach(v => {
            if (v.tem_emagrecimento) sEmagrecimento++;
            if (v.tem_alopecia) sAlopecia++;
            if (v.tem_descamacao) sDescamacao++;
            if (v.tem_onicogrifose) sOnicogrifose++;
            if (v.tem_feridas) sFeridas++;
        });
    });

    const COLORS = {
        positivo: '#ef4444', negativo: '#10b981', suspeito: '#f59e0b',
        primario: '#3b82f6', sintomas: '#8b5cf6', bgCard: '#ffffff',
        textoDark: '#0f172a', textoMuted: '#64748b'
    };

    const dataStatus = [
        { name: 'Positivos', value: positivos, color: COLORS.positivo },
        { name: 'Negativos', value: negativos, color: COLORS.negativo },
        { name: 'Suspeitos', value: suspeitos.length, color: COLORS.suspeito },
    ].filter(d => d.value > 0);

    const dataProtecao = [
        { name: '1ª Dose', Quantidade: vacinados1Dose },
        { name: 'Imunizados', Quantidade: vacinadosCompletos },
        { name: 'Uso Coleira', Quantidade: comColeira },
    ];

    const dataSintomas = [
        { name: 'Emagrecimento', Casos: sEmagrecimento },
        { name: 'Feridas', Casos: sFeridas },
        { name: 'Alopecia', Casos: sAlopecia },
        { name: 'Onicogrifose', Casos: sOnicogrifose },
        { name: 'Descamação', Casos: sDescamacao },
    ].sort((a, b) => b.Casos - a.Casos);

    return (
        <Layout>
            <style>
                {`
                @page { size: A4 portrait; margin: 15mm auto; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                    .print-reset-flex { display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
                    .print-col-3 { display: inline-block !important; width: 23% !important; margin: 0 1% 15px 1% !important; vertical-align: top; }
                    .print-col-6 { display: inline-block !important; width: 48% !important; margin: 0 1% 15px 1% !important; vertical-align: top; }
                    .print-col-12 { display: block !important; width: 98% !important; margin: 0 auto 20px auto !important; }
                    .card { break-inside: avoid !important; page-break-inside: avoid !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
                }
                `}
            </style>

            <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px' }}>
                <div className="container-fluid p-0 mx-auto" style={{ maxWidth: '1300px' }}>

                    {/* CABEÇALHO */}
                    <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
                        <div>
                            <h2 className="fw-black mb-1 text-dark" style={{ letterSpacing: '-1px' }}>Dashboard Epidemiológico</h2>
                            <p className="mb-0 fw-bold text-muted small">Monitoramento em Tempo Real - LVC</p>
                        </div>

                        <div className="d-flex gap-2">
                            <button onClick={exportarParaExcel} className="btn btn-success d-flex align-items-center gap-2 shadow-sm fw-bold rounded-pill px-4">
                                <FaFileExcel size={20} /> Exportar SINAN
                            </button>
                            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm fw-bold" onClick={handlePrint}>
                                <FaPrint /> Relatório Oficial PDF
                            </button>
                        </div>
                    </div>

                    {/* 🔥 BARRA DE FILTROS INTELIGENTES */}
                    <div className="row g-3 mb-4 d-print-none bg-white p-3 rounded-4 shadow-sm border border-light align-items-end mx-0">
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-bold text-muted small mb-1 d-flex align-items-center gap-2">
                                <FaFilter size={12}/> Filtrar por Status Sanitário
                            </label>
                            <select className="form-select border-0 bg-light fw-bold text-dark" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                <option value="TODOS">📍 Visão Geral (Todos)</option>
                                <option value="POSITIVO">🔴 Apenas Positivos</option>
                                <option value="NEGATIVO">🟢 Apenas Negativos</option>
                                <option value="SUSPEITO">🟡 Apenas Suspeitos</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-bold text-muted small mb-1">Sexo do Animal</label>
                            <select className="form-select border-0 bg-light fw-bold text-dark" value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
                                <option value="TODOS">🐕 Todos (M/F)</option>
                                <option value="M">Macho</option>
                                <option value="F">Fêmea</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <button 
                                className="btn btn-light w-100 fw-bold text-secondary border border-2"
                                onClick={() => { setFiltroStatus('TODOS'); setFiltroSexo('TODOS'); }}
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>

                    {/* --- ÁREA EXATA QUE VAI PARA O PDF --- */}
                    <div ref={componentRef} className="print-reset-flex" style={{ width: '100%' }}>

                        {/* HEADER EXCLUSIVO DO PDF */}
                        <div className="d-none d-print-block text-center border-bottom mb-4 pb-3">
                            <h3 className="fw-bold mb-1" style={{ color: COLORS.textoDark }}>LVCVETSUS</h3>
                            <p className="text-muted mb-1">Boletim Epidemiológico Consolidado - Vigilância em Saúde</p>
                            <p className="small text-muted mb-0">Data de Emissão: {new Date().toLocaleDateString()}</p>
                            {(filtroStatus !== 'TODOS' || filtroSexo !== 'TODOS') && (
                                <p className="small fw-bold text-primary mt-2 mb-0">
                                    * Relatório Filtrado (Status: {filtroStatus} | Sexo: {filtroSexo})
                                </p>
                            )}
                        </div>

                        {/* ROW 1: KPIs */}
                        <div className="row g-4 mb-4 print-reset-flex">
                            {[
                                { title: 'População Vigiada', value: totalPets, icon: <FaDog size={26} />, color: COLORS.primario, bg: '#eff6ff' },
                                { title: 'Casos Confirmados', value: positivos, icon: <FaExclamationCircle size={26} />, color: COLORS.positivo, bg: '#fef2f2' },
                                { title: 'Aguardando Exame', value: suspeitos.length, icon: <FaClipboardList size={26} />, color: COLORS.suspeito, bg: '#fffbeb' },
                                { title: 'Proteção Ativa', value: comColeira, icon: <FaShieldAlt size={26} />, color: COLORS.negativo, bg: '#ecfdf5' },
                            ].map((kpi, idx) => (
                                <div key={idx} className="col-md-6 col-lg-3 print-col-3">
                                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white hover-scale transition-all">
                                        <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-uppercase fw-bold mb-1 text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{kpi.title}</p>
                                                <h2 className="fw-black mb-0 text-dark">{kpi.value}</h2>
                                            </div>
                                            <div className="d-flex justify-content-center align-items-center rounded-circle shadow-sm" style={{ width: '55px', height: '55px', backgroundColor: kpi.bg, color: kpi.color }}>
                                                {kpi.icon}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ROW 2: GRÁFICOS E ALERTAS */}
                        <div className="row g-4 print-reset-flex">

                            {/* Bloco Esquerdo: Gráficos */}
                            <div className="col-lg-8 print-col-12 print-reset-flex">
                                <div className="row g-4 mb-4 print-reset-flex">

                                    {/* GRÁFICO 1: PIZZA */}
                                    <div className="col-md-6 print-col-6">
                                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                                            <div className="card-body p-4 text-center">
                                                <h6 className="fw-bold mb-4 text-dark text-start">Status Sanitário</h6>
                                                <div style={{ height: '240px', width: '100%' }}>
                                                    {totalPets > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={dataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={3} isAnimationActive={false}>
                                                                    {dataStatus.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '600', color: COLORS.textoMuted, paddingTop: '15px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold">Nenhum dado para este filtro</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRÁFICO 2: PROTEÇÃO */}
                                    <div className="col-md-6 print-col-6">
                                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                                            <div className="card-body p-4 text-center">
                                                <h6 className="fw-bold mb-4 text-dark text-start">Cobertura Preventiva</h6>
                                                <div style={{ height: '240px', width: '100%' }}>
                                                    {totalPets > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={dataProtecao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 12, fontWeight: 'bold' }} dy={10} />
                                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} />
                                                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                <Bar dataKey="Quantidade" fill={COLORS.primario} radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={false} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold">Nenhum dado para este filtro</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRÁFICO 3: SINTOMAS */}
                                <div className="card border-0 shadow-sm rounded-4 print-col-12 bg-white">
                                    <div className="card-body p-4">
                                        <h6 className="fw-bold mb-4 text-dark">Prevalência de Sinais Clínicos</h6>
                                        <div style={{ height: '260px', width: '100%' }}>
                                            {totalPets > 0 && dataSintomas[0]?.Casos > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={dataSintomas} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontWeight: 'bold' }} />
                                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 13, fontWeight: 'bold' }} width={120} />
                                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                        <Bar dataKey="Casos" fill={COLORS.sintomas} radius={[0, 6, 6, 0]} barSize={22} isAnimationActive={false} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold">Nenhum sintoma registrado nestes filtros</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bloco Direito: Alertas */}
                            <div className="col-lg-4 print-col-12">
                                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column bg-white overflow-hidden">

                                    <div className="card-header bg-white border-bottom p-4">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <h6 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                                                <FaExclamationCircle className="text-warning" /> Fila de Triagem
                                            </h6>
                                            <span className="badge bg-warning-subtle text-warning rounded-pill d-print-none">{suspeitos.length} Pendentes</span>
                                        </div>
                                        <p className="small text-muted m-0">Aguardando resultado de ELISA/DPP</p>
                                    </div>

                                    <div className="card-body p-0 overflow-auto bg-light" style={{ maxHeight: 'calc(100% - 80px)' }}>
                                        {suspeitos.length > 0 ? (
                                            <div className="list-group list-group-flush">
                                                {suspeitos.map((pet) => (
                                                    <div key={pet.id} className="list-group-item bg-transparent border-bottom p-4 transition-all hover-bg-white">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                                                    {pet.nome}
                                                                </h6>
                                                                {/* 🔥 AQUI MOSTRA O NOME DO TUTOR EM VEZ DO ID! */}
                                                                <p className="mb-0 small text-muted">Tutor: <span className="fw-bold">{tutoresMap[pet.proprietario] || 'N/A'}</span></p>
                                                            </div>
                                                            <button
                                                                className="btn btn-sm btn-white border shadow-sm text-primary rounded-circle p-2 d-print-none"
                                                                onClick={() => navigate('/clinica', { state: { selectedPetId: pet.id } })}
                                                                title="Abrir Prontuário"
                                                            >
                                                                <FaChevronRight />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-5 mt-4">
                                                <FaShieldAlt size={50} className="text-success mb-3 opacity-50" />
                                                <p className="fw-bold mb-0 text-dark">Fila Zerada</p>
                                                <p className="small text-muted">Nenhum cão aguardando exame nestes filtros.</p>
                                            </div>
                                        )}
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

export default Dashboard;