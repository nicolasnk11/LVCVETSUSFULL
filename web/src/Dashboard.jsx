import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from './Layout';
import * as XLSX from 'xlsx';

// Ícones Premium
import { PieChart as PieIcon, Dog, ShieldCheck, AlertCircle, Printer, ClipboardList, ChevronRight, Filter, FileSpreadsheet, Activity, Loader2, CheckCircle, AlertTriangle, Search, TrendingUp, HeartPulse } from 'lucide-react';

// 🧩 COMPONENTE: Card KPI "Glass"
const KpiCard = React.memo(({ title, value, subValue, icon: Icon, color, bg }) => (
    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white hover-up transition-all print-card-kpi">
        <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 rounded-4 shadow-sm" style={{ backgroundColor: bg, color: color }}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {subValue && <span className="badge rounded-pill fw-bold" style={{ backgroundColor: bg, color: color, fontSize: '0.7rem' }}>{subValue}</span>}
            </div>
            <p className="text-uppercase fw-black mb-1 text-muted" style={{ fontSize: '0.6rem', letterSpacing: '1.2px' }}>{title}</p>
            <h2 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-1.5px', fontSize: '2.2rem' }}>{value}</h2>
        </div>
    </div>
));

function Dashboard() {
    const [pets, setPets] = useState([]);
    const [tutoresMap, setTutoresMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroSexo, setFiltroSexo] = useState('TODOS');
    
    const navigate = useNavigate();
    const componentRef = useRef();
    
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `BOLETIM_LVCVETSUS_${new Date().toLocaleDateString()}`,
    });

    useEffect(() => {
        Promise.all([
            axios.get('https://lvcvetsusfull.onrender.com/api/pets/'),
            axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
        ]).then(([resPets, resProps]) => {
            const propsData = resProps.data.results || resProps.data || [];
            const petsData = resPets.data.results || resPets.data || [];
            const mapa = {};
            propsData.forEach(t => mapa[t.id] = t.nome);
            setTutoresMap(mapa);
            setPets(petsData);
        }).catch(err => console.error(err)).finally(() => setLoading(false));
    }, []);

    // --- 🧠 MOTOR DE INTELIGÊNCIA DE DADOS ---
    const stats = useMemo(() => {
        const filtrados = pets.filter(p => {
            const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
            const matchSexo = filtroSexo === 'TODOS' || p.sexo === filtroSexo;
            const matchBusca = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (tutoresMap[p.proprietario] || "").toLowerCase().includes(searchTerm.toLowerCase());
            return matchStatus && matchSexo && matchBusca;
        });

        const totais = {
            total: filtrados.length,
            positivos: filtrados.filter(p => p.status === 'POSITIVO').length,
            suspeitos: filtrados.filter(p => p.status === 'SUSPEITO'),
            comColeira: filtrados.filter(p => p.visitas?.some(v => v.usa_coleira)).length,
            vacinadosD1: filtrados.filter(p => p.tomou_dose_1).length,
            vacinadosD2: filtrados.filter(p => p.tomou_dose_2).length,
            vacinadosD3: filtrados.filter(p => p.tomou_dose_3).length,
            prevalencia: filtrados.length > 0 ? ((filtrados.filter(p => p.status === 'POSITIVO').length / filtrados.length) * 100).toFixed(1) : 0,
            sintomas: [
                { name: 'Emagrecimento', value: 0 }, { name: 'Alopecia', value: 0 },
                { name: 'Feridas', value: 0 }, { name: 'Onicogrifose', value: 0 }
            ]
        };

        filtrados.forEach(p => {
            const v = p.visitas?.[p.visitas.length - 1];
            if (v) {
                if (v.tem_emagrecimento) totais.sintomas[0].value++;
                if (v.tem_alopecia) totais.sintomas[1].value++;
                if (v.tem_feridas) totais.sintomas[2].value++;
                if (v.tem_onicogrifose) totais.sintomas[3].value++;
            }
        });

        return { filtrados, totais };
    }, [pets, filtroStatus, filtroSexo, searchTerm, tutoresMap]);

    const exportarExcel = () => {
        const dados = stats.filtrados.map(p => ({
            "NOME PACIENTE": p.nome.toUpperCase(),
            "STATUS": p.status,
            "TUTOR": tutoresMap[p.proprietario] || 'N/A',
            "SEXO": p.sexo === 'M' ? 'MACHO' : 'FÊMEA',
            "DOSE 1": p.tomou_dose_1 ? 'SIM' : 'NÃO',
            "DOSE 3": p.tomou_dose_3 ? 'COMPLETO' : 'PENDENTE'
        }));
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RELATORIO_LVC");
        XLSX.writeFile(wb, "PLANILHA_SINAN_VETSUS.xlsx");
    };

    const COLORS = { pos: '#ef4444', neg: '#10b981', susp: '#f59e0b', pri: '#0ea5e9', sin: '#8b5cf6' };

    if (loading) return <Layout><div className="vh-100 d-flex flex-column justify-content-center align-items-center"><Loader2 size={50} className="text-primary spin-animation mb-3" /><h5 className="fw-black text-primary">COMPILANDO EPIDEMIOLOGIA...</h5></div></Layout>;

    return (
        <Layout>
            <div className="pb-5 bg-app-light min-vh-100">
                <div className="container-fluid p-4 mx-auto" style={{ maxWidth: '1400px' }}>

                    {/* 🚀 HEADER DE COMANDO */}
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-5 gap-3 d-print-none fade-in">
                        <div>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-bold mb-2">SISTEMA VIGILÂNCIA LVC</span>
                            <h1 className="fw-black m-0 text-dark d-flex align-items-center gap-3" style={{ fontSize: '2.5rem', letterSpacing: '-1.5px' }}>
                                <Activity size={40} className="text-primary" strokeWidth={3} /> Inteligência de Dados
                            </h1>
                        </div>
                        <div className="d-flex gap-2">
                            <button onClick={exportarExcel} className="btn btn-white border shadow-sm rounded-pill px-4 fw-bold text-success d-flex align-items-center gap-2 transition-hover">
                                <FileSpreadsheet size={18} /> Exportar Excel
                            </button>
                            <button className="btn btn-primary shadow-lg rounded-pill px-4 fw-black d-flex align-items-center gap-2 transition-hover py-3" onClick={handlePrint}>
                                <Printer size={20} strokeWidth={2.5}/> GERAR BOLETIM PDF
                            </button>
                        </div>
                    </div>

                    {/* 🔍 MULTI-FILTROS */}
                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-5 d-print-none fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <div className="bg-light p-2 rounded-3 px-3 d-flex align-items-center gap-2">
                                    <Search size={18} className="text-muted" />
                                    <input type="text" className="form-control border-0 bg-transparent shadow-none fw-bold" placeholder="Buscar pet ou tutor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select border-0 bg-light fw-bold" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                    <option value="TODOS">Todos os Status</option>
                                    <option value="POSITIVO">Positivos</option>
                                    <option value="SUSPEITO">Em Triagem</option>
                                    <option value="NEGATIVO">Negativos</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select border-0 bg-light fw-bold" value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
                                    <option value="TODOS">Todos os Sexos</option>
                                    <option value="M">Macho</option>
                                    <option value="F">Fêmea</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <button className="btn btn-dark w-100 rounded-3 fw-bold" onClick={() => { setFiltroStatus('TODOS'); setFiltroSexo('TODOS'); setSearchTerm(''); }}>LIMPAR</button>
                            </div>
                        </div>
                    </div>

                    {/* --- ÁREA DE IMPRESSÃO --- */}
                    <div ref={componentRef} className="print-wrapper">
                        
                        {/* HEADER PDF */}
                        <div className="d-none d-print-flex justify-content-between align-items-center mb-5 pb-4 border-bottom border-2">
                            <div>
                                <h1 className="fw-black m-0" style={{ fontSize: '2.2rem' }}>BOLETIM EPIDEMIOLÓGICO</h1>
                                <p className="text-primary fw-bold mb-0">LVCVETSUS - Controle de Zoonoses Territorial</p>
                            </div>
                            <div className="text-end">
                                <p className="m-0 fw-bold small text-muted">Vigilância Epidemiológica</p>
                                <p className="m-0 fw-black small">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="row g-4 mb-5">
                            <div className="col-6 col-lg-3"><KpiCard title="Cães Vigiados" value={stats.totais.total} subValue="Base Total" icon={Dog} color={COLORS.pri} bg="#e0f2fe" /></div>
                            <div className="col-6 col-lg-3"><KpiCard title="Positivos LVC+" value={stats.totais.positivos} subValue={`${stats.totais.prevalencia}% Prevalência`} icon={AlertCircle} color={COLORS.pos} bg="#fef2f2" /></div>
                            <div className="col-6 col-lg-3"><KpiCard title="Proteção Ativa" value={stats.totais.comColeira} subValue="Uso de Coleira" icon={ShieldCheck} color={COLORS.neg} bg="#ecfdf5" /></div>
                            <div className="col-6 col-lg-3"><KpiCard title="Doses Aplicadas" value={stats.totais.vacinadosD1} subValue="Protocolo Inciado" icon={HeartPulse} color={COLORS.sin} bg="#f5f3ff" /></div>
                        </div>

                        {/* GRÁFICOS */}
                        <div className="row g-4 mb-5">
                            {/* Funil de Vacinação */}
                            <div className="col-lg-7 print-col-7">
                                <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 border-print">
                                    <h5 className="fw-black text-dark mb-4 d-flex align-items-center gap-2"><TrendingUp size={20} className="text-primary"/> Funil de Cobertura Vacinal</h5>
                                    <div style={{ height: '320px' }}>
                                        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                            <BarChart data={[
                                                { name: '1ª Dose', Qtd: stats.totais.vacinadosD1 },
                                                { name: '2ª Dose', Qtd: stats.totais.vacinadosD2 },
                                                { name: 'Imunizado', Qtd: stats.totais.vacinadosD3 }
                                            ]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#64748b'}} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                                <Bar dataKey="Qtd" fill={COLORS.pri} radius={[8, 8, 0, 0]} barSize={50} label={{ position: 'top', fontWeight: '900' }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Distribuição por Status */}
                            <div className="col-lg-5 print-col-5">
                                <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 border-print text-center">
                                    <h5 className="fw-black text-dark mb-4">Status Sanitário Global</h5>
                                    <div style={{ height: '320px' }}>
                                        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                            <PieChart>
                                                <Pie 
                                                    data={[
                                                        { name: 'Positivos', value: stats.totais.positivos, color: COLORS.pos },
                                                        { name: 'Negativos', value: stats.totais.negativos, color: COLORS.neg },
                                                        { name: 'Em Triagem', value: stats.totais.suspeitos.length, color: COLORS.susp }
                                                    ].filter(d => d.value > 0)} 
                                                    cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={8} dataKey="value"
                                                >
                                                    <Cell fill={COLORS.pos} stroke="none" /><Cell fill={COLORS.neg} stroke="none" /><Cell fill={COLORS.susp} stroke="none" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SINAIS CLÍNICOS */}
                        <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-5 border-print">
                            <h5 className="fw-black text-dark mb-4 d-flex align-items-center gap-2"><AlertTriangle size={20} className="text-warning"/> Prevalência de Sinais Clínicos (Amostra Filtrada)</h5>
                            <div style={{ height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                    <BarChart data={stats.totais.sintomas} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fontSize: 12}} width={120} />
                                        <Bar dataKey="value" fill={COLORS.sin} radius={[0, 10, 10, 0]} barSize={20} label={{ position: 'right', fontWeight: 'bold' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ASSINATURA PDF */}
                        <div className="d-none d-print-block mt-5 pt-5">
                            <div className="d-flex justify-content-between">
                                <div className="text-center" style={{ width: '250px' }}>
                                    <div className="border-top border-dark pt-2 small fw-bold text-uppercase">Responsável Técnico</div>
                                    <div className="tiny text-muted">Assinatura / CRMV</div>
                                </div>
                                <div className="text-center" style={{ width: '250px' }}>
                                    <div className="border-top border-dark pt-2 small fw-bold text-uppercase">Data de Auditoria</div>
                                    <div className="tiny text-muted">Carimbo Oficial</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📋 FILA DE TRIAGEM INTERATIVA (Apenas Tela) */}
                    <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden d-print-none fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="fw-black m-0 text-dark d-flex align-items-center gap-2">
                                <ClipboardList size={22} className="text-warning" /> Pendências Laboratoriais (Fila DPP/ELISA)
                            </h5>
                            <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-black">{stats.totais.suspeitos.length} PENDENTES</span>
                        </div>
                        <div className="card-body p-0">
                            {stats.totais.suspeitos.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light"><tr className="small text-uppercase fw-black text-muted"><th className="ps-4 py-3">Paciente</th><th>Tutor</th><th className="text-end pe-4">Ação</th></tr></thead>
                                        <tbody>
                                            {stats.totais.suspeitos.map(pet => (
                                                <tr key={pet.id} className="transition-all">
                                                    <td className="ps-4 fw-bold text-dark">{pet.nome.toUpperCase()}</td>
                                                    <td className="text-muted fw-medium">{tutoresMap[pet.proprietario] || 'N/A'}</td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn btn-sm btn-light border-0 rounded-pill px-3 fw-bold text-primary transition-hover" onClick={() => navigate('/clinica', { state: { selectedPetId: pet.id } })}>Abrir Ficha <ChevronRight size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <div className="p-5 text-center text-muted fw-bold">Nenhum exame pendente nesta filtragem.</div>}
                        </div>
                    </div>

                </div>
            </div>

            <style>
                {`
                .fw-black { font-weight: 900; }
                .bg-app-light { background-color: #f8fafc; }
                .transition-all { transition: all 0.3s ease; }
                .hover-up:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
                .spin-animation { animation: spin 1.2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.6s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .tiny { font-size: 0.6rem; }
                
                @page { 
                    size: A4 portrait; 
                    margin: 20mm; 
                }
                
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; margin: 0; }
                    .print-wrapper { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    .print-card-kpi { border: 1.5px solid #edf2f7 !important; box-shadow: none !important; margin-bottom: 5px; }
                    .border-print { border: 1.5px solid #edf2f7 !important; box-shadow: none !important; }
                    .print-col-7 { width: 58% !important; display: inline-block !important; vertical-align: top; }
                    .print-col-5 { width: 40% !important; display: inline-block !important; vertical-align: top; margin-left: 2%; }
                }
                `}
            </style>
        </Layout>
    );
}

export default Dashboard;