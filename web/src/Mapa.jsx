import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout'; 

// Ícones Premium
import { MapPin, Flame, AlertTriangle, Layers, Filter, User, Dog, Syringe, FileText, Loader2, X, Settings2 } from 'lucide-react';

// --- CORREÇÃO DE ÍCONES PADRÃO DO LEAFLET ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONFIGURAÇÃO GEOGRÁFICA ---
const limitesFortaleza = [ [-4.0500, -38.9000], [-3.6500, -38.2000] ];

const getFotoUrl = (fotoPath) => {
    if (!fotoPath) return null;
    if (fotoPath.startsWith('http')) return fotoPath;
    return `https://lvcvetsusfull.onrender.com${fotoPath}`;
};

// --- MARCADOR CUSTOMIZADO PREMIUM ---
const createPetIcon = (fotoUrl, status) => {
    let corBorda = '#64748b'; 
    if (status === 'POSITIVO') corBorda = '#ef4444'; 
    if (status === 'NEGATIVO') corBorda = '#10b981'; 
    if (status === 'EM_TRATAMENTO') corBorda = '#3b82f6'; 
    if (status === 'SUSPEITO') corBorda = '#f59e0b'; 
    if (status === 'OBITO') corBorda = '#0f172a'; 

    const urlCorrigida = getFotoUrl(fotoUrl);
    
    // SVG minimalista para substituir o emoji
    const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${corBorda}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.969-1.45 2.312-2.5"/><path d="M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.969-1.45-2.312-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>`;

    const imagemHtml = urlCorrigida 
        ? `<img src="${urlCorrigida}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8fafc;">${svgFallback}</div>`;

    return L.divIcon({
        className: 'custom-pet-icon',
        html: `
            <div style="width: 48px; height: 48px; background: white; border-radius: 50%; border: 3px solid ${corBorda}; box-shadow: 0 4px 10px rgba(0,0,0,0.3); overflow: hidden; position: relative; z-index: 10;">
                ${imagemHtml}
            </div>
            <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid ${corBorda}; z-index: 5;"></div>
        `,
        iconSize: [48, 58],
        iconAnchor: [24, 58],
        popupAnchor: [0, -60]
    });
};

const HeatmapLayer = ({ pontos, gradiente }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || pontos.length === 0) return;
        const heatLayer = L.heatLayer(pontos, {
            radius: 35, blur: 20, maxZoom: 15, max: 1.0, gradient: gradiente
        }).addTo(map);
        return () => { map.removeLayer(heatLayer); };
    }, [map, pontos, gradiente]);
    return null;
};

// 🏥 COMPONENTE PRINCIPAL
const Mapa = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [proprietarios, setProprietarios] = useState([]);
    
    const [abaWidget, setAbaWidget] = useState('camadas');
    const [modoMapa, setModoMapa] = useState('CAES'); 
    
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroColeira, setFiltroColeira] = useState('TODOS');
    const [filtroVacina, setFiltroVacina] = useState('TODOS');

    // Estado inteligente para Mobile
    const [isWidgetOpen, setIsWidgetOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth > 768) setIsWidgetOpen(true); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
            .then(response => {
                setProprietarios(response.data.results || response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao carregar mapa:", error);
                setLoading(false);
            });
    }, []);

    const irParaProntuario = (petId) => navigate('/clinica', { state: { selectedPetId: petId } });

    // 🧠 MOTOR DE FILTRAGEM
    const proprietariosFiltrados = proprietarios.map(prop => {
        if (!prop.pets) return null;
        const petsFiltrados = prop.pets.filter(pet => {
            if (filtroStatus !== 'TODOS' && pet.status !== filtroStatus) return false;
            
            const usaColeira = pet.visitas?.some(v => v.usa_coleira);
            if (filtroColeira === 'COM_COLEIRA' && !usaColeira) return false;
            if (filtroColeira === 'SEM_COLEIRA' && usaColeira) return false;

            if (filtroVacina === 'IMUNIZADO' && !pet.tomou_dose_3) return false;
            if (filtroVacina === 'PENDENTE' && pet.tomou_dose_3) return false;
            return true;
        });
        if (petsFiltrados.length === 0) return null;
        return { ...prop, pets: petsFiltrados };
    }).filter(Boolean);

    // 🔥 PROCESSAMENTO DE CALOR
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
            if (isDoenteOuSuspeito && !usaColeira) isVulneravel = true;
        });

        if (temPositivo) pontosPositivos.push([parseFloat(prop.latitude), parseFloat(prop.longitude), 0.8]);
        if (isVulneravel) pontosRisco.push([parseFloat(prop.latitude), parseFloat(prop.longitude), 1.0]);
    });

    const isDarkMap = modoMapa !== 'CAES';
    const gradienteCalor = { 0.4: '#3b82f6', 0.65: '#10b981', 1.0: '#ef4444' }; 
    const gradienteRisco = { 0.4: '#fcd34d', 0.65: '#f97316', 1.0: '#7e22ce' }; 

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center h-100" style={{ backgroundColor: '#f1f5f9' }}>
                    <Loader2 size={48} className="text-primary mb-3 spin-animation" />
                    <h6 className="text-primary fw-bolder mb-0" style={{ letterSpacing: '1px' }}>RENDERIZANDO SATÉLITE...</h6>
                </div>
                <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
                
                {/* 📱 BOTÃO MOBILE (Abre o Widget) */}
                {!isWidgetOpen && (
                    <button 
                        className="btn btn-primary shadow-lg position-absolute rounded-pill fw-bold d-flex align-items-center gap-2 fade-in"
                        style={{ bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, padding: '12px 24px' }}
                        onClick={() => setIsWidgetOpen(true)}
                    >
                        <Settings2 size={18} /> Filtros do Mapa
                    </button>
                )}

                {/* 🎛️ WIDGET MESTRE (Inteligente e Responsivo) */}
                <div className={`position-absolute shadow-lg rounded-4 bg-white d-flex flex-column transition-all ${isWidgetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                     style={{ 
                         top: window.innerWidth > 768 ? '20px' : 'auto', 
                         bottom: window.innerWidth > 768 ? 'auto' : '20px',
                         right: window.innerWidth > 768 ? '20px' : '50%', 
                         transform: window.innerWidth > 768 ? 'none' : 'translateX(50%)',
                         zIndex: 1000, 
                         width: '90%', 
                         maxWidth: '340px', 
                         border: '1px solid #e2e8f0', 
                         overflow: 'hidden', 
                         maxHeight: window.innerWidth > 768 ? '90vh' : '75vh'
                     }}>
                    
                    <div className="d-flex bg-light border-bottom position-relative">
                        {/* Botão Fechar (Mobile) */}
                        <button className="d-md-none btn btn-link text-muted position-absolute top-0 end-0 p-2 z-3" onClick={() => setIsWidgetOpen(false)}><X size={20}/></button>

                        <button 
                            className={`flex-fill py-3 border-0 fw-bold d-flex align-items-center justify-content-center gap-2 ${abaWidget === 'camadas' ? 'bg-white text-primary border-bottom border-primary' : 'bg-transparent text-muted'}`}
                            style={{ borderBottomWidth: abaWidget === 'camadas' ? '3px' : '0' }}
                            onClick={() => setAbaWidget('camadas')}
                        >
                            <Layers size={16}/> Camadas
                        </button>
                        <button 
                            className={`flex-fill py-3 border-0 fw-bold d-flex align-items-center justify-content-center gap-2 ${abaWidget === 'filtros' ? 'bg-white text-primary border-bottom border-primary' : 'bg-transparent text-muted'}`}
                            style={{ borderBottomWidth: abaWidget === 'filtros' ? '3px' : '0' }}
                            onClick={() => setAbaWidget('filtros')}
                        >
                            <Filter size={16}/> Filtros
                        </button>
                    </div>
                    
                    <div className="p-3 overflow-auto custom-scrollbar" style={{ flexGrow: 1 }}>
                        
                        {abaWidget === 'camadas' && (
                            <div className="fade-in">
                                <p className="small text-muted mb-3 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Modo de Visualização</p>
                                
                                <button onClick={() => setModoMapa('CAES')} className={`btn w-100 text-start p-3 mb-2 rounded-4 d-flex align-items-center gap-3 border-0 transition-hover ${modoMapa === 'CAES' ? 'bg-primary bg-opacity-10 text-primary fw-bold shadow-sm' : 'bg-light text-muted'}`}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'CAES' ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}><MapPin size={20}/></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Focos Individuais</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Visualização por pet</small>
                                    </div>
                                </button>

                                <button onClick={() => setModoMapa('CALOR')} className={`btn w-100 text-start p-3 mb-2 rounded-4 d-flex align-items-center gap-3 border-0 transition-hover ${modoMapa === 'CALOR' ? 'bg-danger bg-opacity-10 text-danger fw-bold shadow-sm' : 'bg-light text-muted'}`}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'CALOR' ? 'bg-danger text-white' : 'bg-white shadow-sm'}`}><Flame size={20}/></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Densidade Epidemiológica</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Calor de contágio</small>
                                    </div>
                                </button>

                                <button onClick={() => setModoMapa('RISCO')} className={`btn w-100 text-start p-3 rounded-4 d-flex align-items-center gap-3 border-0 transition-hover ${modoMapa === 'RISCO' ? 'bg-warning bg-opacity-10 text-dark fw-bold shadow-sm' : 'bg-light text-muted'}`}>
                                    <div className={`p-2 rounded-circle ${modoMapa === 'RISCO' ? 'bg-warning text-dark' : 'bg-white shadow-sm'}`}><AlertTriangle size={20}/></div>
                                    <div>
                                        <span className="d-block" style={{ fontSize: '0.9rem' }}>Zonas de Vulnerabilidade</span>
                                        <small className="fw-normal" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Risco por falta de proteção</small>
                                    </div>
                                </button>
                            </div>
                        )}

                        {abaWidget === 'filtros' && (
                            <div className="fade-in">
                                <p className="small text-muted mb-3 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Critérios de Filtragem</p>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Status do Paciente</label>
                                    <select className="form-select bg-light border-0 shadow-sm fw-medium" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                        <option value="TODOS">Todos os Status</option>
                                        <option value="POSITIVO">🔴 Apenas Positivos</option>
                                        <option value="SUSPEITO">🟠 Suspeitos</option>
                                        <option value="NEGATIVO">🟢 Negativos</option>
                                        <option value="EM_TRATAMENTO">🔵 Em Tratamento</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Proteção Vetorial</label>
                                    <select className="form-select bg-light border-0 shadow-sm fw-medium" value={filtroColeira} onChange={(e) => setFiltroColeira(e.target.value)}>
                                        <option value="TODOS">Qualquer situação</option>
                                        <option value="COM_COLEIRA">✅ Com Coleira Ativa</option>
                                        <option value="SEM_COLEIRA">❌ Sem Coleira (Vulneráveis)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark mb-1">Situação Vacinal (V3)</label>
                                    <select className="form-select bg-light border-0 shadow-sm fw-medium" value={filtroVacina} onChange={(e) => setFiltroVacina(e.target.value)}>
                                        <option value="TODOS">Qualquer situação</option>
                                        <option value="IMUNIZADO">🛡️ Imunizado (3 Doses)</option>
                                        <option value="PENDENTE">⚠️ Vacinação Pendente</option>
                                    </select>
                                </div>
                                
                                <button className="btn btn-light border text-secondary fw-bold btn-sm w-100 mt-2 transition-hover shadow-sm" 
                                        onClick={() => { setFiltroStatus('TODOS'); setFiltroColeira('TODOS'); setFiltroVacina('TODOS'); }}>
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-3 text-center text-white" style={{ backgroundColor: '#0f172a' }}>
                        <h6 className="m-0 fw-black d-flex justify-content-center align-items-center gap-2">
                            <Dog size={16} className="opacity-50"/> {totalCaesFiltrados} Cães no Mapa
                        </h6>
                        {modoMapa === 'CALOR' && <small className="d-block mt-1 text-danger fw-bold">{pontosPositivos.length} Zonas Quentes</small>}
                        {modoMapa === 'RISCO' && <small className="d-block mt-1 text-warning fw-bold">{pontosRisco.length} Zonas Iminentes</small>}
                    </div>
                </div>

                <MapContainer 
                    center={[-3.7319, -38.5267]} zoom={12} minZoom={11} maxZoom={18} 
                    maxBounds={limitesFortaleza} maxBoundsViscosity={1.0} 
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    zoomControl={window.innerWidth > 768} // Esconde botões de zoom no mobile para limpar a tela
                >
                    <TileLayer
                        url={isDarkMap ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {modoMapa === 'CAES' && proprietariosFiltrados.map(prop => {
                        if (!prop.latitude || !prop.longitude) return null;
                        return (
                            <React.Fragment key={prop.id}>
                                {prop.pets.map((pet) => (
                                    <Marker 
                                        key={pet.id}
                                        position={[parseFloat(prop.latitude) + (Math.random() * 0.0003 - 0.00015), parseFloat(prop.longitude) + (Math.random() * 0.0003 - 0.00015)]}
                                        icon={createPetIcon(pet.foto, pet.status)}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="text-center" style={{ width: '220px', padding: '5px' }}>
                                                {pet.foto ? (
                                                    <img src={getFotoUrl(pet.foto)} alt={pet.nome} className="shadow-sm mb-2" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f1f5f9' }} />
                                                ) : <div className="mx-auto mb-2 bg-light rounded-circle d-flex align-items-center justify-content-center border shadow-sm" style={{width: '80px', height: '80px'}}><Dog size={30} className="text-muted"/></div>}
                                                
                                                <h5 className="fw-black text-dark mb-1" style={{ fontSize: '1.1rem' }}>{pet.nome.toUpperCase()}</h5>
                                                
                                                <span className={`badge border shadow-sm px-3 py-1 mt-1 ${pet.status === 'POSITIVO' ? 'bg-danger text-white border-danger' : pet.status === 'SUSPEITO' ? 'bg-warning-subtle text-warning border-warning' : pet.status === 'NEGATIVO' ? 'bg-success text-white border-success' : 'bg-secondary text-white'}`} style={{ fontSize: '0.7rem' }}>
                                                    {pet.status}
                                                </span>
                                                
                                                <hr className="my-3 opacity-25" />
                                                
                                                <div className="text-start small text-muted mb-3 fw-medium lh-lg">
                                                    <div className="text-truncate d-flex align-items-center gap-2"><User size={14} className="text-primary"/> <span className="fw-bold text-dark">{prop.nome}</span></div>
                                                    <div className="text-truncate d-flex align-items-center gap-2"><Dog size={14} className="text-primary"/> {pet.raca || 'SRD'}</div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Syringe size={14} className={pet.tomou_dose_3 ? 'text-success' : 'text-danger'}/> 
                                                        <span className={pet.tomou_dose_3 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{pet.tomou_dose_3 ? 'Imunizado (V3)' : 'Vacinação Pendente'}</span>
                                                    </div>
                                                </div>

                                                <button onClick={() => irParaProntuario(pet.id)} className="btn btn-primary w-100 shadow-sm rounded-3 fw-bold py-2 d-flex justify-content-center align-items-center gap-2 transition-hover">
                                                    <FileText size={16} /> Abrir Prontuário
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {modoMapa === 'CALOR' && <HeatmapLayer pontos={pontosPositivos} gradiente={gradienteCalor} />}
                    {modoMapa === 'RISCO' && <HeatmapLayer pontos={pontosRisco} gradiente={gradienteRisco} />}
                </MapContainer>
            </div>

            <style>
                {`
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-2px); opacity: 0.9; }
                .pointer-events-none { pointer-events: none; }
                .opacity-0 { opacity: 0; }
                .opacity-100 { opacity: 1; }
                .fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Estilização Premium do Popup do Leaflet */
                .leaflet-popup-content-wrapper { border-radius: 16px !important; padding: 5px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2) !important; border: 1px solid #f1f5f9; }
                .leaflet-popup-tip { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2) !important; }
                .leaflet-container { font-family: 'Inter', sans-serif !important; }
                `}
            </style>
        </Layout>
    );
};

export default Mapa;