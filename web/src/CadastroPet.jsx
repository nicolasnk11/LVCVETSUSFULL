import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { FaDog, FaSave, FaCamera, FaSyringe } from 'react-icons/fa';

const CadastroPet = () => {
    const navigate = useNavigate();
    const [proprietarios, setProprietarios] = useState([]);
    const [foto, setFoto] = useState(null);
    const [preview, setPreview] = useState(null);
    
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
        axios.get('https://vetleish-api.onrender.com/api/proprietarios/')
            .then(res => setProprietarios(res.data))
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        // Adiciona todos os campos do estado ao FormData
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (foto) data.append('foto', foto);

        try {
            await axios.post('https://vetleish-api.onrender.com/api/pets/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Pet cadastrado com sucesso!');
            navigate('/');
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao cadastrar.");
        }
    };

    return (
        <Layout>
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card-premium p-4">
                        <h2 className="mb-4 fw-bold text-primary"><FaDog /> Cadastro Completo de Paciente</h2>
                        
                        <form onSubmit={handleSubmit}>
                            {/* 1. IDENTIFICAÇÃO BÁSICA */}
                            <h5 className="border-bottom pb-2 mb-3 text-muted">Identificação</h5>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">Tutor Responsável</label>
                                    <select className="form-select" name="proprietario" required onChange={handleChange} value={formData.proprietario}>
                                        <option value="">Selecione...</option>
                                        {proprietarios.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3 text-center">
                                    <label className="form-label d-block fw-bold">Foto de Perfil</label>
                                    <div className="d-inline-block position-relative">
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="rounded-circle border" style={{width: 100, height: 100, objectFit: 'cover'}} />
                                        ) : (
                                            <div className="bg-light rounded-circle border d-flex align-items-center justify-content-center" style={{width: 100, height: 100}}>
                                                <FaCamera className="text-muted" size={30} />
                                            </div>
                                        )}
                                        <input type="file" className="position-absolute top-0 start-0 opacity-0 w-100 h-100" style={{cursor: 'pointer'}} accept="image/*" onChange={handleFileChange} />
                                    </div>
                                    <small className="d-block text-muted">Clique para enviar</small>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Nome</label>
                                    <input type="text" className="form-control" name="nome" required onChange={handleChange} />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Raça</label>
                                    <input type="text" className="form-control" name="raca" onChange={handleChange} placeholder="Ex: SRD, Poodle..." />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Sexo</label>
                                    <select className="form-select" name="sexo" onChange={handleChange}>
                                        <option value="M">Macho</option>
                                        <option value="F">Fêmea</option>
                                    </select>
                                </div>
                            </div>

                            {/* 2. CARACTERÍSTICAS FÍSICAS */}
                            <h5 className="border-bottom pb-2 mb-3 mt-3 text-muted">Características Físicas</h5>
                            <div className="row bg-light p-3 rounded mb-3 mx-1">
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Idade (Anos)</label>
                                    <input type="number" className="form-control" name="idade_anos" value={formData.idade_anos} onChange={handleChange} min="0" />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Idade (Meses)</label>
                                    <input type="number" className="form-control" name="idade_meses" value={formData.idade_meses} onChange={handleChange} min="0" max="11" />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Pelagem (Tam.)</label>
                                    <select className="form-select" name="pelagem_tamanho" onChange={handleChange}>
                                        <option value="CURTO">Curto</option>
                                        <option value="MEDIO">Médio</option>
                                        <option value="LONGO">Longo</option>
                                    </select>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Cor da Pelagem</label>
                                    <input type="text" className="form-control" name="pelagem_cor" onChange={handleChange} placeholder="Ex: Caramelo, Preto..." />
                                </div>
                            </div>

                            {/* 3. CONTROLE VACINAL */}
                            <h5 className="border-bottom pb-2 mb-3 mt-3 text-muted"><FaSyringe /> Vacinação (Leishmaniose)</h5>
                            <div className="row mx-1">
                                {/* DOSE 1 */}
                                <div className="col-md-4 p-3 border rounded bg-white">
                                    <div className="form-check form-switch mb-2">
                                        <input className="form-check-input" type="checkbox" name="tomou_dose_1" checked={formData.tomou_dose_1} onChange={handleChange} />
                                        <label className="form-check-label fw-bold text-success">1ª Dose</label>
                                    </div>
                                    <input type="date" className="form-control" name="data_dose_1" disabled={!formData.tomou_dose_1} value={formData.data_dose_1} onChange={handleChange} />
                                </div>
                                
                                {/* DOSE 2 */}
                                <div className="col-md-4 p-3 border rounded bg-white">
                                    <div className="form-check form-switch mb-2">
                                        <input className="form-check-input" type="checkbox" name="tomou_dose_2" checked={formData.tomou_dose_2} onChange={handleChange} />
                                        <label className="form-check-label fw-bold text-success">2ª Dose</label>
                                    </div>
                                    <input type="date" className="form-control" name="data_dose_2" disabled={!formData.tomou_dose_2} value={formData.data_dose_2} onChange={handleChange} />
                                </div>

                                {/* DOSE 3 */}
                                <div className="col-md-4 p-3 border rounded bg-white">
                                    <div className="form-check form-switch mb-2">
                                        <input className="form-check-input" type="checkbox" name="tomou_dose_3" checked={formData.tomou_dose_3} onChange={handleChange} />
                                        <label className="form-check-label fw-bold text-primary">3ª Dose (Reforço)</label>
                                    </div>
                                    <input type="date" className="form-control" name="data_dose_3" disabled={!formData.tomou_dose_3} value={formData.data_dose_3} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="d-grid gap-2 mt-5">
                                <button type="submit" className="btn btn-success btn-lg shadow">
                                    <FaSave /> Salvar Ficha Completa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CadastroPet;