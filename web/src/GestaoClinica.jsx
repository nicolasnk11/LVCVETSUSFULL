import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom'; 
import { useReactToPrint } from 'react-to-print';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CarteirinhaDigital from './CarteirinhaDigital'; 

// Ícones Premium
import { Syringe, FileText, CheckCircle, AlertTriangle, Dog, Trash2, Edit3, Save, Camera, X, Search, Printer, Pill, Image as ImageIcon, IdCard, LineChart as ChartIcon, Stethoscope, BrainCircuit, ChevronLeft, Loader2, Check } from 'lucide-react';

// 🏥 COMPONENTE PRINCIPAL
function GestaoClinica() {
    const location = useLocation();
    const [pets, setPets] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [abaAtiva, setAbaAtiva] = useState('historico'); 
    const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });
  
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [editFoto, setEditFoto] = useState(null);
    const [editPreview, setEditPreview] = useState(null);

    const componentRef = useRef();
    const navTabsRef = useRef(null); // 🔥 NOVO: Referência para as abas rolarem com o mouse no PC

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: selectedPet ? `Prontuario_LVC_${selectedPet.nome}` : 'Prontuario_LVC',
    });

    const [formData, setFormData] = useState({
        data_visita: new Date().toISOString().split('T')[0], tipo_inquerito: 'CENSITARIO',
        tem_emagrecimento: false, tem_alopecia: false, tem_descamacao: false, tem_onicogrifose: false, tem_feridas: false,
        resultado_elisa: 'NAO_REALIZADO', resultado_dpp: 'NAO_REALIZADO', usa_coleira: false, vacinado: false
    });

    const [medFormData, setMedFormData] = useState({
        nome: '', data_inicio: new Date().toISOString().split('T')[0], dose: '', observacoes: ''
    });

    const [fotoUpload, setFotoUpload] = useState(null);
    const [fotoLegenda, setFotoLegenda] = useState('');
    const fotoInputRef = useRef(null);

    const [calcData, setCalcData] = useState({ cre: '', upc: '', sintomas: 'leves' });
    const [calcResultado, setCalcResultado] = useState(null);

    const mostrarFeedback = (msg, type = 'success') => {
        setFeedback({ show: true, msg, type });
        setTimeout(() => setFeedback({ show: false, msg: '', type: '' }), 4000);
    };

    // 🔥 NOVO: Função para rolar as abas com a roda do mouse no PC
    const handleTabsScroll = (e) => {
        if (navTabsRef.current) {
            e.preventDefault(); // Impede a página de rolar para baixo
            navTabsRef.current.scrollLeft += e.deltaY; // Move a barra de rolagem horizontal
        }
    };

    const handleCalcularEstadio = () => {
        const cre = parseFloat(calcData.cre) || 0;
        const upc = parseFloat(calcData.upc) || 0;
        let estagio = "I (Doença Leve)"; let cor = "success"; let conduta = "Monitorização. Alopurinol (se necessário).";
        
        if (cre > 1.4 || upc > 0.5) { estagio = "II (Doença Moderada)"; cor = "warning"; conduta = "Miltefosina + Alopurinol. Dieta renal se UPC alto."; }
        if (cre > 2.0 || upc > 1.0) { estagio = "III (Doença Grave)"; cor = "danger"; conduta = "Miltefosina + Alopurinol + Tratamento de Doença Renal Crônica (DRC)."; }
        if (cre > 5.0 || upc > 2.0) { estagio = "IV (Doença Muito Grave)"; cor = "dark"; conduta = "Prognóstico ruim. Tratamento de suporte intensivo ou eutanásia recomendada."; }
        
        setCalcResultado({ estagio, cor, conduta });
    };

    const getFotoUrl = (fotoPath) => {
        if (!fotoPath) return null;
        if (fotoPath.startsWith('http')) return fotoPath;
        return `https://lvcvetsusfull.onrender.com${fotoPath}`;
    };

    useEffect(() => { carregarPets(); }, []);

    useEffect(() => {
        if (location.state?.selectedPetId && pets.length > 0) {
            const petAlvo = pets.find(p => p.id === location.state.selectedPetId);
            if (petAlvo) {
                setSelectedPet(petAlvo);
                window.history.replaceState({}, document.title);
            }
        }
    }, [pets, location.state]);

    // 🛡️ Segurança adicionada no `.results`
    const carregarPets = () => {
        axios.get('https://lvcvetsusfull.onrender.com/api/pets/')
            .then(res => { 
                const rawData = res?.data?.results || res?.data || [];
                setPets(Array.isArray(rawData) ? rawData : []); 
                setLoading(false); 
            })
            .catch(err => { console.error(err); setLoading(false); });
    };

    const handleDeletePet = async () => {
        if (!selectedPet) return;
        if (!window.confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente o prontuário de ${selectedPet.nome}?`)) return;
        try {
            await axios.delete(`https://lvcvetsusfull.onrender.com/api/pets/${selectedPet.id}/`);
            mostrarFeedback("Prontuário excluído com sucesso.", "success");
            setSelectedPet(null); carregarPets();
        } catch (e) { mostrarFeedback("Erro ao excluir prontuário.", "danger"); }
    };

    const abrirModalEdicao = () => {
        setEditFormData({
            nome: selectedPet.nome || '', raca: selectedPet.raca || '', sexo: selectedPet.sexo || 'M',
            idade_anos: selectedPet.idade_anos || 0, idade_meses: selectedPet.idade_meses || 0,
            pelagem_tamanho: selectedPet.pelagem_tamanho || 'CURTO', pelagem_cor: selectedPet.pelagem_cor || '',
            status: selectedPet.status || 'SUSPEITO',
            tomou_dose_1: selectedPet.tomou_dose_1 || false, data_dose_1: selectedPet.data_dose_1 || '',
            tomou_dose_2: selectedPet.tomou_dose_2 || false, data_dose_2: selectedPet.data_dose_2 || '',
            tomou_dose_3: selectedPet.tomou_dose_3 || false, data_dose_3: selectedPet.data_dose_3 || ''
        });
        setEditFoto(null); setEditPreview(getFotoUrl(selectedPet.foto)); setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData({ ...editFormData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setEditFoto(file); setEditPreview(URL.createObjectURL(file)); }
    };

    const salvarEdicao = async () => {
        const data = new FormData();
        Object.keys(editFormData).forEach(key => {
            if (key.includes('data_dose')) {
                const doseNum = key.split('_')[2]; 
                if (editFormData[`tomou_dose_${doseNum}`]) data.append(key, editFormData[key]);
                else data.append(key, '');
            } else if (typeof editFormData[key] === 'boolean') {
                data.append(key, editFormData[key] ? 'True' : 'False');
            } else { data.append(key, editFormData[key]); }
        });
        if (editFoto) data.append('foto', editFoto);
        try {
            await axios.patch(`https://lvcvetsusfull.onrender.com/api/pets/${selectedPet.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowEditModal(false); 
            carregarPets();
            mostrarFeedback("Perfil atualizado com sucesso!", "success");
        } catch (error) { mostrarFeedback("Erro ao salvar alterações.", "danger"); }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleMedInputChange = (e) => {
        const { name, value } = e.target;
        setMedFormData({ ...medFormData, [name]: value });
    };
  
    const handleSubmitVisita = (e) => {
        e.preventDefault();
        axios.post('https://lvcvetsusfull.onrender.com/api/visitas/', { ...formData, pet: selectedPet.id })
            .then(async () => { 
                carregarPets(); setAbaAtiva('historico'); mostrarFeedback("Visita registrada com sucesso!", "success");
            }).catch(() => mostrarFeedback("Erro ao registrar visita.", "danger"));
    };

    const handleSubmitMedicacao = (e) => {
        e.preventDefault();
        axios.post('https://lvcvetsusfull.onrender.com/api/medicacoes/', { ...medFormData, pet: selectedPet.id })
            .then(async () => { 
                setMedFormData({nome: '', data_inicio: new Date().toISOString().split('T')[0], dose: '', observacoes: ''});
                carregarPets(); mostrarFeedback("Medicação prescrita com sucesso!", "success");
            }).catch(() => mostrarFeedback("Erro ao prescrever medicação.", "danger"));
    };

    const handleSalvarFotoEvolucao = async (e) => {
        e.preventDefault();
        if (!fotoUpload) return mostrarFeedback("Por favor, selecione uma imagem.", "warning");
        const data = new FormData();
        data.append('pet', selectedPet.id); data.append('foto', fotoUpload);
        if (fotoLegenda) data.append('legenda', fotoLegenda);

        try {
            await axios.post('https://lvcvetsusfull.onrender.com/api/fotos-evolucao/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setFotoUpload(null); setFotoLegenda(''); if (fotoInputRef.current) fotoInputRef.current.value = '';
            carregarPets(); mostrarFeedback("Imagem anexada à galeria!", "success");
        } catch (error) { mostrarFeedback("Erro ao enviar foto.", "danger"); }
    };

    // --- 🔥 IA PREDITIVA EXPLICÁVEL ---
    const calcularScoreRisco = (pet) => {
        if (!pet || (pet.status !== 'NEGATIVO' && pet.status !== 'SUSPEITO')) return null;
        let score = 10;
        let motivos = ["📍 Área endêmica de transmissão (Risco base: 10%)"];
        let recomendacoes = [];
        const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;

        if (!ultimaVisita || !ultimaVisita.usa_coleira) { score += 40; motivos.push("🚫 Ausência de coleira repelente (+40%)"); recomendacoes.push("Encoleiramento Imediato"); }
        if (!pet.tomou_dose_1 || !pet.tomou_dose_2 || !pet.tomou_dose_3) { score += 30; motivos.push("💉 Esquema vacinal primário incompleto (+30%)"); recomendacoes.push("Completar Esquema Vacinal"); }
        if (ultimaVisita && (ultimaVisita.tem_emagrecimento || ultimaVisita.tem_alopecia || ultimaVisita.tem_descamacao || ultimaVisita.tem_onicogrifose || ultimaVisita.tem_feridas)) {
            score += 20; motivos.push("⚠️ Apresenta sinais clínicos compatíveis (+20%)"); recomendacoes.push("Realizar Teste Rápido DPP");
        }
        if (recomendacoes.length === 0) recomendacoes.push("Manter monitoramento de rotina");

        let cor = score <= 30 ? 'success' : score <= 60 ? 'warning' : 'danger';
        return { score, motivos, recomendacoes: recomendacoes.join(" • "), cor };
    };

    const formatTexto = (t) => t ? t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "-";
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : "Pendente";
    const petsFiltrados = pets.filter(p => (p?.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()));

    const chartDataMock = [
        { data: 'Jan', peso: 15.2, creatinina: 1.1 }, { data: 'Fev', peso: 14.8, creatinina: 1.4 },
        { data: 'Mar', peso: 13.5, creatinina: 2.1 }, { data: 'Abr', peso: 14.1, creatinina: 1.7 }, { data: 'Mai', peso: 14.5, creatinina: 1.5 }
    ];

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center fade-in" style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Loader2 size={48} className="text-primary mb-3 spin-animation" />
                <h6 className="text-primary fw-bolder mb-0" style={{ letterSpacing: '1px' }}>SINCRONIZANDO PRONTUÁRIOS...</h6>
                <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column flex-md-row" style={{ height: '100vh', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
            
            {/* ESQUERDA - LISTA (Esconde no mobile se tiver pet selecionado) */}
            <div className={`bg-white border-end shadow-sm flex-column ${selectedPet ? 'd-none d-md-flex' : 'd-flex'}`} style={{ width: '100%', maxWidth: '380px', zIndex: 10 }}>
                <div className="p-4 border-bottom bg-white z-2">
                    <h5 className="m-0 text-primary fw-black mb-4 d-flex align-items-center gap-2" style={{ letterSpacing: '-0.5px' }}><Dog size={24}/> Pacientes</h5>
                    <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden border">
                        <span className="input-group-text bg-light border-0 text-muted px-3"><Search size={18}/></span>
                        <input type="text" className="form-control border-0 bg-light fs-6" placeholder="Buscar paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="list-group list-group-flush border-0 flex-grow-1" style={{overflowY: 'auto'}}>
                    {petsFiltrados.map(pet => (
                        <button key={pet.id} className={`list-group-item list-group-item-action py-3 px-4 border-bottom transition-hover ${selectedPet?.id === pet.id ? 'bg-primary-subtle border-start border-5 border-primary' : ''}`} onClick={() => { setSelectedPet(pet); setCalcResultado(null); }}>
                            <div className="d-flex align-items-center">
                                <div className="me-3 flex-shrink-0">
                                    {pet.foto ? (
                                        <img src={getFotoUrl(pet.foto)} className="rounded-circle shadow-sm border border-2 border-white" style={{width:55, height:55, objectFit:'cover'}} alt={pet.nome} />
                                    ) : (
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm border" style={{width:55, height:55}}><Dog className="text-muted" size={24}/></div>
                                    )}
                                </div>
                                <div className="text-start flex-grow-1 text-truncate">
                                    <h6 className="mb-0 fw-bold text-dark text-truncate">{pet.nome}</h6>
                                    <small className="text-muted text-truncate">{pet.raca || 'SRD'}</small>
                                </div>
                                {pet.status === 'POSITIVO' && <span className="badge bg-danger shadow-sm rounded-pill ms-2" style={{fontSize: '0.65rem'}}>POSITIVO</span>}
                            </div>
                        </button>
                    ))}
                    {petsFiltrados.length === 0 && <div className="p-4 text-center text-muted small fw-bold">Nenhum paciente encontrado.</div>}
                </div>
            </div>

            {/* DIREITA - CONTEÚDO */}
            <div className={`flex-grow-1 position-relative ${!selectedPet ? 'd-none d-md-block' : 'd-block'}`} style={{ overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
                
                {/* Botão Voltar Mobile */}
                <div className="d-md-none bg-white p-3 border-bottom shadow-sm sticky-top z-3 d-flex align-items-center gap-3">
                    <button className="btn btn-light rounded-circle p-2 shadow-sm border d-flex align-items-center justify-content-center" onClick={() => setSelectedPet(null)}><ChevronLeft size={20}/></button>
                    <h6 className="m-0 fw-bold text-dark">Voltar aos Pacientes</h6>
                </div>

                {/* Feedback Toast */}
                {feedback.show && (
                    <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 w-100 px-3 fade-in" style={{maxWidth: '600px'}}>
                        <div className={`alert alert-${feedback.type} border-0 shadow rounded-4 d-flex align-items-center gap-2 fw-bold m-0`}>
                            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {feedback.msg}
                        </div>
                    </div>
                )}

                <div className="p-3 p-md-4 p-lg-5">
                    {!selectedPet ? (
                        <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted opacity-50" style={{minHeight: '70vh'}}>
                            <FileText size={80} className="mb-3"/>
                            <h4 className="fw-bold text-center">Selecione um paciente ao lado</h4>
                        </div>
                    ) : (
                        <div ref={componentRef} className="container bg-white rounded-4 shadow-sm p-4 p-md-5 border-0 fade-in" style={{maxWidth: '1000px', margin: '0 auto'}}>
                            
                            <div className="d-none d-print-block text-center border-bottom mb-4 pb-3">
                                <h3 className="fw-black mb-0">LVCVETSUS</h3>
                                <p className="text-muted mb-0 fw-bold">Sistema de Vigilância Epidemiológica - Prontuário Clínico</p>
                                <p className="small text-muted">Emitido em: {new Date().toLocaleString('pt-BR')}</p>
                            </div>

                            {/* Header do Prontuário */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-4">
                                <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4 text-center text-sm-start">
                                    <div className="position-relative flex-shrink-0">
                                        {selectedPet.foto ? 
                                            <img src={getFotoUrl(selectedPet.foto)} className="rounded-circle shadow border border-3 border-white" style={{width:110, height:110, objectFit:'cover'}} alt={selectedPet.nome} /> 
                                            : <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm border" style={{width:110, height:110}}><Dog size={50} className="text-muted"/></div>
                                        }
                                    </div>
                                    <div>
                                        <h2 className="fw-black mb-2 text-dark text-uppercase" style={{letterSpacing: '-1px'}}>{selectedPet.nome}</h2>
                                        <div className="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2 mt-1">
                                            <span className={`badge rounded-pill px-3 py-2 fw-bold border ${selectedPet.status === 'POSITIVO' ? 'bg-danger text-white border-danger' : selectedPet.status === 'NEGATIVO' ? 'bg-success text-white border-success' : 'bg-warning text-dark border-warning'}`}>
                                                {formatTexto(selectedPet.status)}
                                            </span>
                                            <span className="badge rounded-pill bg-light text-secondary border px-3 py-2 fw-medium">{selectedPet.raca || 'SRD'}</span>
                                            <span className="badge rounded-pill bg-light text-secondary border px-3 py-2 fw-medium">{selectedPet.idade_anos}a {selectedPet.idade_meses}m</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-print-none d-flex flex-wrap justify-content-center gap-2 w-100 w-md-auto mt-3 mt-md-0"> 
                                    <button className="btn btn-outline-dark shadow-sm fw-bold rounded-pill px-4 d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-md-grow-0" onClick={handlePrint}><Printer size={16}/> Imprimir</button>
                                    <button className="btn btn-light border shadow-sm rounded-circle p-3 text-secondary transition-hover" onClick={abrirModalEdicao} title="Editar Perfil"><Edit3 size={18} /></button>
                                    <button className="btn btn-light border shadow-sm rounded-circle p-3 text-danger transition-hover ms-1" onClick={handleDeletePet} title="Excluir Prontuário"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            {/* 🔥 ALERTA DE IA EXPLICÁVEL */}
                            {(() => {
                                const risco = calcularScoreRisco(selectedPet);
                                if (!risco) return null;
                                return (
                                    <div className={`alert bg-${risco.cor}-subtle border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 d-print-none transition-all`}>
                                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
                                            <h6 className={`fw-black mb-0 text-${risco.cor === 'warning' ? 'dark' : risco.cor} d-flex align-items-center gap-2 fs-5`}>
                                                <BrainCircuit size={28} /> IA Analítica: Risco Epidemiológico
                                            </h6>
                                            <span className={`badge bg-${risco.cor} fs-6 px-4 py-2 rounded-pill shadow-sm border border-${risco.cor}`}>{risco.score}% de Risco</span>
                                        </div>
                                        
                                        <div className="progress mb-4 bg-white shadow-sm border" style={{ height: '12px', borderRadius: '10px' }}>
                                            <div className={`progress-bar bg-${risco.cor} progress-bar-striped progress-bar-animated`} role="progressbar" style={{ width: `${risco.score}%` }}></div>
                                        </div>

                                        <div className="bg-white p-4 rounded-4 shadow-sm mb-3 border">
                                            <p className={`small fw-black mb-3 text-${risco.cor === 'warning' ? 'dark' : risco.cor} opacity-75 text-uppercase`} style={{ letterSpacing: '0.5px' }}>Fatores Detetados pela IA:</p>
                                            <ul className="mb-0 small text-dark fw-bold" style={{ listStyleType: 'none', paddingLeft: '0' }}>
                                                {risco.motivos.map((motivo, idx) => <li key={idx} className="mb-2 d-flex align-items-center gap-2"><Check size={14} className="text-muted flex-shrink-0"/> {motivo}</li>)}
                                            </ul>
                                        </div>

                                        <p className={`mb-0 small fw-bold text-${risco.cor === 'warning' ? 'dark' : risco.cor} bg-white p-3 rounded-3 shadow-sm border`}>
                                            <span className="text-uppercase me-2 opacity-75 fw-black">Ações Sugeridas:</span> {risco.recomendacoes}
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* PROTOCOLO VACINAL (Mini Cards) */}
                            <div className="bg-light p-4 rounded-4 mb-5 border border-light shadow-sm">
                                <h6 className="fw-bolder text-primary mb-3 d-flex align-items-center gap-2 text-uppercase small" style={{letterSpacing: '1px'}}><Syringe size={18}/> Protocolo Vacinal</h6>
                                <div className="row g-3">
                                    {[1, 2, 3].map(dose => (
                                        <div className="col-12 col-md-4" key={dose}>
                                            <div className={`p-3 rounded-4 shadow-sm text-center border-0 ${selectedPet[`tomou_dose_${dose}`] ? 'bg-success-subtle' : 'bg-white'}`}>
                                                <small className="text-muted d-block fw-bold mb-1">{dose}ª Dose {dose === 3 && "(Reforço)"}</small>
                                                {selectedPet[`tomou_dose_${dose}`] ? 
                                                    <span className="text-success fw-bold d-flex align-items-center justify-content-center gap-1"><CheckCircle size={16}/> {formatDate(selectedPet[`data_dose_${dose}`])}</span> 
                                                    : <span className="text-danger fw-bold d-flex align-items-center justify-content-center gap-1"><AlertTriangle size={16}/> Pendente</span>
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 🔥 NAVEGAÇÃO INTERNA (TABS COM SCROLL DO MOUSE NO PC) */}
                            <div className="nav-tabs-wrapper position-relative d-print-none mb-4 pb-2 border-bottom">
                                <ul 
                                    className="nav nav-pills gap-2 flex-nowrap overflow-auto custom-scrollbar-tabs" 
                                    ref={navTabsRef}
                                    onWheel={handleTabsScroll} // A mágica do mouse acontece aqui!
                                    style={{ whiteSpace: 'nowrap', paddingBottom: '10px' }}
                                >
                                    {[
                                        { id: 'historico', label: 'Histórico', icon: FileText },
                                        { id: 'medicacoes', label: 'Medicações', icon: Pill },
                                        { id: 'galeria', label: 'Galeria', icon: ImageIcon },
                                        { id: 'nova_visita', label: 'Nova Visita', icon: Syringe },
                                        { id: 'carteirinha', label: 'Carteirinha', icon: IdCard, style: 'bg-dark text-white' },
                                        { id: 'estadiamento', label: 'Monitorização', icon: Stethoscope, style: 'bg-primary text-white' }
                                    ].map(tab => (
                                        <li className="nav-item" key={tab.id}>
                                            <button 
                                                className={`nav-link rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 transition-hover border ${abaAtiva === tab.id ? (tab.style ? `${tab.style} border-dark shadow` : 'active border-primary shadow') : 'text-muted bg-light border-light'}`} 
                                                onClick={() => setAbaAtiva(tab.id)}
                                            >
                                                <tab.icon size={16} /> {tab.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* --- CONTEÚDO DAS ABAS --- */}

                            {/* ABA: HISTÓRICO */}
                            <div className={`${abaAtiva === 'historico' ? 'fade-in' : 'd-none'} d-print-block mt-4`}>
                                <h5 className="fw-black text-primary mb-4 d-flex align-items-center gap-2"><FileText /> Inquéritos Realizados</h5>
                                <div className="table-responsive rounded-4 shadow-sm border">
                                    <table className="table table-hover align-middle mb-0 bg-white">
                                        <thead className="table-light">
                                            <tr><th className="py-3 px-4 border-0 small text-uppercase">Data</th><th className="py-3 px-4 border-0 small text-uppercase">Inquérito</th><th className="py-3 px-4 border-0 small text-uppercase">Sintomas Clínicos</th><th className="py-3 px-4 border-0 small text-uppercase">DPP/ELISA</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedPet.visitas?.length > 0 ? selectedPet.visitas.map(v => (
                                                <tr key={v.id}>
                                                    <td className="fw-bold px-4 py-3 text-dark text-nowrap">{formatDate(v.data_visita)}</td>
                                                    <td className="px-4 py-3"><span className="badge bg-light text-dark rounded-pill border fw-medium">{formatTexto(v.tipo_inquerito)}</span></td>
                                                    <td className="px-4 py-3 text-muted small fw-medium" style={{ minWidth: '150px' }}>
                                                        {[v.tem_emagrecimento && "Emagrecimento", v.tem_alopecia && "Alopecia", v.tem_onicogrifose && "Onicogrifose", v.tem_feridas && "Feridas"].filter(Boolean).join(" • ") || "Assintomático"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`badge rounded-pill fw-bold border text-nowrap ${v.resultado_dpp === 'REAGENTE' ? 'bg-danger-subtle text-danger border-danger' : 'bg-success-subtle text-success border-success'}`}>
                                                            {v.resultado_dpp === 'REAGENTE' ? 'Positivo' : 'Negativo'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : <tr><td colSpan="4" className="text-center py-5 text-muted fw-bold">Nenhum inquérito registrado.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ABA: MEDICAÇÕES */}
                            <div className={`${abaAtiva === 'medicacoes' ? 'fade-in' : 'd-none'} d-print-block mt-4`}>
                                <h5 className="fw-black text-success mb-4 d-flex align-items-center gap-2"><Pill /> Plano Terapêutico Ativo</h5>
                                
                                <form onSubmit={handleSubmitMedicacao} className="mb-5 p-4 bg-light border rounded-4 shadow-sm d-print-none">
                                    <h6 className="fw-bold text-dark mb-3 text-uppercase small" style={{letterSpacing:'1px'}}>Nova Prescrição</h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-5"><input type="text" className="form-control border-0 shadow-sm py-2" name="nome" placeholder="Medicamento / Coleira..." value={medFormData.nome} onChange={handleMedInputChange} required/></div>
                                        <div className="col-6 col-md-3"><input type="date" className="form-control border-0 shadow-sm py-2" name="data_inicio" value={medFormData.data_inicio} onChange={handleMedInputChange} required/></div>
                                        <div className="col-6 col-md-4"><input type="text" className="form-control border-0 shadow-sm py-2" name="dose" placeholder="Dose (ex: 2mg/kg)" value={medFormData.dose} onChange={handleMedInputChange}/></div>
                                        <div className="col-12 col-md-10"><input type="text" className="form-control border-0 shadow-sm py-2" name="observacoes" placeholder="Observações extras..." value={medFormData.observacoes} onChange={handleMedInputChange}/></div>
                                        <div className="col-12 col-md-2 d-flex align-items-end"><button type="submit" className="btn btn-success w-100 fw-bold shadow-sm rounded-3 py-2">Salvar</button></div>
                                    </div>
                                </form>

                                <div className="table-responsive rounded-4 shadow-sm border">
                                    <table className="table table-hover align-middle mb-0 bg-white">
                                        <thead className="table-light">
                                            <tr><th className="py-3 px-4 border-0 small text-uppercase">Início</th><th className="py-3 px-4 border-0 small text-uppercase">Medicamento</th><th className="py-3 px-4 border-0 small text-uppercase">Dose</th><th className="py-3 px-4 border-0 small text-uppercase">Observações</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedPet.medicacoes?.length > 0 ? selectedPet.medicacoes.map(m => (
                                                <tr key={m.id}>
                                                    <td className="px-4 py-3 fw-bold text-nowrap">{formatDate(m.data_inicio)}</td>
                                                    <td className="fw-black text-primary px-4 py-3">{m.nome.toUpperCase()}</td>
                                                    <td className="px-4 py-3 fw-medium text-muted text-nowrap">{m.dose || '-'}</td>
                                                    <td className="px-4 py-3 small text-muted fw-medium" style={{ minWidth: '150px' }}>{m.observacoes || '-'}</td>
                                                </tr>
                                            )) : <tr><td colSpan="4" className="text-center py-5 text-muted fw-bold">Nenhum tratamento registrado.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ABA: GALERIA */}
                            <div className={`${abaAtiva === 'galeria' ? 'fade-in' : 'd-none'} d-print-block mt-4`} style={{ pageBreakInside: 'avoid' }}>
                                <h5 className="fw-black text-primary mb-4 d-flex align-items-center gap-2"><ImageIcon /> Acompanhamento Fotográfico</h5>

                                <form onSubmit={handleSalvarFotoEvolucao} className="mb-5 p-4 bg-light border rounded-4 shadow-sm d-print-none">
                                    <div className="row g-3 align-items-end">
                                        <div className="col-12 col-md-5">
                                            <label className="small fw-bold text-muted mb-1 text-uppercase" style={{letterSpacing:'0.5px'}}>Selecione a Imagem</label>
                                            <input type="file" className="form-control border-0 shadow-sm bg-white py-2" ref={fotoInputRef} accept="image/*" onChange={(e) => setFotoUpload(e.target.files[0])} />
                                        </div>
                                        <div className="col-12 col-md-5">
                                            <label className="small fw-bold text-muted mb-1 text-uppercase" style={{letterSpacing:'0.5px'}}>Legenda / Observação</label>
                                            <input type="text" className="form-control border-0 shadow-sm py-2" placeholder="Ex: Início do tratamento..." value={fotoLegenda} onChange={(e) => setFotoLegenda(e.target.value)} />
                                        </div>
                                        <div className="col-12 col-md-2">
                                            <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm rounded-3 py-2 d-flex justify-content-center align-items-center gap-2"><Camera size={18}/> Anexar</button>
                                        </div>
                                    </div>
                                </form>

                                <div className="row g-4">
                                    {selectedPet.galeria?.length > 0 ? selectedPet.galeria.map(img => (
                                        <div key={img.id} className="col-12 col-sm-6 col-lg-4" style={{ pageBreakInside: 'avoid' }}>
                                            <div className="card shadow-sm border rounded-4 overflow-hidden h-100 bg-white">
                                                <div style={{ height: '220px', backgroundColor: '#f1f5f9' }}>
                                                    <img src={getFotoUrl(img.foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Evolução" onError={(e) => e.target.style.display='none'} />
                                                </div>
                                                <div className="card-body p-3 text-center bg-white">
                                                    <small className="text-primary d-block fw-black mb-1 d-flex justify-content-center align-items-center gap-1"><FileText size={14}/> {formatDate(img.data_registro)}</small>
                                                    <p className="card-text small mb-0 text-muted fw-medium">{img.legenda || "Sem observações anexadas."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-12 d-print-none text-center py-5 bg-light rounded-4 border border-dashed text-muted">
                                            <ImageIcon size={48} className="mb-3 opacity-50"/>
                                            <p className="fw-bold mb-0">Nenhuma fotografia anexada.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Comparativo Visual */}
                                {selectedPet.galeria?.length >= 2 && (
                                    <div className="mt-5 p-3 p-md-5 border-0 rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc', pageBreakInside: 'avoid' }}>
                                        <h6 className="fw-black text-dark text-center mb-4 d-flex align-items-center justify-content-center gap-2 text-uppercase"><AlertTriangle className="text-warning"/> Comparativo de Evolução</h6>
                                        <div className="row g-4">
                                            <div className="col-12 col-md-6 text-center">
                                                <span className="badge bg-secondary mb-3 rounded-pill px-3 py-2 shadow-sm">Primeiro Registro</span>
                                                <div className="shadow border border-4 border-white rounded-4 overflow-hidden" style={{ height: '200px' }}>
                                                    <img src={getFotoUrl(selectedPet.galeria[0].foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Primeiro" />
                                                </div>
                                                <small className="d-block mt-3 text-muted fw-bold">{formatDate(selectedPet.galeria[0].data_registro)}</small>
                                            </div>
                                            <div className="col-12 col-md-6 text-center">
                                                <span className="badge bg-success mb-3 rounded-pill px-3 py-2 shadow-sm">Mais Recente</span>
                                                <div className="shadow border border-4 border-white rounded-4 overflow-hidden" style={{ height: '200px' }}>
                                                    <img src={getFotoUrl(selectedPet.galeria[selectedPet.galeria.length - 1].foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Recente" />
                                                </div>
                                                <small className="d-block mt-3 text-muted fw-bold">{formatDate(selectedPet.galeria[selectedPet.galeria.length - 1].data_registro)}</small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ABA: NOVA VISITA */}
                            <div className={`${abaAtiva === 'nova_visita' ? 'fade-in' : 'd-none'} d-print-none mt-4`}>
                                <h5 className="fw-black text-primary mb-4 d-flex align-items-center gap-2"><Syringe /> Registrar Monitoramento</h5>
                                <form onSubmit={handleSubmitVisita}>
                                    <div className="row g-4 mb-4">
                                         <div className="col-12 col-md-6">
                                             <label className="fw-bold small text-muted mb-1 text-uppercase">Data da Avaliação</label>
                                             <input type="date" className="form-control border-0 shadow-sm py-2 bg-light" name="data_visita" value={formData.data_visita} onChange={handleInputChange}/>
                                         </div>
                                         <div className="col-12 col-md-6">
                                             <label className="fw-bold small text-muted mb-1 text-uppercase">Tipo de Inquérito</label>
                                             <select className="form-select border-0 shadow-sm py-2 bg-light fw-medium" name="tipo_inquerito" value={formData.tipo_inquerito} onChange={handleInputChange}>
                                                 <option value="CENSITARIO">Censitário (Busca Ativa)</option>
                                                 <option value="AMOSTRAL">Amostral (Foco/Demanda)</option>
                                             </select>
                                         </div>
                                    </div>

                                    <div className="card mb-4 border-0 shadow-sm rounded-4 bg-light p-4 p-md-5">
                                        <h6 className="fw-black text-dark mb-4 text-uppercase">📋 Sinais Clínicos (Marque se presente)</h6>
                                        <div className="row g-3">
                                            {['tem_emagrecimento', 'tem_alopecia', 'tem_descamacao', 'tem_onicogrifose', 'tem_feridas'].map(sinal => (
                                                <div key={sinal} className="col-12 col-md-6 col-lg-4">
                                                    <div className="form-check form-switch p-3 bg-white rounded-4 shadow-sm border-0 d-flex align-items-center transition-hover">
                                                        <input className="form-check-input ms-0 me-3 mt-0 cursor-pointer" type="checkbox" name={sinal} checked={formData[sinal]} onChange={handleInputChange} style={{transform: 'scale(1.3)'}}/>
                                                        <label className="form-check-label fw-bold text-dark m-0 cursor-pointer">{formatTexto(sinal)}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-4">
                                        <div className="col-12 col-md-6">
                                            <label className="fw-bold small text-muted mb-1 text-uppercase">Resultado ELISA</label>
                                            <select className="form-select border-0 shadow-sm py-3 bg-light fw-bold" name="resultado_elisa" onChange={handleInputChange}>
                                                <option value="NAO_REALIZADO">Não Realizado</option>
                                                <option value="REAGENTE">🔴 Reagente (Positivo)</option>
                                                <option value="NAO_REAGENTE">🟢 Não Reagente (Negativo)</option>
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="fw-bold small text-muted mb-1 text-uppercase">Resultado DPP (Teste Rápido)</label>
                                            <select className="form-select border-0 shadow-sm py-3 bg-light fw-bold" name="resultado_dpp" onChange={handleInputChange}>
                                                <option value="NAO_REALIZADO">Não Realizado</option>
                                                <option value="REAGENTE">🔴 Reagente (Positivo)</option>
                                                <option value="NAO_REAGENTE">🟢 Não Reagente (Negativo)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-4 mb-5 border-0 shadow-sm transition-all ${formData.usa_coleira ? 'bg-success-subtle' : 'bg-warning-subtle'}`}>
                                        <div className="form-check form-switch d-flex align-items-center cursor-pointer">
                                            <input className="form-check-input ms-0 me-3 mt-0 cursor-pointer" type="checkbox" name="usa_coleira" checked={formData.usa_coleira} onChange={handleInputChange} style={{transform: 'scale(1.5)'}} />
                                            <label className={`form-check-label fw-black m-0 fs-5 ${formData.usa_coleira ? 'text-success' : 'text-dark'}`}>
                                                Usa Coleira Repelente no momento?
                                            </label>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary w-100 py-3 rounded-pill fw-black shadow-lg fs-5 d-flex justify-content-center align-items-center gap-2"><Save /> Salvar Prontuário</button>
                                </form>
                            </div>

                            {/* ABA: CARTEIRINHA */}
                            <div className={`${abaAtiva === 'carteirinha' ? 'fade-in' : 'd-none'} d-print-none mt-4`}>
                                <h5 className="fw-black text-dark mb-4 d-flex align-items-center justify-content-center gap-2"><IdCard className="text-primary"/> Credencial Oficial do Paciente</h5>
                                <CarteirinhaDigital pet={selectedPet} proprietario={selectedPet.proprietario} />
                            </div>

                            {/* ABA: ESTADIAMENTO / LEISHVET */}
                            <div className={`${abaAtiva === 'estadiamento' ? 'fade-in' : 'd-none'} d-print-block mt-4`}>
                                <h5 className="fw-black text-dark mb-4 d-flex align-items-center gap-2"><Stethoscope className="text-primary"/> Inteligência Clínica (LeishVet)</h5>

                                <div className="card border-0 shadow-sm mb-5 bg-white rounded-4 overflow-hidden">
                                    <div className="card-header text-white fw-bold p-3" style={{ backgroundColor: '#0f172a' }}><FileText size={18} className="me-2"/> Sistema de Apoio à Decisão</div>
                                    <div className="card-body p-4 p-md-5">
                                        <p className="small text-muted mb-4 fw-bold text-uppercase" style={{letterSpacing:'0.5px'}}>Insira os parâmetros laboratoriais recentes:</p>
                                        <div className="row g-3 align-items-end">
                                            <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1">Creatinina (mg/dL)</label><input type="number" step="0.1" className="form-control border-0 shadow-sm bg-light py-2 fw-bold" value={calcData.cre} onChange={(e) => setCalcData({...calcData, cre: e.target.value})} /></div>
                                            <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1">UPC (Urina)</label><input type="number" step="0.1" className="form-control border-0 shadow-sm bg-light py-2 fw-bold" value={calcData.upc} onChange={(e) => setCalcData({...calcData, upc: e.target.value})} /></div>
                                            <div className="col-12 col-md-4"><label className="small fw-bold text-muted mb-1">Quadro Clínico</label><select className="form-select border-0 shadow-sm bg-light py-2 fw-bold" value={calcData.sintomas} onChange={(e) => setCalcData({...calcData, sintomas: e.target.value})}><option value="leves">Sinais Leves</option><option value="moderados">Sinais Moderados</option><option value="graves">Sinais Graves</option></select></div>
                                            <div className="col-12 col-md-2"><button className="btn btn-primary w-100 fw-bold py-2 shadow-sm rounded-3 d-flex justify-content-center align-items-center gap-2" onClick={handleCalcularEstadio}><BrainCircuit size={18}/> Avaliar</button></div>
                                        </div>

                                        {calcResultado && (
                                            <div className={`alert bg-${calcResultado.cor}-subtle border border-${calcResultado.cor} mt-5 mb-0 shadow-sm d-flex flex-column flex-md-row align-items-md-center gap-4 rounded-4 p-4 fade-in`}>
                                                <div className={`text-${calcResultado.cor} bg-white p-3 rounded-circle shadow-sm`}><AlertTriangle size={36} /></div>
                                                <div>
                                                    <h4 className={`fw-black mb-1 text-${calcResultado.cor} text-uppercase`}>ESTÁDIO {calcResultado.estagio}</h4>
                                                    <p className="mb-0 fw-bold text-dark">{calcResultado.conduta}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h6 className="fw-black text-secondary mb-4 mt-5 text-uppercase d-flex align-items-center gap-2" style={{letterSpacing:'1px'}}><ChartIcon className="text-primary"/> Curva Laboratorial</h6>
                                <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border" style={{ height: '350px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartDataMock} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold'}} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold'}} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
                                            <Line yAxisId="right" type="monotone" dataKey="creatinina" name="Creatinina (mg/dL)" stroke="#ef4444" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {showEditModal && (
                <div className="modal show d-block fade-in" style={{background:'rgba(15, 23, 42, 0.85)', zIndex: 1050}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                            <div className="modal-header bg-white border-bottom p-4">
                                <h5 className="modal-title fw-black text-dark d-flex align-items-center gap-2"><Edit3 className="text-primary"/> Editar Prontuário</h5>
                                <button className="btn-close shadow-none" onClick={()=>setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 p-md-5 bg-light">
                                <div className="text-center mb-5">
                                    <div className="position-relative d-inline-block photo-upload-wrapper">
                                        <img src={editPreview || "https://via.placeholder.com/150"} className="rounded-circle border border-4 border-white shadow-sm" style={{width:140, height:140, objectFit:'cover'}} alt="Preview" />
                                        <label className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow-sm border border-2 border-white cursor-pointer transition-hover" style={{transform: 'translate(-5px, -5px)'}}>
                                            <Camera size={20}/>
                                            <input type="file" className="d-none" onChange={handleEditFileChange} accept="image/*"/>
                                        </label>
                                    </div>
                                </div>
                                <div className="row g-3 bg-white p-4 rounded-4 shadow-sm mb-4 border">
                                    <div className="col-12 col-md-6"><label className="small fw-bold text-muted mb-1 text-uppercase">Nome do Pet</label><input className="form-control border-0 bg-light py-2 fw-bold" name="nome" value={editFormData.nome} onChange={handleEditChange}/></div>
                                    <div className="col-12 col-md-6"><label className="small fw-bold text-muted mb-1 text-uppercase">Raça</label><input className="form-control border-0 bg-light py-2 fw-bold" name="raca" value={editFormData.raca} onChange={handleEditChange}/></div>
                                    <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1 text-uppercase">Idade (Anos)</label><input type="number" className="form-control border-0 bg-light py-2 fw-bold" name="idade_anos" value={editFormData.idade_anos} onChange={handleEditChange}/></div>
                                    <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1 text-uppercase">Idade (Meses)</label><input type="number" className="form-control border-0 bg-light py-2 fw-bold" name="idade_meses" value={editFormData.idade_meses} onChange={handleEditChange}/></div>
                                    <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1 text-uppercase">Cor (Pelagem)</label><input className="form-control border-0 bg-light py-2 fw-bold" name="pelagem_cor" value={editFormData.pelagem_cor} onChange={handleEditChange}/></div>
                                    <div className="col-6 col-md-3"><label className="small fw-bold text-muted mb-1 text-uppercase">Tamanho (Pelo)</label><select className="form-select border-0 bg-light py-2 fw-bold" name="pelagem_tamanho" value={editFormData.pelagem_tamanho} onChange={handleEditChange}><option value="CURTO">Curto</option><option value="MEDIO">Médio</option><option value="LONGO">Longo</option></select></div>
                                </div>
                                <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border">
                                    <label className="small fw-black text-danger mb-2 text-uppercase">Status Epidemiológico Atual</label>
                                    <select className={`form-select form-select-lg border-0 bg-light fw-black shadow-none ${editFormData.status === 'POSITIVO' ? 'text-danger' : editFormData.status === 'NEGATIVO' ? 'text-success' : 'text-warning'}`} name="status" value={editFormData.status} onChange={handleEditChange}>
                                        <option value="SUSPEITO">Suspeito (Aguardando Confirmação)</option>
                                        <option value="NEGATIVO">Negativo (Livre da Doença)</option>
                                        <option value="POSITIVO">Positivo (Confirmado)</option>
                                        <option value="OBITO">Óbito</option>
                                        <option value="EM_TRATAMENTO">Em Tratamento Clínico</option>
                                    </select>
                                </div>
                                <div className="bg-white p-4 rounded-4 shadow-sm border">
                                    <h6 className="fw-black text-muted mb-3 pb-2 border-bottom text-uppercase d-flex align-items-center gap-2"><Syringe size={18}/> Caderneta de Vacinação</h6>
                                    <div className="row g-3">
                                        {[1, 2, 3].map(dose => (
                                            <div className="col-12 col-md-4" key={dose}>
                                                <div className="p-3 bg-light rounded-4 border-0 shadow-sm h-100 transition-hover">
                                                    <div className="form-check form-switch mb-2 d-flex align-items-center cursor-pointer">
                                                        <input type="checkbox" className="form-check-input ms-0 me-2 cursor-pointer" style={{transform: 'scale(1.2)'}} name={`tomou_dose_${dose}`} checked={editFormData[`tomou_dose_${dose}`]} onChange={handleEditChange} />
                                                        <label className="fw-black small m-0 cursor-pointer">{dose}ª Dose {dose === 3 && "(Reforço)"}</label>
                                                    </div>
                                                    <input type="date" className="form-control border-0 bg-white shadow-sm fw-bold" name={`data_dose_${dose}`} disabled={!editFormData[`tomou_dose_${dose}`]} value={editFormData[`data_dose_${dose}`]} onChange={handleEditChange}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-white border-top p-4 d-flex justify-content-between">
                                <button className="btn btn-light fw-bold px-4 rounded-pill shadow-sm border" onClick={()=>setShowEditModal(false)}>Cancelar</button>
                                <button className="btn btn-primary px-5 py-2 fw-black rounded-pill shadow d-flex align-items-center gap-2" onClick={salvarEdicao}><Save size={18}/> Salvar Perfil</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                .transition-all { transition: all 0.3s ease-in-out; }
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }
                .hover-bg-white:hover { background-color: white !important; cursor: pointer; }
                .cursor-pointer { cursor: pointer; }
                .photo-upload-wrapper:hover label { transform: scale(1.1) translate(-5px, -5px) !important; }
                .fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Barra de rolagem premium visível no PC (para o mouse) e escondida no celular (onde tem touch) */
                @media (min-width: 768px) {
                    .custom-scrollbar-tabs::-webkit-scrollbar { height: 6px; }
                    .custom-scrollbar-tabs::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                    .custom-scrollbar-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    .custom-scrollbar-tabs::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                }
                @media (max-width: 767px) {
                    .custom-scrollbar-tabs::-webkit-scrollbar { display: none; }
                    .custom-scrollbar-tabs { -ms-overflow-style: none; scrollbar-width: none; }
                }
                `}
            </style>
        </div>
    );
}

export default GestaoClinica;