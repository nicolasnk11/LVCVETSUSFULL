import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- Adicionei useLocation
import { FaUser, FaPhone, FaMapMarkerAlt, FaSave, FaArrowLeft, FaSearchLocation, FaEdit } from 'react-icons/fa';

const Cadastro = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Recebe os dados da edição
  
  const [loading, setLoading] = useState(false);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  
  // Verifica se estamos EDITANDO alguém
  const tutorParaEditar = location.state?.tutorParaEditar;
  const isEditing = !!tutorParaEditar;

  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    latitude: '',
    longitude: ''
  });

  // SE FOR EDIÇÃO: Preenche os campos assim que a tela abre
  useEffect(() => {
      if (isEditing) {
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

  // 1. Pega GPS do Dispositivo
  const pegarLocalizacao = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        alert("📍 GPS detectado! (Verifique se está preciso)");
      }, function(error) {
        alert("Erro no GPS: " + error.message);
      });
    } else {
      alert("Navegador sem suporte a GPS.");
    }
  };

  // 2. Busca Coordenadas pelo Texto do Endereço
  const buscarPeloEndereco = async () => {
      if (!formData.endereco) {
          alert("Digite o endereço primeiro!");
          return;
      }
      
      setBuscandoEndereco(true);
      try {
          const query = encodeURIComponent(formData.endereco + ", Fortaleza, Ceará");
          const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);

          if (response.data && response.data.length > 0) {
              const local = response.data[0];
              setFormData(prev => ({
                  ...prev,
                  latitude: local.lat,
                  longitude: local.lon
              }));
              alert(`📍 Endereço encontrado: ${local.display_name}`);
          } else {
              alert("❌ Endereço não encontrado no mapa. Tente digitar o Bairro.");
          }
      } catch (error) {
          console.error(error);
          alert("Erro ao buscar endereço.");
      } finally {
          setBuscandoEndereco(false);
      }
  };

  // 3. Salva no Django (CORRIGIDO E ADAPTADO PARA EDIÇÃO)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- CORREÇÃO DO PAYLOAD (FIM DO ERRO 400) ---
    // Enviamos JSON plano, não GeoJSON complexo
    const dadosParaEnviar = {
        nome: formData.nome,
        endereco: formData.endereco,
        telefone: formData.telefone,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
    };

    try {
      if (isEditing) {
          // SE FOR EDIÇÃO: Usa PATCH e o ID do tutor
          await axios.patch(`https://vetleish-api.onrender.com/api/proprietarios/${tutorParaEditar.id}/`, dadosParaEnviar);
          alert("✅ Dados atualizados com sucesso!");
      } else {
          // SE FOR NOVO: Usa POST
          await axios.post('https://vetleish-api.onrender.com/api/proprietarios/', dadosParaEnviar);
          alert("✅ Cadastro realizado com sucesso!");
      }
      navigate('/'); // Volta para o menu
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h2 className="fw-bold m-0" style={{color: '#0f172a'}}>
               {/* Título Dinâmico */}
               {isEditing ? <><FaEdit className="me-2"/>Editar Tutor</> : <><FaUser className="me-2"/>Novo Tutor</>}
           </h2>
           <p className="text-muted mt-1">
               {isEditing ? `Atualizando dados de ${tutorParaEditar.nome}` : "Preencha os dados e defina a localização."}
           </p>
        </div>
        <button onClick={() => navigate('/')} className="btn btn-light text-muted fw-bold shadow-sm">
           <FaArrowLeft className="me-2"/> Voltar
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
            <div className="card-premium p-4">
                <form onSubmit={handleSubmit}>
                    
                    <h5 className="fw-bold text-primary mb-4 pb-2 border-bottom">👤 Dados Pessoais</h5>
                    
                    <div className="mb-3">
                        <label className="form-label fw-bold text-muted small">NOME COMPLETO</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FaUser className="text-muted"/></span>
                            <input required name="nome" value={formData.nome} onChange={handleChange} type="text" className="form-control border-start-0 ps-0" placeholder="Nome do responsável"/>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold text-muted small">TELEFONE</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><FaPhone className="text-muted"/></span>
                                <input required name="telefone" value={formData.telefone} onChange={handleChange} type="tel" className="form-control border-start-0 ps-0" placeholder="(85) 9..." />
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold text-muted small">ENDEREÇO (Rua, Número, Bairro)</label>
                            <input required name="endereco" value={formData.endereco} onChange={handleChange} type="text" className="form-control" placeholder="Ex: Rua Jose Julio Feitosa, 290" />
                        </div>
                    </div>

                    <h5 className="fw-bold text-primary mb-4 mt-4 pb-2 border-bottom">📍 Localização Exata</h5>
                    
                    <div className="row align-items-end mb-4">
                        <div className="col-md-3 mb-2">
                             <label className="small fw-bold text-muted">Latitude</label>
                             <input readOnly value={formData.latitude} className="form-control bg-light text-primary fw-bold" placeholder="0.000" />
                        </div>
                        <div className="col-md-3 mb-2">
                             <label className="small fw-bold text-muted">Longitude</label>
                             <input readOnly value={formData.longitude} className="form-control bg-light text-primary fw-bold" placeholder="0.000" />
                        </div>
                        
                        {/* BOTÕES DE LOCALIZAÇÃO */}
                        <div className="col-md-3 mb-2">
                            <button type="button" onClick={buscarPeloEndereco} className="btn btn-outline-secondary w-100 fw-bold small shadow-sm" disabled={buscandoEndereco}>
                                <FaSearchLocation /> {buscandoEndereco ? "Buscando..." : "Pelo Endereço"}
                            </button>
                        </div>
                        <div className="col-md-3 mb-2">
                            <button type="button" onClick={pegarLocalizacao} className="btn btn-outline-primary w-100 fw-bold small shadow-sm">
                                <FaMapMarkerAlt /> Pelo GPS
                            </button>
                        </div>
                    </div>

                    <div className="d-grid gap-2 mt-5">
                        <button disabled={loading} type="submit" className="btn-modern justify-content-center py-3">
                            {loading ? "Salvando..." : (
                                isEditing ? <><FaSave /> Salvar Alterações</> : <><FaSave /> Confirmar Cadastro</>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cadastro;