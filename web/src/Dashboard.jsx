import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from './Layout';
import * as XLSX from 'xlsx';

// Ícones Premium
import { PieChart as PieIcon, Dog, ShieldCheck, AlertCircle, Printer, ClipboardList, ChevronRight, Filter, FileSpreadsheet, Activity, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// 🧩 COMPONENTE: Cartão de Indicador (KPI)
const KpiCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white hover-scale transition-all print-card-kpi">
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
            <div>
                <p className="text-uppercase fw-bold mb-1 text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{title}</p>
                <h2 className="fw-black mb-0 text-dark">{value}</h2>
            </div>
            <div className="d-flex justify-content-center align-items-center rounded-circle shadow-sm" style={{ width: '55px', height: '55px', backgroundColor: bg, color: color }}>
                <Icon size={26} />
            </div>
        </div>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
function Dashboard() {
    const [pets, setPets] = useState([]);
    const [tutoresMap, setTutoresMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });
    
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroSexo, setFiltroSexo] = useState('TODOS');
    
    const navigate = useNavigate();
    const componentRef = useRef();
    
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Boletim_Epidemiologico_LVCVETSUS_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
    });

    const mostrarFeedback = (msg, type = 'success') => {
        setFeedback({ show: true, msg, type });
        setTimeout(() => setFeedback({ show: false, msg: '', type: '' }), 4000);
    };

    useEffect(() => {
        Promise.all([
            axios.get('https://lvcvetsusfull.onrender.com/api/pets/'),
            axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
        ]).then(([resPets, resProps]) => {
            const propsData = resProps.data.results || resProps.data;
            const petsData = resPets.data.results || resPets.data;

            const mapa = {};
            propsData.forEach(tutor => { mapa[tutor.id] = tutor.nome; });
            
            setTutoresMap(mapa);
            setPets(petsData);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao buscar dados:", err);
            setLoading(false);
        });
    }, []);

    // --- 🧠 FUNIL DE DADOS ---
    const petsFiltrados = pets.filter(pet => {
        const matchStatus = filtroStatus === 'TODOS' || pet.status === filtroStatus;
        const matchSexo = filtroSexo === 'TODOS' || pet.sexo === filtroSexo;
        return matchStatus && matchSexo;
    });

    // --- 📊 EXPORTAÇÃO SINAN ---
    const exportarParaExcel = () => {
        if (petsFiltrados.length === 0) {
            mostrarFeedback("Nenhum dado corresponde aos filtros atuais.", "warning");
            return;
        }

        const dadosReais = petsFiltrados.map(pet => {
            const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;
            return {
                "ID do Animal": pet.id,
                "Nome do Paciente": pet.nome.toUpperCase(),
                "Sexo": pet.sexo === 'M' ? 'Macho' : 'Fêmea',
                "Idade": `${pet.idade_anos}a ${pet.idade_meses}m`,
                "Tutor": tutoresMap[pet.proprietario] || 'Sem Tutor Cadastrado',
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
        XLSX.writeFile(workbook, `SINAN_LVC_${new Date().getTime()}.xlsx`);
        mostrarFeedback("Planilha gerada com sucesso!", "success");
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center fade-in" style={{ height: '80vh', backgroundColor: '#f4f7f6' }}>
                    <Loader2 size={48} className="text-primary mb-3 spin-animation" />
                    <h6 className="text-primary fw-bolder mb-0" style={{ letterSpacing: '1px' }}>PROCESSANDO INTELIGÊNCIA DE DADOS...</h6>
                </div>
                <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </Layout>
        );
    }

    // --- 🧠 INTELIGÊNCIA DE DADOS E GRÁFICOS ---
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

    const COLORS = { positivo: '#ef4444', negativo: '#10b981', suspeito: '#f59e0b', primario: '#3b82f6', sintomas: '#8b5cf6', textoMuted: '#64748b' };

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
            <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px 15px' }}>
                <div className="container-fluid p-0 mx-auto" style={{ maxWidth: '1300px' }}>

                    {/* CABEÇALHO */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 d-print-none fade-in">
                        <div>
                            <h2 className="fw-black mb-1 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-1px' }}>
                                <PieIcon className="text-primary"/> Dashboard Epidemiológico
                            </h2>
                            <p className="mb-0 fw-bold text-muted small">Monitoramento em Tempo Real - LVCVETSUS</p>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            <button onClick={exportarParaExcel} className="btn btn-success d-flex align-items-center gap-2 shadow-sm fw-bold rounded-pill px-4 transition-hover">
                                <FileSpreadsheet size={18} /> Exportar SINAN
                            </button>
                            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 rounded-pill shadow-sm fw-bold transition-hover" onClick={handlePrint}>
                                <Printer size={18} /> Relatório PDF
                            </button>
                        </div>
                    </div>

                    {/* Feedback Visual */}
                    {feedback.show && (
                        <div className={`alert alert-${feedback.type} border-0 shadow-sm rounded-4 d-flex align-items-center gap-2 fw-bold fade-in mb-4 d-print-none`}>
                            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {feedback.msg}
                        </div>
                    )}

                    {/* BARRA DE FILTROS */}
                    <div className="row g-3 mb-4 d-print-none bg-white p-3 rounded-4 shadow-sm border border-light align-items-end mx-0 fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-bold text-muted small mb-1 d-flex align-items-center gap-2">
                                <Filter size={14}/> Status Sanitário
                            </label>
                            <select className="form-select border-0 bg-light fw-bold text-dark shadow-none" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                <option value="TODOS">Visão Geral (Todos)</option>
                                <option value="POSITIVO">Apenas Positivos</option>
                                <option value="NEGATIVO">Apenas Negativos</option>
                                <option value="SUSPEITO">Apenas Suspeitos</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label fw-bold text-muted small mb-1">Sexo do Animal</label>
                            <select className="form-select border-0 bg-light fw-bold text-dark shadow-none" value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
                                <option value="TODOS">Todos (Machos e Fêmeas)</option>
                                <option value="M">Macho</option>
                                <option value="F">Fêmea</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <button className="btn btn-light w-100 fw-bold text-secondary border shadow-sm transition-hover" onClick={() => { setFiltroStatus('TODOS'); setFiltroSexo('TODOS'); }}>
                                Limpar Filtros
                            </button>
                        </div>
                    </div>

                    {/* --- ÁREA DO RELATÓRIO PDF --- */}
                    <div ref={componentRef} className="print-reset-flex fade-in" style={{ width: '100%', animationDelay: '0.2s' }}>

                        {/* HEADER EXCLUSIVO DO PDF */}
                        <div className="d-none d-print-block text-center border-bottom mb-4 pb-3">
                            <h3 className="fw-black mb-1">LVCVETSUS</h3>
                            <p className="text-muted mb-1 fw-bold">Boletim Epidemiológico Consolidado - Vigilância em Saúde</p>
                            <p className="small text-muted mb-0">Data de Emissão: {new Date().toLocaleDateString()}</p>
                            {(filtroStatus !== 'TODOS' || filtroSexo !== 'TODOS') && (
                                <p className="small fw-bold text-primary mt-2 mb-0">* Relatório Filtrado (Status: {filtroStatus} | Sexo: {filtroSexo})</p>
                            )}
                        </div>

                        {/* ROW 1: KPIs */}
                        <div className="row g-3 mb-4 print-reset-flex">
                            <div className="col-md-6 col-lg-3 print-col-3">
                                <KpiCard title="População Vigiada" value={totalPets} icon={Dog} color={COLORS.primario} bg="#eff6ff" />
                            </div>
                            <div className="col-md-6 col-lg-3 print-col-3">
                                <KpiCard title="Casos Confirmados" value={positivos} icon={AlertCircle} color={COLORS.positivo} bg="#fef2f2" />
                            </div>
                            <div className="col-md-6 col-lg-3 print-col-3">
                                <KpiCard title="Aguardando Exame" value={suspeitos.length} icon={ClipboardList} color={COLORS.suspeito} bg="#fffbeb" />
                            </div>
                            <div className="col-md-6 col-lg-3 print-col-3">
                                <KpiCard title="Proteção Ativa" value={comColeira} icon={ShieldCheck} color={COLORS.negativo} bg="#ecfdf5" />
                            </div>
                        </div>

                        {/* ROW 2: GRÁFICOS E ALERTAS */}
                        <div className="row g-4 print-reset-flex">
                            
                            {/* BLOCO ESQUERDO: GRÁFICOS */}
                            <div className="col-lg-8 print-col-12 print-reset-flex">
                                <div className="row g-3 mb-3 print-reset-flex">
                                    {/* GRÁFICO 1: PIZZA */}
                                    <div className="col-md-6 print-col-6">
                                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white print-card">
                                            <div className="card-body p-4">
                                                <h6 className="fw-bold mb-4 text-dark text-center text-md-start">Status Sanitário Global</h6>
                                                <div style={{ height: '220px', width: '100%' }}>
                                                    {totalPets > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={dataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} isAnimationActive={false}>
                                                                    {dataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: COLORS.textoMuted, paddingTop: '10px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold small">Nenhum dado</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRÁFICO 2: PROTEÇÃO */}
                                    <div className="col-md-6 print-col-6">
                                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white print-card">
                                            <div className="card-body p-4">
                                                <h6 className="fw-bold mb-4 text-dark text-center text-md-start">Cobertura Preventiva</h6>
                                                <div style={{ height: '220px', width: '100%' }}>
                                                    {totalPets > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={dataProtecao} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 11, fontWeight: 'bold' }} allowDecimals={false} />
                                                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                <Bar dataKey="Quantidade" fill={COLORS.primario} radius={[6, 6, 0, 0]} barSize={35} isAnimationActive={false} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold small">Nenhum dado</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRÁFICO 3: SINTOMAS */}
                                <div className="card border-0 shadow-sm rounded-4 print-col-12 bg-white print-card">
                                    <div className="card-body p-4">
                                        <h6 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                                            <Activity size={18} className="text-secondary"/> Prevalência de Sinais Clínicos
                                        </h6>
                                        <div style={{ height: '260px', width: '100%' }}>
                                            {totalPets > 0 && dataSintomas[0]?.Casos > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={dataSintomas} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontWeight: 'bold', fontSize: 11 }} />
                                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.textoMuted, fontSize: 12, fontWeight: 'bold' }} width={110} />
                                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                        <Bar dataKey="Casos" fill={COLORS.sintomas} radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : <div className="d-flex h-100 align-items-center justify-content-center text-muted fw-bold">Nenhum sintoma registrado nestes filtros</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCO DIREITO: ALERTAS / TRIAGEM */}
                            <div className="col-lg-4 print-col-12 d-print-none">
                                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column bg-white overflow-hidden">
                                    <div className="card-header bg-white border-bottom p-4">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <h6 className="fw-bolder m-0 text-dark d-flex align-items-center gap-2">
                                                <AlertCircle className="text-warning" size={20} /> Fila de Triagem
                                            </h6>
                                            <span className="badge bg-warning-subtle text-warning border border-warning rounded-pill">
                                                {suspeitos.length} Pendentes
                                            </span>
                                        </div>
                                        <p className="small text-muted m-0 fw-medium">Aguardando resultado de ELISA/DPP</p>
                                    </div>

                                    <div className="card-body p-0 overflow-auto bg-light" style={{ maxHeight: 'calc(100% - 80px)', minHeight: '400px' }}>
                                        {suspeitos.length > 0 ? (
                                            <div className="list-group list-group-flush">
                                                {suspeitos.map((pet) => (
                                                    <div key={pet.id} className="list-group-item bg-transparent border-bottom p-4 transition-hover hover-bg-white">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <h6 className="fw-bolder mb-1 text-dark">{pet.nome.toUpperCase()}</h6>
                                                                <p className="mb-0 small text-muted">Tutor: <span className="fw-bold text-dark">{tutoresMap[pet.proprietario] || 'N/A'}</span></p>
                                                            </div>
                                                            <button
                                                                className="btn btn-white shadow-sm border text-primary rounded-circle p-2"
                                                                onClick={() => navigate('/clinica', { state: { selectedPetId: pet.id } })}
                                                                title="Abrir Prontuário"
                                                            >
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="d-flex flex-column justify-content-center align-items-center text-center p-5 h-100">
                                                <ShieldCheck size={48} className="text-success mb-3 opacity-50" />
                                                <p className="fw-bolder mb-0 text-dark">Fila Zerada</p>
                                                <p className="small text-muted">Nenhum cão aguardando exame.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-scale:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1)!important; }
                .transition-hover:hover { opacity: 0.85; transform: scale(1.02); }
                .hover-bg-white:hover { background-color: white !important; cursor: pointer; }
                .fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* REGRAS ESTRITAS DE IMPRESSÃO (PDF SINAN) */
                @page { size: A4 portrait; margin: 15mm auto; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                    .print-reset-flex { display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
                    .print-col-3 { display: inline-block !important; width: 23% !important; margin: 0 1% 15px 1% !important; vertical-align: top; }
                    .print-col-6 { display: inline-block !important; width: 48% !important; margin: 0 1% 15px 1% !important; vertical-align: top; }
                    .print-col-12 { display: block !important; width: 98% !important; margin: 0 auto 20px auto !important; }
                    .print-card, .print-card-kpi { break-inside: avoid !important; page-break-inside: avoid !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
                }
                `}
            </style>
        </Layout>
    );
}

export default Dashboard;