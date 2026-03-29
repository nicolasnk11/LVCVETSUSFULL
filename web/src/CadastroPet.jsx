import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { Dog, Save, Camera, Syringe, User, Palette, Calendar, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Cartão de Vacina (Evita repetir código 3 vezes)
const VacinaCard = ({ label, checkName, dateName, isChecked, dateValue, onChange, isReforco = false }) => (
    <div className="col-md-4 mb-3">
        <div className={`p-4 border rounded-4 bg-white shadow-sm h-100 transition-hover ${isChecked ? 'border-success' : ''}`}>
            <div className="form-check form-switch mb-3 d-flex align-items-center gap-2">
                <input 
                    className="form-check-input mt-0 cursor-pointer" 
                    style={{width: '2.5em', height: '1.25em'}}
                    type="checkbox" 
                    name={checkName} 
                    checked={isChecked} 
                    onChange={onChange} 
                />
                <label className={`form-check-label fw-bold ${isChecked ? (isReforco ? 'text-primary' : 'text-success') : 'text-muted'}`}>
                    {label}
                </label>
            </div>
            <input 
                type="date" 
                className={`form-control ${!isChecked ? 'bg-light text-muted' : 'border-success'}`} 
                name={dateName} 
                disabled={!isChecked} 
                value={dateValue} 
                onChange={onChange} 
            />
        </div>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
const CadastroPet = () => {
    const navigate = useNavigate();
    const [proprietarios, setProprietarios] = useState([]);
    const [foto, setFoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });
    
    const [formData, setFormData] = useState({
        nome: '', proprietario: '', sexo: 'M', raca: '',
        idade_anos: 0, idade_meses: 0,
        pelagem_tamanho: 'CURTO', pelagem_cor: '',
        status: 'SUSPEITO',
        tomou_dose_1: false, data_dose_1: '',
        tomou_dose_2: false, data_dose_2: '',
        tomou_dose_3: false, data_dose_3: ''
    });

    useEffect(() => {
        axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
            .then(res => {
                // Prevenção caso a API tenha paginação
                setProprietarios(res.data.results || res.data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const mostrarFeedback = (msg, type = 'success') => {
        setFeedback({ show: true, msg, type });
        setTimeout(() => setFeedback({ show: false, msg: '', type: '' }), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Garante que booleanos vão no formato correto pro Django
            const value = typeof formData[key] === 'boolean' ? (formData[key] ? 'True' : 'False') : formData[key];
            data.append(key, value);
        });
        
        if (foto) data.append('foto', foto);

        try {
            await axios.post('https://lvcvetsusfull.onrender.com/api/pets/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            mostrarFeedback("Paciente cadastrado com sucesso!", "success");
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error("Erro:", error);
            mostrarFeedback("Erro ao cadastrar. Verifique a conexão.", "danger");
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container-fluid p-0 mx-auto fade-in" style={{ maxWidth: '900px', padding: '20px' }}>
                
                {/* Cabeçalho */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h2 className="fw-bolder m-0 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-0.5px' }}>
                            <Dog className="text-primary" size={28} /> Cadastro de Paciente
                        </h2>
                        <p className="text-muted mt-1 mb-0 small fw-medium">Preencha o prontuário completo do animal.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="btn btn-white border shadow-sm text-muted fw-bold d-flex align-items-center gap-2 rounded-pill px-4 transition-hover">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    
                    {/* Feedback Visual */}
                    {feedback.show && (
                        <div className={`alert alert-${feedback.type} m-0 rounded-0 border-0 d-flex align-items-center gap-2 fw-bold fade-in px-4 py-3`}>
                            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {feedback.msg}
                        </div>
                    )}

                    <div className="card-body p-4 p-md-5">
                        <form onSubmit={handleSubmit}>
                            
                            {/* 1. IDENTIFICAÇÃO BÁSICA */}
                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small d-flex align-items-center gap-2" style={{ letterSpacing: '1px' }}>
                                    <User size={18}/> Identificação do Paciente e Tutor
                                </h6>
                                <div className="p-4 bg-light rounded-4 border">
                                    <div className="row g-4 align-items-center">
                                        
                                        {/* Foto */}
                                        <div className="col-12 col-md-3 text-center">
                                            <label className="form-label d-block fw-bold text-muted small">FOTO DO PERFIL</label>
                                            <div className="d-inline-block position-relative photo-upload-wrapper">
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="rounded-circle border border-3 border-white shadow-sm" style={{width: 120, height: 120, objectFit: 'cover'}} />
                                                ) : (
                                                    <div className="bg-white rounded-circle border shadow-sm d-flex align-items-center justify-content-center text-primary transition-hover" style={{width: 120, height: 120}}>
                                                        <Camera size={40} />
                                                    </div>
                                                )}
                                                <input type="file" className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer" accept="image/*" onChange={handleFileChange} title="Clique para enviar foto" />
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-9">
                                            <div className="row g-3">
                                                <div className="col-md-12">
                                                    <label className="form-label fw-bold text-muted small">TUTOR RESPONSÁVEL</label>
                                                    <select className="form-select shadow-sm" name="proprietario" required onChange={handleChange} value={formData.proprietario}>
                                                        <option value="">Selecione o tutor...</option>
                                                        {proprietarios.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-5">
                                                    <label className="form-label fw-bold text-muted small">NOME DO PET</label>
                                                    <input type="text" className="form-control shadow-sm" name="nome" placeholder="Ex: Rex" required onChange={handleChange} />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold text-muted small">RAÇA</label>
                                                    <input type="text" className="form-control shadow-sm" name="raca" placeholder="Ex: SRD" onChange={handleChange} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold text-muted small">SEXO</label>
                                                    <select className="form-select shadow-sm" name="sexo" onChange={handleChange}>
                                                        <option value="M">Macho</option>
                                                        <option value="F">Fêmea</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 2. CARACTERÍSTICAS FÍSICAS */}
                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small d-flex align-items-center gap-2" style={{ letterSpacing: '1px' }}>
                                    <Palette size={18}/> Características Físicas
                                </h6>
                                <div className="p-4 bg-light rounded-4 border">
                                    <div className="row g-3">
                                        <div className="col-6 col-md-3">
                                            <label className="form-label fw-bold text-muted small">IDADE (ANOS)</label>
                                            <input type="number" className="form-control shadow-sm" name="idade_anos" value={formData.idade_anos} onChange={handleChange} min="0" />
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <label className="form-label fw-bold text-muted small">IDADE (MESES)</label>
                                            <input type="number" className="form-control shadow-sm" name="idade_meses" value={formData.idade_meses} onChange={handleChange} min="0" max="11" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold text-muted small">TAMANHO PELAGEM</label>
                                            <select className="form-select shadow-sm" name="pelagem_tamanho" onChange={handleChange}>
                                                <option value="CURTO">Curto</option>
                                                <option value="MEDIO">Médio</option>
                                                <option value="LONGO">Longo</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold text-muted small">COR DA PELAGEM</label>
                                            <input type="text" className="form-control shadow-sm" name="pelagem_cor" onChange={handleChange} placeholder="Ex: Caramelo" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. CONTROLE VACINAL */}
                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small d-flex align-items-center gap-2" style={{ letterSpacing: '1px' }}>
                                    <Syringe size={18}/> Vacinação contra Leishmaniose
                                </h6>
                                <div className="row g-3">
                                    <VacinaCard label="1ª Dose" checkName="tomou_dose_1" dateName="data_dose_1" isChecked={formData.tomou_dose_1} dateValue={formData.data_dose_1} onChange={handleChange} />
                                    <VacinaCard label="2ª Dose" checkName="tomou_dose_2" dateName="data_dose_2" isChecked={formData.tomou_dose_2} dateValue={formData.data_dose_2} onChange={handleChange} />
                                    <VacinaCard label="3ª Dose (Reforço)" checkName="tomou_dose_3" dateName="data_dose_3" isChecked={formData.tomou_dose_3} dateValue={formData.data_dose_3} onChange={handleChange} isReforco={true} />
                                </div>
                            </div>

                            {/* Botão Salvar */}
                            <div className="d-grid gap-2 mt-4">
                                <button disabled={loading} type="submit" className="btn btn-success rounded-pill py-3 fw-bold shadow d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '1.1rem' }}>
                                    {loading ? (
                                        <><Loader2 size={22} className="spin-animation" /> Salvando Prontuário...</>
                                    ) : (
                                        <><Save size={22} /> Salvar Ficha Completa</>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            <style>
                {`
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.1)!important; }
                .cursor-pointer { cursor: pointer; }
                .photo-upload-wrapper:hover img, .photo-upload-wrapper:hover div { opacity: 0.8; }
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>
        </Layout>
    );
};

export default CadastroPet;