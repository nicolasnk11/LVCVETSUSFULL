import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaNotesMedical, FaSyringe, FaUser, FaDog, FaFireAlt, FaMapMarkerAlt, FaExclamationTriangle, FaLayerGroup, FaFilter } from 'react-icons/fa';
import Layout from './Layout'; 

// --- ÍCONES PADRÃO DO LEAFLET ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONFIGURAÇÃO DE LIMITES GEOGRÁFICOS ---
const limitesFortaleza = [
    [-4.0500, -38.9000], 
    [-3.6500, -38.2000]  
];

const getFotoUrl = (fotoPath) => {
    if (!fotoPath) return null;
    if (fotoPath.startsWith('http')) return fotoPath;
    return `https://lvcvetsusfull.onrender.com${fotoPath}`;
};

const createPetIcon = (fotoUrl, status) => {
    let corBorda = '#6c757d'; 
    if (status === 'POSITIVO') corBorda = '#ef4444'; 
    if (status === 'NEGATIVO') corBorda = '#10b981'; 
    if (status === 'EM_TRATAMENTO') corBorda = '#3b82f6'; 
    if (status === 'SUSPEITO') corBorda = '#f59e0b'; 
    if (status === 'OBITO') corBorda = '#1e293b'; 

    const urlCorrigida = getFotoUrl(fotoUrl);

    const imagemHtml = urlCorrigida 
        ? `<img src="${urlCorrigida}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 24px;">🐕</div>`;

    return L.divIcon({
        className: 'custom-pet-icon',
        html: `
            <div style="
                width: 50px; height: 50px; background: white; border-radius: 50%; 
                border: 3px solid ${corBorda}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
                overflow: hidden; position: relative; z-index: 10;
            ">
                ${imagemHtml}
            </div>
            <div style="
                position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); 
                width: 0; height: 0; border-left: 6px solid transparent; 
                border-right: 6px solid transparent; border-top: 8px solid ${corBorda}; z-index: 5;
            "></div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 60],
        popupAnchor: [0, -65]
    });
};

const HeatmapLayer = ({ pontos, gradiente }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || pontos.length === 0) return;
        const heatLayer = L.heatLayer(pontos, {
            radius: 40, 
            blur: 25, 
            maxZoom: 15, 
            max: 1.0,
            gradient: gradiente
        }).addTo(map);

        return () => { map.removeLayer(heatLayer); };
    }, [map, pontos, gradiente]);
    return null;
};

const Mapa = () => {
    const navigate = useNavigate();
    const [proprietarios, setProprietarios] = useState([]);
    
    // --- ESTADOS DO WIDGET ---
    const [abaWidget, setAbaWidget] = useState('camadas'); // 'camadas' ou 'filtros'
    const [modoMapa, setModoMapa] = useState('CAES'); // 'CAES', 'CALOR', 'RISCO'
    
    // --- ESTADOS DE FILTRAGEM EPIDEMIOLÓGICA ---
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroColeira, setFiltroColeira] = useState('TODOS');
    const [filtroVacina, setFiltroVacina] = useState('TODOS');

    useEffect(() => {
        axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
            .then(response => setProprietarios(response.data))
            .catch(error => console.error("Erro ao carregar mapa:", error));
    }, []);

    const irParaProntuario = (petId) => {
        navigate('/clinica', { state: { selectedPetId: petId } });
    };

    // ==========================================
    // 🧠 MOTOR DE FILTRAGEM DE DADOS (NOVO)
    // ==========================================
    const proprietariosFiltrados = proprietarios.map(prop => {
        if (!prop.pets) return null;
        
        // Filtra os pets deste proprietário com base nos filtros selecionados
        const petsFiltrados = prop.pets.filter(pet => {
            // 1. Filtro de Status
            if (filtroStatus !== 'TODOS' && pet.status !== filtroStatus) return false;
            
            // 2. Filtro de Coleira Repelente
            const usaColeira = pet.visitas?.some(v => v.usa_coleira);
            if (filtroColeira === 'COM_COLEIRA' && !usaColeira) return false;
            if (filtroColeira === 'SEM_COLEIRA' && usaColeira) return false;

            // 3. Filtro de Vacinação (Dose 3)
            if (filtroVacina === 'IMUNIZADO' && !pet.tomou_dose_3) return false;
            if (filtroVacina === 'PENDENTE' && pet.tomou_dose_3) return false;

            return true;
        });

        // Se não sobrou nenhum pet para este tutor após o filtro, não retorna o tutor
        if (petsFiltrados.length === 0) return null;
        
        return { ...prop, pets: petsFiltrados };
    }).filter(Boolean); // Remove os nulls

    // ==========================================
    // 🔥 PROCESSAMENTO DE CALOR E RISCO (BASEADO NOS FILTROS)
    // ==========================================
    const pontosPositivos = [];
    const pontosRisco = [];
    let totalCaesFiltrados = 0;

    proprietariosFiltrados.forEach(prop => {
        if (!prop.latitude || !prop.longitude) return;

        let temPositivo = false;
        let isVulneravel = false;

        prop.pets.forEach(pet => {
            totalCaesFiltrados++;
            if (pet.status === 'POSITIVO') temPositivo = true;

            const isDoenteOuSuspeito = pet.status === 'POSITIVO' || pet.status === 'SUSPEITO';
            const usaColeira = pet.visitas?.some(v => v.usa_coleira);
            if (isDoenteOuSuspeito && !usaColeira) {
                isVulneravel = true;
            }
        });

        if (temPositivo) pontosPositivos.push([parseFloat(prop.latitude), parseFloat(prop.longitude), 0.8]);
        if (isVulneravel) pontosRisco.push([parseFloat(prop.latitude), parseFloat(prop.longitude), 1.0]);
    });

    const isDarkMap = modoMapa !== 'CAES';
    const gradienteCalor = { 0.4: '#3b82f6', 0.65: '#10b981', 1.0: '#ef4444' }; 
    const gradienteRisco = { 0.4: '#fcd34d', 0.65: '#f97316', 1.0: '#7e22ce' }; 

    return (
        <Layout>
            <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
                
                {/* WIDGET MESTRE (CAMADAS & FILTROS) */}
                <div className="position-absolute shadow-lg rounded-4 bg-white d-flex flex-column" 
                     style={{ top: '20px', right: '20px', zIndex: 1000, width: '320px', border: '1px solid #e2e8f0', overflow: 'hidden', maxHeight: '90vh' }}>
                    
                    {/* Cabeçalho de Abas do Widget */}
                    <div className="d-flex bg-light border-bottom">
                        <button 
                            className={`flex-fill py-3 border-0 fw-bold d-flex align-items-center justify-content-center gap-2 ${abaWidget === 'camadas' ? 'bg-white text-primary border-bottom border-primary' : 'bg-transparent text-muted'}`}
                            style={{ borderBottomWidth: abaWidget === 'camadas' ? '3px' : '0' }}
                            onClick={() => setAbaWidget('camadas')}
                        >
                            <FaLayerGroup /> Camadas
                        </button>
                        <button 
                            className={`flex-fill py-3 border-0 fw-bold d-flex align-items-center justify-content-center gap-2 ${abaWidget === 'filtros' ? 'bg-white text-primary border-bottom border-primary' : 'bg-transparent text-muted'}`}
                            style={{ borderBottomWidth: abaWidget === 'filtros' ? '3px' : '0' }}
                            onClick={() => setAbaWidget('filtros')}
                        >
                            <FaFilter /> Filtros
                        </button>
                    </div>
                    
                    {/* Corpo do Widget */}
                    <div className="p-3 overflow-auto" style={{ flexGrow: 1 }}>
                        
                        {/* ABA: CAMADAS */}
                        {abaWidget === 'camadas' && (
                            <div className="fade-in">
                                <p className="small text-muted mb-3 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Modo de Visualização</p>
                                <button onClick={() => setModoMapa('CAES')} className={`btn w-100 text-start p-3 mb-2 rounded-3 d-flex align-items-center gap-3 border-0 ${modoMapa === 'CAES' ? 'bg-primary bg-opacity-10 text-primary fw-bold shadow-sm' : 'bg-light text-muted'}`} style={{ transition: 'all 0.2s' }}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'CAES' ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}><FaMapMarkerAlt /></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Focos Individuais</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Visualização por pet</small>
                                    </div>
                                </button>

                                <button onClick={() => setModoMapa('CALOR')} className={`btn w-100 text-start p-3 mb-2 rounded-3 d-flex align-items-center gap-3 border-0 ${modoMapa === 'CALOR' ? 'bg-danger bg-opacity-10 text-danger fw-bold shadow-sm' : 'bg-light text-muted'}`} style={{ transition: 'all 0.2s' }}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'CALOR' ? 'bg-danger text-white' : 'bg-white shadow-sm'}`}><FaFireAlt /></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Densidade Epidemiológica</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Calor de contágio</small>
                                    </div>
                                </button>

                                <button onClick={() => setModoMapa('RISCO')} className={`btn w-100 text-start p-3 rounded-3 d-flex align-items-center gap-3 border-0 ${modoMapa === 'RISCO' ? 'bg-warning bg-opacity-10 text-dark fw-bold shadow-sm' : 'bg-light text-muted'}`} style={{ transition: 'all 0.2s' }}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'RISCO' ? 'bg-warning text-dark' : 'bg-white shadow-sm'}`}><FaExclamationTriangle /></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Zonas de Vulnerabilidade</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Risco por falta de proteção</small>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* ABA: FILTROS EPIDEMIOLÓGICOS */}
                        {abaWidget === 'filtros' && (
                            <div className="fade-in">
                                <p className="small text-muted mb-3 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Critérios de Filtragem</p>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Status do Paciente</label>
                                    <select className="form-select bg-light border-0 shadow-sm" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                        <option value="TODOS">Todos os Status</option>
                                        <option value="POSITIVO">🔴 Apenas Positivos</option>
                                        <option value="SUSPEITO">🟠 Suspeitos</option>
                                        <option value="NEGATIVO">🟢 Negativos</option>
                                        <option value="EM_TRATAMENTO">🔵 Em Tratamento</option>
                                        <option value="OBITO">⚫ Óbitos</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Proteção Vetorial</label>
                                    <select className="form-select bg-light border-0 shadow-sm" value={filtroColeira} onChange={(e) => setFiltroColeira(e.target.value)}>
                                        <option value="TODOS">Qualquer situação</option>
                                        <option value="COM_COLEIRA">✅ Com Coleira Ativa</option>
                                        <option value="SEM_COLEIRA">❌ Sem Coleira (Vulneráveis)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Situação Vacinal (V3)</label>
                                    <select className="form-select bg-light border-0 shadow-sm" value={filtroVacina} onChange={(e) => setFiltroVacina(e.target.value)}>
                                        <option value="TODOS">Qualquer situação</option>
                                        <option value="IMUNIZADO">🛡️ Imunizado (3 Doses)</option>
                                        <option value="PENDENTE">⚠️ Vacinação Pendente</option>
                                    </select>
                                </div>
                                
                                <button className="btn btn-outline-secondary btn-sm w-100 mt-2" 
                                        onClick={() => { setFiltroStatus('TODOS'); setFiltroColeira('TODOS'); setFiltroVacina('TODOS'); }}>
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rodapé Dinâmico do Widget */}
                    <div className="p-3 text-center text-white" style={{ backgroundColor: '#0f172a' }}>
                        <h6 className="m-0 fw-bold d-flex justify-content-center align-items-center gap-2">
                            <FaDog className="opacity-50"/> {totalCaesFiltrados} Cães no Mapa
                        </h6>
                        {modoMapa === 'CALOR' && <small className="d-block mt-1 text-danger fw-bold">{pontosPositivos.length} Zonas Quentes</small>}
                        {modoMapa === 'RISCO' && <small className="d-block mt-1 text-warning fw-bold">{pontosRisco.length} Zonas Iminentes</small>}
                    </div>
                </div>

                <MapContainer 
                    center={[-3.7319, -38.5267]} 
                    zoom={13} 
                    minZoom={11} 
                    maxZoom={18} 
                    maxBounds={limitesFortaleza} 
                    maxBoundsViscosity={1.0} 
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                >
                    <TileLayer
                        url={isDarkMap 
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                        }
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {/* CAMADA 1: MARCADORES (Renderiza a partir do array FILTRADO) */}
                    {modoMapa === 'CAES' && proprietariosFiltrados.map(prop => {
                        if (!prop.latitude || !prop.longitude) return null;

                        return (
                            <React.Fragment key={prop.id}>
                                {prop.pets.map((pet) => (
                                    <Marker 
                                        key={pet.id}
                                        position={[
                                            parseFloat(prop.latitude) + (Math.random() * 0.0003 - 0.00015), 
                                            parseFloat(prop.longitude) + (Math.random() * 0.0003 - 0.00015)
                                        ]}
                                        icon={createPetIcon(pet.foto, pet.status)}
                                    >
                                        <Popup className="custom-popup border-0 shadow-lg rounded-4">
                                            <div style={{ textAlign: 'center', width: '220px', padding: '5px' }}>
                                                {pet.foto && (
                                                    <img 
                                                        src={getFotoUrl(pet.foto)} 
                                                        alt={pet.nome} 
                                                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '3px solid #f1f5f9' }} 
                                                    />
                                                )}
                                                <h5 style={{ margin: '0 0 5px 0', fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{pet.nome}</h5>
                                                
                                                <span className={`badge ${pet.status === 'POSITIVO' ? 'bg-danger' : pet.status === 'SUSPEITO' ? 'bg-warning text-dark' : pet.status === 'NEGATIVO' ? 'bg-success' : 'bg-secondary'}`} 
                                                      style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    {pet.status}
                                                </span>
                                                
                                                <hr style={{ margin: '15px 0', borderColor: '#e2e8f0' }} />
                                                
                                                <div style={{ textAlign: 'left', fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', lineHeight: '1.8' }}>
                                                    <div className="text-truncate" title={prop.nome}><FaUser className="me-2 text-primary"/> <span className="fw-bold text-dark">{prop.nome}</span></div>
                                                    <div className="text-truncate"><FaDog className="me-2 text-primary"/> {pet.raca || 'SRD'}</div>
                                                    <div>
                                                        <FaSyringe className={pet.tomou_dose_3 ? 'text-success me-2' : 'text-danger me-2'}/> 
                                                        {pet.tomou_dose_3 ? 'Imunizado (V3)' : 'Vacinação Pendente'}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => irParaProntuario(pet.id)} 
                                                    className="btn btn-primary w-100 shadow-sm"
                                                    style={{ borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px' }}
                                                >
                                                    <FaNotesMedical /> Abrir Prontuário
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {/* CAMADAS DE CALOR (Calculadas a partir do array FILTRADO) */}
                    {modoMapa === 'CALOR' && <HeatmapLayer pontos={pontosPositivos} gradiente={gradienteCalor} />}
                    {modoMapa === 'RISCO' && <HeatmapLayer pontos={pontosRisco} gradiente={gradienteRisco} />}
                    
                </MapContainer>
            </div>
        </Layout>
    );
};

export default Mapa;