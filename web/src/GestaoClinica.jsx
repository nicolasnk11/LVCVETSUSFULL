import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom'; 
import { useReactToPrint } from 'react-to-print';
import { FaSyringe, FaNotesMedical, FaCheck, FaExclamationTriangle, FaDog, FaTrash, FaEdit, FaSave, FaCamera, FaTimes, FaSearch, FaPrint, FaPills, FaImage, FaIdCard, FaChartLine, FaStethoscope, FaBrain } from 'react-icons/fa';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CarteirinhaDigital from './CarteirinhaDigital'; 

function GestaoClinica() {
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('historico'); 
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editFoto, setEditFoto] = useState(null);
  const [editPreview, setEditPreview] = useState(null);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: selectedPet ? `Prontuario_LVC_${selectedPet.nome}` : 'Prontuario_LVC',
  });

  const [formData, setFormData] = useState({
    data_visita: new Date().toISOString().split('T')[0],
    tipo_inquerito: 'CENSITARIO',
    tem_emagrecimento: false, tem_alopecia: false, tem_descamacao: false, tem_onicogrifose: false, tem_feridas: false,
    resultado_elisa: 'NAO_REALIZADO', resultado_dpp: 'NAO_REALIZADO',
    usa_coleira: false, vacinado: false
  });

  const [medFormData, setMedFormData] = useState({
    nome: '',
    data_inicio: new Date().toISOString().split('T')[0],
    dose: '',
    observacoes: ''
  });

  const [fotoUpload, setFotoUpload] = useState(null);
  const [fotoLegenda, setFotoLegenda] = useState('');
  const fotoInputRef = useRef(null);

  const [calcData, setCalcData] = useState({ cre: '', upc: '', sintomas: 'leves' });
  const [calcResultado, setCalcResultado] = useState(null);

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

  const carregarPets = () => {
    axios.get('https://lvcvetsusfull.onrender.com/api/pets/')
      .then(res => { setPets(res.data); setLoading(false); })
      .catch(err => console.error(err));
  };

  const handleDeletePet = async () => {
      if (!selectedPet) return;
      if (!window.confirm(`Tem certeza que deseja EXCLUIR o prontuário de ${selectedPet.nome}?`)) return;
      try {
          await axios.delete(`https://lvcvetsusfull.onrender.com/api/pets/${selectedPet.id}/`);
          alert("Prontuário excluído."); setSelectedPet(null); carregarPets();
      } catch (e) { alert("Erro ao excluir."); }
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
      setEditFoto(null);
      setEditPreview(getFotoUrl(selectedPet.foto));
      setShowEditModal(true);
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
          } else { data.append(key, editFormData[key]); }
      });
      if (editFoto) data.append('foto', editFoto);
      try {
          await axios.patch(`https://lvcvetsusfull.onrender.com/api/pets/${selectedPet.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
          setShowEditModal(false); 
          const res = await axios.get('https://lvcvetsusfull.onrender.com/api/pets/');
          setPets(res.data);
          setSelectedPet(res.data.find(p => p.id === selectedPet.id));
      } catch (error) { console.error(error); alert("Erro ao salvar."); }
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
          const res = await axios.get('https://lvcvetsusfull.onrender.com/api/pets/');
          setPets(res.data);
          setSelectedPet(res.data.find(p => p.id === selectedPet.id));
          setAbaAtiva('historico');
      }).catch(() => alert("Erro ao salvar visita."));
  };

  const handleSubmitMedicacao = (e) => {
    e.preventDefault();
    axios.post('https://lvcvetsusfull.onrender.com/api/medicacoes/', { ...medFormData, pet: selectedPet.id })
      .then(async () => { 
          setMedFormData({nome: '', data_inicio: new Date().toISOString().split('T')[0], dose: '', observacoes: ''});
          const res = await axios.get('https://lvcvetsusfull.onrender.com/api/pets/');
          setPets(res.data);
          setSelectedPet(res.data.find(p => p.id === selectedPet.id));
      }).catch(() => alert("Erro ao prescrever medicação."));
  };

  const handleSalvarFotoEvolucao = async (e) => {
    e.preventDefault();
    if (!fotoUpload) {
        alert("Por favor, selecione uma imagem.");
        return;
    }
    const data = new FormData();
    data.append('pet', selectedPet.id);
    data.append('foto', fotoUpload);
    if (fotoLegenda) data.append('legenda', fotoLegenda);

    try {
        await axios.post('https://lvcvetsusfull.onrender.com/api/fotos-evolucao/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFotoUpload(null);
        setFotoLegenda('');
        if (fotoInputRef.current) fotoInputRef.current.value = '';
        
        const res = await axios.get('https://lvcvetsusfull.onrender.com/api/pets/');
        setPets(res.data);
        setSelectedPet(res.data.find(p => p.id === selectedPet.id));
    } catch (error) {
        console.error(error);
        alert("Erro ao enviar foto.");
    }
  };

  // --- 🔥 IA PREDITIVA EXPLICÁVEL (EXPLAINABLE AI) ---
  const calcularScoreRisco = (pet) => {
      if (!pet || (pet.status !== 'NEGATIVO' && pet.status !== 'SUSPEITO')) return null;

      let score = 10;
      let motivos = ["📍 Área endêmica de transmissão (Risco base: 10%)"]; // Início da explicação
      let recomendacoes = [];
      const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;

      if (!ultimaVisita || !ultimaVisita.usa_coleira) {
          score += 40;
          motivos.push("🚫 Ausência de coleira repelente (+40%)");
          recomendacoes.push("Encoleiramento Imediato");
      }

      if (!pet.tomou_dose_1 || !pet.tomou_dose_2 || !pet.tomou_dose_3) {
          score += 30;
          motivos.push("💉 Esquema vacinal primário incompleto (+30%)");
          recomendacoes.push("Completar Esquema Vacinal");
      }

      if (ultimaVisita && (ultimaVisita.tem_emagrecimento || ultimaVisita.tem_alopecia || ultimaVisita.tem_descamacao || ultimaVisita.tem_onicogrifose || ultimaVisita.tem_feridas)) {
          score += 20;
          motivos.push("⚠️ Apresenta sinais clínicos compatíveis com LVC (+20%)");
          recomendacoes.push("Realizar Teste Rápido DPP/ELISA");
      }

      if (recomendacoes.length === 0) recomendacoes.push("Manter monitoramento padrão de rotina");

      let cor = score <= 30 ? 'success' : score <= 60 ? 'warning' : 'danger';
      
      return { score, motivos, recomendacoes: recomendacoes.join(" • "), cor };
  };

  const formatTexto = (t) => t ? t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "-";
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "Pendente";

  const petsFiltrados = pets.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const chartDataMock = [
    { data: 'Jan', peso: 15.2, creatinina: 1.1 },
    { data: 'Fev', peso: 14.8, creatinina: 1.4 },
    { data: 'Mar', peso: 13.5, creatinina: 2.1 },
    { data: 'Abr', peso: 14.1, creatinina: 1.7 },
    { data: 'Mai', peso: 14.5, creatinina: 1.5 }
  ];

  return (
    <div className="d-flex" style={{ height: '100vh', backgroundColor: '#f4f6f8' }}>
      
      {/* ESQUERDA - LISTA */}
      <div className="bg-white border-end shadow-sm d-flex flex-column" style={{ width: '340px' }}>
        <div className="p-4 border-bottom">
            <h5 className="m-0 text-primary fw-bolder mb-3 d-flex align-items-center gap-2"><FaDog /> Pacientes</h5>
            <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden">
                <span className="input-group-text bg-light border-0 text-muted"><FaSearch /></span>
                <input type="text" className="form-control border-0 bg-light" placeholder="Procurar pet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="list-group list-group-flush border-0" style={{overflowY: 'auto'}}>
            {petsFiltrados.map(pet => (
              <button key={pet.id} className={`list-group-item list-group-item-action py-3 px-4 border-bottom ${selectedPet?.id === pet.id ? 'bg-primary-subtle border-start border-5 border-primary' : ''}`} onClick={() => { setSelectedPet(pet); setCalcResultado(null); }}>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                      {pet.foto ? (
                          <img src={getFotoUrl(pet.foto)} className="rounded-circle shadow-sm" style={{width:55, height:55, objectFit:'cover'}} />
                      ) : (
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width:55, height:55}}><FaDog className="text-muted" size={24}/></div>
                      )}
                  </div>
                  <div className="text-start flex-grow-1">
                      <h6 className="mb-0 fw-bold text-dark">{pet.nome}</h6>
                      <small className="text-muted">{pet.raca}</small>
                  </div>
                  {pet.status === 'POSITIVO' && <span className="badge bg-danger shadow-sm rounded-pill">POSITIVO</span>}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* DIREITA - CONTEÚDO */}
      <div className="flex-grow-1 p-4 position-relative" style={{ overflowY: 'auto' }}>
        {!selectedPet ? <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted opacity-50"><FaNotesMedical size={80} className="mb-3"/><h4 className="fw-bold">Selecione um paciente ao lado</h4></div> : (
          
          <div ref={componentRef} className="container bg-white rounded-4 shadow-sm p-5 border-0" style={{maxWidth: '950px'}}>
            
            <div className="d-none d-print-block text-center border-bottom mb-4 pb-3">
                <h3 className="fw-bold mb-0">LVCVETSUS</h3>
                <p className="text-muted mb-0">Sistema de Vigilância Epidemiológica - Ficha Clínica de Paciente</p>
                <p className="small text-muted">Emitido em: {new Date().toLocaleString()}</p>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-4">
                 {selectedPet.foto ? 
                    <img src={getFotoUrl(selectedPet.foto)} className="rounded-circle shadow" style={{width:110, height:110, objectFit:'cover'}} /> 
                    : <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width:110, height:110}}><FaDog size={50} className="text-muted"/></div>
                 }
                 <div>
                    <h2 className="fw-black mb-2 text-dark" style={{letterSpacing: '-1px'}}>{selectedPet.nome}</h2>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                        <span className={`badge rounded-pill px-3 py-2 ${selectedPet.status === 'POSITIVO' ? 'bg-danger text-white' : 'bg-success text-white'}`}>{formatTexto(selectedPet.status)}</span>
                        <span className="badge rounded-pill bg-light text-secondary border px-3 py-2">{selectedPet.raca || 'SRD'}</span>
                        <span className="badge rounded-pill bg-light text-secondary border px-3 py-2">{selectedPet.idade_anos}a {selectedPet.idade_meses}m</span>
                    </div>
                 </div>
              </div>
              <div className="d-print-none d-flex gap-2"> 
                  <button className="btn btn-outline-dark shadow-sm fw-bold rounded-pill px-4" onClick={handlePrint}><FaPrint className="me-2"/> Imprimir</button>
                  <button className="btn btn-light shadow-sm rounded-circle p-3" onClick={abrirModalEdicao} title="Editar"><FaEdit /></button>
                  <button className="btn btn-light text-danger shadow-sm rounded-circle p-3 ms-1" onClick={handleDeletePet} title="Excluir"><FaTrash /></button>
              </div>
            </div>

            {/* 🔥 ALERTA DE IA COM JUSTIFICATIVA VISUAL 🔥 */}
            {(() => {
                const risco = calcularScoreRisco(selectedPet);
                if (!risco) return null;
                return (
                    <div className={`alert alert-${risco.cor === 'warning' ? 'warning' : risco.cor === 'danger' ? 'danger' : 'success'} bg-${risco.cor === 'warning' ? 'warning-subtle' : risco.cor === 'danger' ? 'danger-subtle' : 'success-subtle'} border-0 shadow-sm rounded-4 p-4 mb-5 d-print-none transition-all`}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className={`fw-black mb-0 text-${risco.cor === 'warning' ? 'dark' : risco.cor} d-flex align-items-center gap-2`}>
                                <FaBrain size={22} /> IA Analítica: Nível de Vulnerabilidade
                            </h6>
                            <span className={`badge bg-${risco.cor} fs-6 px-3 py-2 rounded-pill shadow-sm`}>{risco.score}% de Risco</span>
                        </div>
                        
                        <div className="progress mb-4 bg-white shadow-sm" style={{ height: '16px', borderRadius: '10px' }}>
                            <div className={`progress-bar bg-${risco.cor} progress-bar-striped progress-bar-animated`} role="progressbar" style={{ width: `${risco.score}%` }}></div>
                        </div>

                        {/* CAIXA DE EXPLICAÇÃO DO RISCO */}
                        <div className="bg-white p-3 rounded-3 shadow-sm mb-3 border">
                            <p className={`small fw-bold mb-2 text-${risco.cor === 'warning' ? 'dark' : risco.cor} opacity-75 text-uppercase`} style={{ letterSpacing: '0.5px' }}>
                                Fatores de Risco Identificados:
                            </p>
                            <ul className="mb-0 small text-dark fw-bold" style={{ listStyleType: 'none', paddingLeft: '5px' }}>
                                {risco.motivos.map((motivo, idx) => (
                                    <li key={idx} className="mb-1">{motivo}</li>
                                ))}
                            </ul>
                        </div>

                        <p className={`mb-0 small fw-bold text-${risco.cor === 'warning' ? 'dark' : risco.cor}`}>
                            <span className="text-uppercase me-2 opacity-75">Ações Sugeridas:</span> {risco.recomendacoes}
                        </p>
                    </div>
                );
            })()}

            <div className="bg-light p-4 rounded-4 mb-5 border-0 shadow-sm">
                <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2"><FaSyringe /> Protocolo Vacinal</h6>
                <div className="row g-3">
                    <div className="col-md-4">
                        <div className="bg-white p-3 rounded-3 shadow-sm text-center border-0">
                            <small className="text-muted d-block fw-bold mb-1">1ª Dose</small>
                            {selectedPet.tomou_dose_1 ? <span className="text-success fw-bold"><FaCheck className="me-1"/> {formatDate(selectedPet.data_dose_1)}</span> : <span className="text-danger fw-bold"><FaTimes className="me-1"/> Pendente</span>}
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="bg-white p-3 rounded-3 shadow-sm text-center border-0">
                            <small className="text-muted d-block fw-bold mb-1">2ª Dose</small>
                            {selectedPet.tomou_dose_2 ? <span className="text-success fw-bold"><FaCheck className="me-1"/> {formatDate(selectedPet.data_dose_2)}</span> : <span className="text-danger fw-bold"><FaTimes className="me-1"/> Pendente</span>}
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="bg-white p-3 rounded-3 shadow-sm text-center border-0">
                            <small className="text-muted d-block fw-bold mb-1">3ª Dose</small>
                            {selectedPet.tomou_dose_3 ? <span className="text-success fw-bold"><FaCheck className="me-1"/> {formatDate(selectedPet.data_dose_3)}</span> : <span className="text-danger fw-bold"><FaTimes className="me-1"/> Pendente</span>}
                        </div>
                    </div>
                </div>
            </div>

            <ul className="nav nav-pills gap-2 mb-4 d-print-none pb-3 border-bottom flex-nowrap" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='historico'?'active shadow-sm':''}`} onClick={()=>setAbaAtiva('historico')}>📜 Histórico</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='medicacoes'?'active shadow-sm':''}`} onClick={()=>setAbaAtiva('medicacoes')}>💊 Medicações</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='galeria'?'active shadow-sm':''}`} onClick={()=>setAbaAtiva('galeria')}>📸 Galeria</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='nova_visita'?'active shadow-sm':''}`} onClick={()=>setAbaAtiva('nova_visita')}>➕ Nova Visita</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='carteirinha'?'active bg-dark text-white shadow-sm':''}`} onClick={()=>setAbaAtiva('carteirinha')}><FaIdCard className="me-1"/> Carteirinha</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill px-4 fw-bold ${abaAtiva==='estadiamento'?'active bg-primary text-white shadow-sm':''}`} onClick={()=>setAbaAtiva('estadiamento')}><FaChartLine className="me-1"/> Monitorização</button></li>
            </ul>

            <div className={`${abaAtiva === 'historico' ? '' : 'd-none'} d-print-block mt-4`}>
                <h5 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2"><FaNotesMedical /> Inquéritos Realizados</h5>
                <div className="table-responsive rounded-4 shadow-sm border border-light">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr><th className="py-3 px-4 border-0">Data</th><th className="py-3 px-4 border-0">Inquérito</th><th className="py-3 px-4 border-0">Sintomas Clínicos</th><th className="py-3 px-4 border-0">DPP/ELISA</th></tr>
                        </thead>
                        <tbody>
                            {selectedPet.visitas?.length > 0 ? selectedPet.visitas.map(v => (
                                <tr key={v.id}>
                                    <td className="fw-bold px-4 py-3 border-light">{formatDate(v.data_visita)}</td>
                                    <td className="px-4 py-3 border-light"><span className="badge bg-light text-dark rounded-pill border">{formatTexto(v.tipo_inquerito)}</span></td>
                                    <td className="px-4 py-3 border-light text-muted small">
                                        {[v.tem_emagrecimento && "Emagrecimento", v.tem_alopecia && "Alopecia", v.tem_onicogrifose && "Onicogrifose", v.tem_feridas && "Feridas"].filter(Boolean).join(", ") || "Assintomático"}
                                    </td>
                                    <td className="px-4 py-3 border-light"><span className={`badge rounded-pill ${v.resultado_dpp === 'REAGENTE' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>{v.resultado_dpp === 'REAGENTE' ? 'Positivo' : 'Negativo'}</span></td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center py-5 text-muted border-0">Nenhum registro encontrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${abaAtiva === 'medicacoes' ? '' : 'd-none'} d-print-block mt-4`}>
                <h5 className="fw-bold text-success mb-4 d-flex align-items-center gap-2"><FaPills /> Plano Terapêutico Ativo</h5>
                
                <form onSubmit={handleSubmitMedicacao} className="mb-5 p-4 bg-light border-0 rounded-4 shadow-sm d-print-none">
                    <h6 className="fw-bold text-dark mb-3">Nova Prescrição</h6>
                    <div className="row g-3">
                        <div className="col-md-5"><input type="text" className="form-control border-0 shadow-sm" name="nome" placeholder="Medicamento/Coleira" value={medFormData.nome} onChange={handleMedInputChange} required/></div>
                        <div className="col-md-3"><input type="date" className="form-control border-0 shadow-sm" name="data_inicio" value={medFormData.data_inicio} onChange={handleMedInputChange} required/></div>
                        <div className="col-md-4"><input type="text" className="form-control border-0 shadow-sm" name="dose" placeholder="Dose (ex: 2mg/kg)" value={medFormData.dose} onChange={handleMedInputChange}/></div>
                        <div className="col-md-10"><input type="text" className="form-control border-0 shadow-sm" name="observacoes" placeholder="Observações" value={medFormData.observacoes} onChange={handleMedInputChange}/></div>
                        <div className="col-md-2 d-flex align-items-end"><button type="submit" className="btn btn-success w-100 fw-bold shadow-sm rounded-3">Salvar</button></div>
                    </div>
                </form>

                <div className="table-responsive rounded-4 shadow-sm border border-light">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr><th className="py-3 px-4 border-0">Início</th><th className="py-3 px-4 border-0">Medicamento</th><th className="py-3 px-4 border-0">Dose</th><th className="py-3 px-4 border-0">Observações</th></tr>
                        </thead>
                        <tbody>
                            {selectedPet.medicacoes?.length > 0 ? selectedPet.medicacoes.map(m => (
                                <tr key={m.id}>
                                    <td className="px-4 py-3 border-light">{formatDate(m.data_inicio)}</td>
                                    <td className="fw-bold text-primary px-4 py-3 border-light">{m.nome}</td>
                                    <td className="px-4 py-3 border-light">{m.dose || '-'}</td>
                                    <td className="text-muted px-4 py-3 border-light">{m.observacoes || '-'}</td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center py-5 text-muted border-0">Nenhum tratamento registrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${abaAtiva === 'galeria' ? '' : 'd-none'} d-print-block mt-4`} style={{ pageBreakInside: 'avoid' }}>
                <h5 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2"><FaImage /> Acompanhamento Fotográfico</h5>

                <form onSubmit={handleSalvarFotoEvolucao} className="mb-5 p-4 bg-light border-0 rounded-4 shadow-sm d-print-none">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="small fw-bold text-muted mb-1">Selecione uma imagem</label>
                            <input type="file" className="form-control border-0 shadow-sm bg-white" ref={fotoInputRef} accept="image/*" onChange={(e) => setFotoUpload(e.target.files[0])} />
                        </div>
                        <div className="col-md-5">
                            <label className="small fw-bold text-muted mb-1">Legenda / Observação</label>
                            <input type="text" className="form-control border-0 shadow-sm" placeholder="Ex: Início do tratamento..." value={fotoLegenda} onChange={(e) => setFotoLegenda(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm rounded-3"><FaCamera className="me-2"/> Anexar</button>
                        </div>
                    </div>
                </form>

                <div className="row g-4">
                    {selectedPet.galeria?.length > 0 ? selectedPet.galeria.map(img => (
                        <div key={img.id} className="col-md-4" style={{ pageBreakInside: 'avoid' }}>
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                                <div style={{ height: '200px', backgroundColor: '#f1f5f9' }}>
                                    <img src={getFotoUrl(img.foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Evolução" />
                                </div>
                                <div className="card-body p-3 text-center">
                                    <small className="text-primary d-block fw-bold mb-1"><FaNotesMedical className="me-1"/> {formatDate(img.data_registro)}</small>
                                    <p className="card-text small mb-0 text-muted">{img.legenda || "Sem observações."}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-12 d-print-none text-center py-5 bg-light rounded-4 border border-dashed text-muted">
                            <FaImage size={40} className="mb-3 opacity-50"/>
                            <p className="fw-bold mb-0">Nenhuma foto anexada.</p>
                        </div>
                    )}
                </div>

                {selectedPet.galeria?.length >= 2 && (
                    <div className="mt-5 p-5 border-0 rounded-4 shadow-sm" style={{ backgroundColor: '#f1f5f9', pageBreakInside: 'avoid' }}>
                        <h6 className="fw-bold text-dark text-center mb-4 d-flex align-items-center justify-content-center gap-2"><FaExclamationTriangle className="text-warning"/> Comparativo de Evolução</h6>
                        
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', padding: '0 15px', textAlign: 'center', verticalAlign: 'top' }}>
                                        <span className="badge bg-secondary mb-3 rounded-pill px-3 py-2">Primeiro Registro</span>
                                        <div className="shadow-sm" style={{ height: '220px', overflow: 'hidden', borderRadius: '12px', border: '4px solid white' }}>
                                            <img src={getFotoUrl(selectedPet.galeria[0].foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <small className="d-block mt-3 text-muted fw-bold">{formatDate(selectedPet.galeria[0].data_registro)}</small>
                                    </td>
                                    <td style={{ width: '50%', padding: '0 15px', textAlign: 'center', verticalAlign: 'top' }}>
                                        <span className="badge bg-success mb-3 rounded-pill px-3 py-2">Mais Recente</span>
                                        <div className="shadow-sm" style={{ height: '220px', overflow: 'hidden', borderRadius: '12px', border: '4px solid white' }}>
                                            <img src={getFotoUrl(selectedPet.galeria[selectedPet.galeria.length - 1].foto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <small className="d-block mt-3 text-muted fw-bold">{formatDate(selectedPet.galeria[selectedPet.galeria.length - 1].data_registro)}</small>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className={`${abaAtiva === 'nova_visita' ? '' : 'd-none'} d-print-none mt-4 fade-in`}>
                <h5 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">Registrar Nova Visita de Monitoramento</h5>
                <form onSubmit={handleSubmitVisita}>
                    <div className="row g-4 mb-4">
                         <div className="col-md-6">
                             <label className="fw-bold small text-muted mb-1">Data</label>
                             <input type="date" className="form-control border-0 shadow-sm py-2 bg-light" name="data_visita" value={formData.data_visita} onChange={handleInputChange}/>
                         </div>
                         <div className="col-md-6">
                             <label className="fw-bold small text-muted mb-1">Inquérito</label>
                             <select className="form-select border-0 shadow-sm py-2 bg-light" name="tipo_inquerito" value={formData.tipo_inquerito} onChange={handleInputChange}>
                                 <option value="CENSITARIO">Censitário</option>
                                 <option value="AMOSTRAL">Amostral</option>
                             </select>
                         </div>
                    </div>

                    <div className="card mb-4 border-0 shadow-sm rounded-4 bg-light p-4">
                        <h6 className="fw-bold text-dark mb-4">📋 Sinais Clínicos (Marque se presente)</h6>
                        <div className="row g-3">
                            {['tem_emagrecimento', 'tem_alopecia', 'tem_descamacao', 'tem_onicogrifose', 'tem_feridas'].map(sinal => (
                                <div key={sinal} className="col-md-4">
                                    <div className="form-check form-switch p-3 bg-white rounded-3 shadow-sm border-0 d-flex align-items-center">
                                        <input className="form-check-input ms-0 me-3 mt-0" type="checkbox" name={sinal} checked={formData[sinal]} onChange={handleInputChange} style={{transform: 'scale(1.2)'}}/>
                                        <label className="form-check-label fw-bold text-dark m-0">{formatTexto(sinal)}</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="fw-bold small text-muted mb-1">ELISA</label>
                            <select className="form-select border-0 shadow-sm py-2 bg-light" name="resultado_elisa" onChange={handleInputChange}>
                                <option value="NAO_REALIZADO">Não Realizado</option>
                                <option value="REAGENTE">🔴 Positivo</option>
                                <option value="NAO_REAGENTE">🟢 Negativo</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="fw-bold small text-muted mb-1">DPP</label>
                            <select className="form-select border-0 shadow-sm py-2 bg-light" name="resultado_dpp" onChange={handleInputChange}>
                                <option value="NAO_REALIZADO">Não Realizado</option>
                                <option value="REAGENTE">🔴 Positivo</option>
                                <option value="NAO_REAGENTE">🟢 Negativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-warning-subtle rounded-4 mb-5 border-0 shadow-sm">
                        <div className="form-check form-switch d-flex align-items-center">
                            <input className="form-check-input ms-0 me-3 mt-0" type="checkbox" name="usa_coleira" checked={formData.usa_coleira} onChange={handleInputChange} style={{transform: 'scale(1.5)'}} />
                            <label className="form-check-label fw-bolder text-dark m-0">Usa Coleira Repelente no momento?</label>
                        </div>
                    </div>

                    <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg h5 mb-0">Salvar Visita</button>
                </form>
            </div>

            <div className={`${abaAtiva === 'carteirinha' ? '' : 'd-none'} d-print-none mt-4 fade-in`}>
                <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><FaIdCard className="text-primary"/> Credencial de Identificação Vetorial</h5>
                <CarteirinhaDigital pet={selectedPet} proprietario={selectedPet.proprietario} />
            </div>

            <div className={`${abaAtiva === 'estadiamento' ? '' : 'd-none'} d-print-block mt-4 fade-in`}>
                <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><FaStethoscope className="text-primary"/> Inteligência Clínica e Monitorização</h5>

                <div className="card border-0 shadow-sm mb-5 bg-white rounded-4 overflow-hidden">
                    <div className="card-header text-white fw-bold p-3" style={{ backgroundColor: '#0f172a' }}><FaNotesMedical className="me-2"/> Sistema de Apoio à Decisão (LeishVet)</div>
                    <div className="card-body p-4">
                        <p className="small text-muted mb-4">Insira os dados do último exame para obter a sugestão de conduta clínica.</p>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3"><label className="small fw-bold text-muted mb-1">Creatinina (mg/dL)</label><input type="number" step="0.1" className="form-control border-0 shadow-sm bg-light py-2" value={calcData.cre} onChange={(e) => setCalcData({...calcData, cre: e.target.value})} /></div>
                            <div className="col-md-3"><label className="small fw-bold text-muted mb-1">UPC</label><input type="number" step="0.1" className="form-control border-0 shadow-sm bg-light py-2" value={calcData.upc} onChange={(e) => setCalcData({...calcData, upc: e.target.value})} /></div>
                            <div className="col-md-4"><label className="small fw-bold text-muted mb-1">Sinais Clínicos</label><select className="form-select border-0 shadow-sm bg-light py-2" value={calcData.sintomas} onChange={(e) => setCalcData({...calcData, sintomas: e.target.value})}><option value="leves">Leves</option><option value="moderados">Moderados</option><option value="graves">Graves</option></select></div>
                            <div className="col-md-2"><button className="btn btn-primary w-100 fw-bold py-2 shadow-sm rounded-3" onClick={handleCalcularEstadio}>Calcular</button></div>
                        </div>

                        {calcResultado && (
                            <div className={`alert alert-${calcResultado.cor} mt-4 mb-0 border-0 shadow d-flex align-items-center gap-4 rounded-4 p-4`}>
                                <FaExclamationTriangle size={30} />
                                <div>
                                    <h5 className="fw-black mb-1 text-uppercase">ESTÁDIO {calcResultado.estagio}</h5>
                                    <p className="mb-0 small fw-bold">{calcResultado.conduta}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <h6 className="fw-bold text-secondary mb-4 mt-5"><FaChartLine className="me-2"/> Curva de Evolução</h6>
                <div className="bg-white p-4 rounded-4 shadow-sm border border-light" style={{ height: '380px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataMock} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} dx={-10} />
                            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} dx={10} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold' }} />
                            <Line yAxisId="left" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#3b82f6" strokeWidth={4} dot={{r: 5, strokeWidth: 2, fill: '#fff'}} />
                            <Line yAxisId="right" type="monotone" dataKey="creatinina" name="Creatinina (mg/dL)" stroke="#ef4444" strokeWidth={4} dot={{r: 5, strokeWidth: 2, fill: '#fff'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="d-none d-print-block mt-5 pt-5">
                <div className="d-flex justify-content-between px-5">
                    <div className="text-center" style={{width: '300px'}}><hr className="mb-2 border-dark border-2" /><small className="fw-bold">Responsável Legal</small></div>
                    <div className="text-center" style={{width: '300px'}}><hr className="mb-2 border-dark border-2" /><small className="fw-bold">Médico Veterinário / LVCVETSUS</small></div>
                </div>
            </div>

          </div>
        )}
      </div>

      {showEditModal && (
        <div className="modal show d-block" style={{background:'rgba(15, 23, 42, 0.85)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
             <div className="modal-content border-0 rounded-4 shadow-lg">
                <div className="modal-header bg-white border-bottom p-4">
                    <h5 className="modal-title fw-black text-dark"><FaEdit className="text-primary me-2"/> Editar Perfil</h5>
                    <button className="btn-close" onClick={()=>setShowEditModal(false)}></button>
                </div>
                <div className="modal-body p-4 bg-light" style={{maxHeight: '75vh', overflowY: 'auto'}}>
                    <div className="text-center mb-5">
                        <div className="position-relative d-inline-block">
                            <img src={editPreview || "https://via.placeholder.com/150"} className="rounded-circle border border-4 border-white shadow-sm" style={{width:140, height:140, objectFit:'cover'}} />
                            <label className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow-sm border border-2 border-white" style={{cursor:'pointer', transform: 'translate(-10px, -10px)'}}><FaCamera size={18}/><input type="file" className="d-none" onChange={handleEditFileChange} accept="image/*"/></label>
                        </div>
                    </div>
                    <div className="row g-3 bg-white p-4 rounded-4 shadow-sm mb-4 border-0">
                        <div className="col-md-6"><label className="small fw-bold text-muted mb-1">Nome</label><input className="form-control border-0 bg-light py-2" name="nome" value={editFormData.nome} onChange={handleEditChange}/></div>
                        <div className="col-md-6"><label className="small fw-bold text-muted mb-1">Raça</label><input className="form-control border-0 bg-light py-2" name="raca" value={editFormData.raca} onChange={handleEditChange}/></div>
                        <div className="col-md-3"><label className="small fw-bold text-muted mb-1">Anos</label><input type="number" className="form-control border-0 bg-light py-2" name="idade_anos" value={editFormData.idade_anos} onChange={handleEditChange}/></div>
                        <div className="col-md-3"><label className="small fw-bold text-muted mb-1">Meses</label><input type="number" className="form-control border-0 bg-light py-2" name="idade_meses" value={editFormData.idade_meses} onChange={handleEditChange}/></div>
                        <div className="col-md-3"><label className="small fw-bold text-muted mb-1">Cor</label><input className="form-control border-0 bg-light py-2" name="pelagem_cor" value={editFormData.pelagem_cor} onChange={handleEditChange}/></div>
                        <div className="col-md-3"><label className="small fw-bold text-muted mb-1">Tamanho</label><select className="form-select border-0 bg-light py-2" name="pelagem_tamanho" value={editFormData.pelagem_tamanho} onChange={handleEditChange}><option value="CURTO">Curto</option><option value="MEDIO">Médio</option><option value="LONGO">Longo</option></select></div>
                    </div>
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border-0">
                         <label className="small fw-bold text-danger mb-2">Status Epidemiológico Atual</label>
                         <select className="form-select form-select-lg border-0 bg-light fw-bold" name="status" value={editFormData.status} onChange={handleEditChange}><option value="SUSPEITO">Suspeito</option><option value="NEGATIVO">Negativo</option><option value="POSITIVO">Positivo</option><option value="OBITO">Óbito</option><option value="EM_TRATAMENTO">Em Tratamento</option></select>
                    </div>
                    <div className="bg-white p-4 rounded-4 shadow-sm border-0">
                        <h6 className="fw-bold text-muted mb-3 pb-2 border-bottom"><FaSyringe className="me-2"/>Vacinação</h6>
                        <div className="row g-3">
                            {[1, 2, 3].map(dose => (
                                <div className="col-md-4" key={dose}>
                                    <div className="p-3 bg-light rounded-3 border-0">
                                        <div className="form-check form-switch mb-2 d-flex align-items-center"><input type="checkbox" className="form-check-input ms-0 me-2" name={`tomou_dose_${dose}`} checked={editFormData[`tomou_dose_${dose}`]} onChange={handleEditChange} /><label className="fw-bold small">{dose}ª Dose</label></div>
                                        <input type="date" className="form-control border-0 bg-white shadow-sm" name={`data_dose_${dose}`} disabled={!editFormData[`tomou_dose_${dose}`]} value={editFormData[`data_dose_${dose}`]} onChange={handleEditChange}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer bg-white border-top p-4 d-flex justify-content-between">
                    <button className="btn btn-light fw-bold px-4 rounded-pill" onClick={()=>setShowEditModal(false)}>Cancelar</button>
                    <button className="btn btn-primary px-5 py-2 fw-bold rounded-pill shadow" onClick={salvarEdicao}><FaSave className="me-2"/> Salvar Alterações</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestaoClinica;