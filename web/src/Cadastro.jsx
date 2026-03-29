import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
// Ícones Premium
import { User, Phone, MapPin, Save, ArrowLeft, Search, Edit3, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Padroniza os inputs com ícones e limpa o código
const InputIcon = ({ label, icon: Icon, type = "text", name, value, onChange, placeholder, required = false, readOnly = false }) => (
    <div className="mb-3">
        <label className="form-label fw-bold text-muted small mb-1" style={{ letterSpacing: '0.5px' }}>{label}</label>
        <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0 text-muted px-3">
                <Icon size={18} />
            </span>
            <input 
                required={required} readOnly={readOnly} name={name} value={value} 
                onChange={onChange} type={type} placeholder={placeholder}
                className={`form-control border-start-0 ps-0 ${readOnly ? 'bg-light text-primary fw-bold' : ''}`} 
            />
        </div>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
const Cadastro = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const tutorParaEditar = location.state?.tutorParaEditar;
    const isEditing = !!tutorParaEditar;

    const [loading, setLoading] = useState(false);
    const [buscandoEndereco, setBuscandoEndereco] = useState(false);
    const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });

    const [formData, setFormData] = useState({
        nome: '',
        endereco: '',
        telefone: '',
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        if (isEditing && tutorParaEditar) {
            setFormData({
                nome: tutorParaEditar.nome,
                endereco: tutorParaEditar.endereco,
                telefone: tutorParaEditar.telefone,
                latitude: tutorParaEditar.latitude || '',
                longitude: tutorParaEditar.longitude || ''
            });
        }
    }, [isEditing, tutorParaEditar]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ⏳ UX: Mostra mensagens bonitas em vez de alert()
    const mostrarFeedback = (msg, type = 'success') => {
        setFeedback({ show: true, msg, type });
        setTimeout(() => setFeedback({ show: false, msg: '', type: '' }), 4000);
    };

    // 1. Pega GPS do Dispositivo
    const pegarLocalizacao = () => {
        if ("geolocation" in navigator) {
            mostrarFeedback("Buscando satélites...", "warning");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toFixed(6),
                        longitude: position.coords.longitude.toFixed(6)
                    }));
                    mostrarFeedback("📍 GPS detectado com sucesso!", "success");
                }, 
                (error) => mostrarFeedback(`Erro no GPS: ${error.message}`, "danger")
            );
        } else {
            mostrarFeedback("Navegador sem suporte a GPS.", "danger");
        }
    };

    // 2. Busca Coordenadas pelo Texto
    const buscarPeloEndereco = async () => {
        if (!formData.endereco.trim()) {
            mostrarFeedback("Digite o endereço antes de buscar!", "warning");
            return;
        }
        
        setBuscandoEndereco(true);
        try {
            const query = encodeURIComponent(`${formData.endereco}, Fortaleza, Ceará`);
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);

            if (response.data && response.data.length > 0) {
                const local = response.data[0];
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(local.lat).toFixed(6),
                    longitude: parseFloat(local.lon).toFixed(6)
                }));
                mostrarFeedback("📍 Endereço localizado no mapa!", "success");
            } else {
                mostrarFeedback("❌ Não encontrado. Tente incluir o Bairro.", "warning");
            }
        } catch (error) {
            console.error(error);
            mostrarFeedback("Erro na comunicação com o satélite.", "danger");
        } finally {
            setBuscandoEndereco(false);
        }
    };

    // 3. Salvar no Banco
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dadosParaEnviar = {
            nome: formData.nome,
            endereco: formData.endereco,
            telefone: formData.telefone,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null
        };

        try {
            if (isEditing) {
                await axios.patch(`https://lvcvetsusfull.onrender.com/api/proprietarios/${tutorParaEditar.id}/`, dadosParaEnviar);
                mostrarFeedback("Dados atualizados com sucesso!", "success");
            } else {
                await axios.post('https://lvcvetsusfull.onrender.com/api/proprietarios/', dadosParaEnviar);
                mostrarFeedback("Tutor cadastrado com sucesso!", "success");
            }
            // Aguarda 1.5s para o usuário ler a mensagem antes de sair da tela
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error(error);
            mostrarFeedback("Erro ao salvar. Verifique a conexão.", "danger");
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container-fluid p-0 mx-auto fade-in" style={{ maxWidth: '800px', padding: '20px' }}>
                
                {/* Cabeçalho */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h2 className="fw-bolder m-0 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-0.5px' }}>
                            {isEditing ? <><Edit3 className="text-primary"/> Editar Tutor</> : <><User className="text-primary"/> Novo Tutor</>}
                        </h2>
                        <p className="text-muted mt-1 mb-0 small fw-medium">
                            {isEditing ? `Atualizando informações de ${tutorParaEditar.nome}` : "Preencha os dados e defina a localização no mapa."}
                        </p>
                    </div>
                    <button onClick={() => navigate('/')} className="btn btn-white border shadow-sm text-muted fw-bold d-flex align-items-center gap-2 rounded-pill px-4 transition-hover">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>

                {/* Card Principal */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    
                    {/* Barra de Feedback (UX) */}
                    {feedback.show && (
                        <div className={`alert alert-${feedback.type} m-0 rounded-0 border-0 d-flex align-items-center gap-2 fw-bold fade-in px-4 py-3`} role="alert">
                            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {feedback.msg}
                        </div>
                    )}

                    <div className="card-body p-4 p-md-5">
                        <form onSubmit={handleSubmit}>
                            
                            {/* Sessão 1: Dados Pessoais */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Dados Pessoais</h6>
                                <div className="p-4 bg-light rounded-4 border">
                                    <InputIcon label="NOME COMPLETO" icon={User} name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome do responsável" required />
                                    
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <InputIcon label="TELEFONE" icon={Phone} type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(85) 90000-0000" required />
                                        </div>
                                        <div className="col-md-6">
                                            <InputIcon label="ENDEREÇO (Rua, Nº, Bairro)" icon={MapPin} name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Ex: Rua João da Silva, 123" required />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sessão 2: Localização */}
                            <div className="mb-5">
                                <h6 className="fw-bold text-primary mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Mapeamento Geográfico</h6>
                                <div className="p-4 bg-light rounded-4 border">
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-3">
                                            <InputIcon label="LATITUDE" icon={MapPin} value={formData.latitude} placeholder="0.0000" readOnly />
                                        </div>
                                        <div className="col-md-3">
                                            <InputIcon label="LONGITUDE" icon={MapPin} value={formData.longitude} placeholder="0.0000" readOnly />
                                        </div>
                                        
                                        {/* Botões de Ação de Mapa */}
                                        <div className="col-md-3 mb-3">
                                            <button type="button" onClick={buscarPeloEndereco} className="btn btn-outline-secondary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm py-2" disabled={buscandoEndereco}>
                                                {buscandoEndereco ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />} 
                                                Por Endereço
                                            </button>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <button type="button" onClick={pegarLocalizacao} className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm py-2">
                                                <MapPin size={18} /> Por GPS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Salvar */}
                            <button disabled={loading} type="submit" className="btn btn-success w-100 rounded-pill py-3 fw-bold shadow d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '1.1rem' }}>
                                {loading ? (
                                    <><Loader2 size={22} className="spin-animation" /> Salvando no Sistema...</>
                                ) : (
                                    isEditing ? <><Save size={22} /> Salvar Alterações</> : <><CheckCircle size={22} /> Confirmar Cadastro</>
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            </div>

            <style>
                {`
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { background-color: #f8f9fa; transform: translateY(-2px); }
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                `}
            </style>
        </Layout>
    );
};

export default Cadastro;