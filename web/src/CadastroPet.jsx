import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { Dog, Save, Camera, Syringe, User, Palette, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

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
                value={dateValue || ''} // 🛡️ Evita o erro de "uncontrolled input"
                onChange={onChange} 
            />
        </div>
    </div>
);

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
                const dados = res.data.results || res.data || [];
                setProprietarios(Array.isArray(dados) ? dados : []);
            })
            .catch(err => {
                console.error(err);
                setProprietarios([]);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        if (!formData.proprietario) return mostrarFeedback("Selecione um tutor!", "warning");
        
        setLoading(true);
        const data = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (key.startsWith('data_dose_')) {
                const doseNum = key.split('_')[2];
                if (formData[`tomou_dose_${doseNum}`] && formData[key]) {
                    data.append(key, formData[key]);
                }
            } else if (typeof formData[key] === 'boolean') {
                data.append(key, formData[key] ? 'True' : 'False');
            } else {
                data.append(key, formData[key] || '');
            }
        });
        
        if (foto) data.append('foto', foto);

        try {
            await axios.post('https://lvcvetsusfull.onrender.com/api/pets/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            mostrarFeedback("Paciente cadastrado com sucesso!", "success");
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error("Erro no envio:", error);
            mostrarFeedback("Erro ao salvar ficha.", "danger");
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container-fluid p-0 mx-auto fade-in" style={{ maxWidth: '900px', padding: '20px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bolder m-0 text-dark"><Dog className="text-primary me-2" />Cadastro de Paciente</h2>
                        <p className="text-muted mb-0 small">Insira os dados clínicos do animal.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="btn btn-white border shadow-sm rounded-pill px-4"><ArrowLeft size={16} /> Voltar</button>
                </div>

                <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                    {feedback.show && (
                        <div className={`alert alert-${feedback.type} border-0 rounded-0 fw-bold px-4`}>{feedback.msg}</div>
                    )}

                    <div className="card-body p-4 p-md-5">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small"><User size={18} className="me-2"/>Identificação</h6>
                                <div className="p-4 bg-light rounded-4 border">
                                    <div className="row g-4 align-items-center">
                                        <div className="col-12 col-md-3 text-center">
                                            <div className="d-inline-block position-relative">
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="rounded-circle border border-3 border-white shadow-sm" style={{width: 120, height: 120, objectFit: 'cover'}} />
                                                ) : (
                                                    <div className="bg-white rounded-circle border shadow-sm d-flex align-items-center justify-content-center text-primary" style={{width: 120, height: 120}}><Camera size={40} /></div>
                                                )}
                                                <input type="file" className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-9">
                                            <div className="row g-3">
                                                <div className="col-md-12">
                                                    <label className="form-label fw-bold text-muted small">TUTOR</label>
                                                    <select className="form-select" name="proprietario" required onChange={handleChange} value={formData.proprietario || ''}>
                                                        <option value="">Selecione...</option>
                                                        {proprietarios.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-5">
                                                    <label className="form-label fw-bold text-muted small">NOME DO PET</label>
                                                    <input type="text" className="form-control" name="nome" value={formData.nome || ''} required onChange={handleChange} />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold text-muted small">RAÇA</label>
                                                    <input type="text" className="form-control" name="raca" value={formData.raca || ''} onChange={handleChange} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold text-muted small">SEXO</label>
                                                    <select className="form-select" name="sexo" value={formData.sexo || 'M'} onChange={handleChange}>
                                                        <option value="M">Macho</option>
                                                        <option value="F">Fêmea</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small"><Palette size={18} className="me-2"/>Características</h6>
                                <div className="p-4 bg-light rounded-4 border row g-3">
                                    <div className="col-6 col-md-3">
                                        <label className="form-label fw-bold text-muted small">ANOS</label>
                                        <input type="number" className="form-control" name="idade_anos" value={formData.idade_anos} onChange={handleChange} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="form-label fw-bold text-muted small">MESES</label>
                                        <input type="number" className="form-control" name="idade_meses" value={formData.idade_meses} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold text-muted small">PELAGEM</label>
                                        <select className="form-select" name="pelagem_tamanho" value={formData.pelagem_tamanho} onChange={handleChange}>
                                            <option value="CURTO">Curto</option>
                                            <option value="MEDIO">Médio</option>
                                            <option value="LONGO">Longo</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold text-muted small">COR</label>
                                        <input type="text" className="form-control" name="pelagem_cor" value={formData.pelagem_cor || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small"><Syringe size={18} className="me-2"/>Protocolo Vacinal</h6>
                                <div className="row g-3">
                                    <VacinaCard label="1ª Dose" checkName="tomou_dose_1" dateName="data_dose_1" isChecked={formData.tomou_dose_1} dateValue={formData.data_dose_1} onChange={handleChange} />
                                    <VacinaCard label="2ª Dose" checkName="tomou_dose_2" dateName="data_dose_2" isChecked={formData.tomou_dose_2} dateValue={formData.data_dose_2} onChange={handleChange} />
                                    <VacinaCard label="3ª Dose (Reforço)" checkName="tomou_dose_3" dateName="data_dose_3" isChecked={formData.tomou_dose_3} dateValue={formData.data_dose_3} onChange={handleChange} isReforco={true} />
                                </div>
                            </div>

                            <div className="d-grid mt-4">
                                <button disabled={loading} type="submit" className="btn btn-success rounded-pill py-3 fw-bold shadow">
                                    {loading ? <><Loader2 size={20} className="spin-animation me-2" /> Salvando...</> : "Salvar Ficha Completa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </Layout>
    );
};

export default CadastroPet;