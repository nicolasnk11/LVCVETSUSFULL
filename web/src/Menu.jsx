import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaDog, FaPlus, FaSearch, FaSpinner, FaSyringe, FaExclamationTriangle, FaStethoscope, FaEdit } from 'react-icons/fa'; // <--- Adicionei FaEdit

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
        const dados = Array.isArray(response.data) ? response.data.reverse() : []; 
        setProprietarios(dados);
        
        let countPositivos = 0;
        let countTratamentos = 0;
        let countPets = 0;
        dados.forEach(dado => {
            const pets = dado.pets || []; 
            countPets += pets.length;
            countPositivos += pets.filter(p => p.status === 'POSITIVO').length;
            countTratamentos += pets.filter(p => p.status === 'EM_TRATAMENTO').length;
        });
        setStats({ totalPets: countPets, positivos: countPositivos, tratamentos: countTratamentos });
        setLoading(false);
      })
      .catch(error => { console.error("Erro:", error); setLoading(false); });
  }

  const irParaProntuario = (petId) => {
      navigate('/clinica', { state: { selectedPetId: petId } });
  };

  // --- NOVA FUNÇÃO: IR PARA EDIÇÃO ---
  const editarTutor = (tutor) => {
      navigate('/cadastro', { state: { tutorParaEditar: tutor } });
  };

  const dadosFiltrados = proprietarios.filter(prop => 
      prop.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div><h2 className="fw-bold m-0" style={{color: '#0f172a'}}>Visão Geral</h2><p className="text-muted mt-1">Painel de controle em tempo real.</p></div>
        <div className="d-flex gap-3 align-items-center">
            <div className="bg-white rounded-3 px-3 py-2 d-flex align-items-center shadow-sm border" style={{width: 300}}><FaSearch className="text-muted me-2"/><input type="text" placeholder="Buscar..." style={{border:'none', outline:'none', width:'100%'}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <button className="btn-modern text-white shadow-sm" onClick={() => navigate('/clinica')} style={{background: '#198754', border: '1px solid #198754'}}><FaStethoscope /> Prontuário</button>
            <button className="btn-modern bg-white text-primary border border-primary" onClick={() => navigate('/cadastro-pet')}><FaDog /> Novo Pet</button>
            <button className="btn-modern" onClick={() => navigate('/cadastro')}><FaPlus /> Novo Tutor</button>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4"><div className="card-premium"><div className="d-flex justify-content-between align-items-start mb-4"><div className="p-3 rounded-3" style={{background: '#e0f2fe', color: '#0284c7'}}><FaDog size={24}/></div><span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">{proprietarios.length} Tutores</span></div><h1 className="fw-bold mb-1">{loading ? <FaSpinner className="fa-spin"/> : stats.totalPets}</h1><p className="text-muted small fw-bold text-uppercase ls-1">Pets Monitorados</p></div></div>
        <div className="col-md-4"><div className="card-premium"><div className="d-flex justify-content-between align-items-start mb-4"><div className="p-3 rounded-3" style={{background: '#fef3c7', color: '#d97706'}}><FaExclamationTriangle size={24}/></div><span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3">Atenção</span></div><h1 className="fw-bold mb-1 text-warning">{loading ? <FaSpinner className="fa-spin"/> : stats.positivos}</h1><p className="text-muted small fw-bold text-uppercase ls-1">Casos Positivos</p></div></div>
        <div className="col-md-4"><div className="card-premium"><div className="d-flex justify-content-between align-items-start mb-4"><div className="p-3 rounded-3" style={{background: '#dcfce7', color: '#16a34a'}}><FaSyringe size={24}/></div><span className="text-muted small">Ativos</span></div><h1 className="fw-bold mb-1 text-success">{loading ? <FaSpinner className="fa-spin"/> : stats.tratamentos}</h1><p className="text-muted small fw-bold text-uppercase ls-1">Em Tratamento</p></div></div>
      </div>

      <div className="card-premium p-4">
        <div className="d-flex justify-content-between align-items-center mb-4"><h5 className="fw-bold m-0">Últimos Cadastros</h5>{searchTerm && <span className="badge bg-info text-white">Filtrando por: "{searchTerm}"</span>}</div>
        <div className="table-responsive">
            <table className="table table-modern w-100">
                <thead><tr><th className="ps-3">Tutor / Pets</th><th>Endereço</th><th>Telefone</th><th>Ação</th></tr></thead>
                <tbody>
                    {loading ? (<tr><td colSpan="4" className="text-center py-4">Carregando dados...</td></tr>) : dadosFiltrados.slice(0, 10).map((prop) => (
                        <tr key={prop.id}>
                            <td className="ps-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary" style={{width:40, height:40}}>{prop.nome.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div className="fw-bold text-dark">{prop.nome}</div>
                                        <small className="text-muted">
                                            {prop.pets && prop.pets.length > 0 ? (
                                                <div className="d-flex gap-1 mt-1 flex-wrap">
                                                    {prop.pets.map(p => (
                                                        <span key={p.id} className={`badge ${p.status === 'POSITIVO' ? 'bg-danger' : 'bg-secondary'} pointer`} style={{cursor:'pointer'}} onClick={() => irParaProntuario(p.id)} title="Ver prontuário">
                                                            {p.nome}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : "Nenhum pet"}
                                        </small>
                                    </div>
                                </div>
                            </td>
                            <td className="text-muted text-truncate" style={{maxWidth: '200px'}}>{prop.endereco}</td>
                            <td><span className="badge bg-light text-dark border px-2 py-1">{prop.telefone}</span></td>
                            <td>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => editarTutor(prop)} title="Editar Tutor">
                                        <FaEdit />
                                    </button>
                                    <button className="btn btn-sm btn-outline-success fw-bold" onClick={() => navigate('/clinica')}>
                                        <FaStethoscope /> Prontuário
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </Layout>
  );
};

export default Menu;