import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaShieldAlt, FaDog, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

function ConsultaPublica() {
    const { id } = useParams(); // Pega o ID do cão na URL
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        // Busca os dados do cão no backend
        // Nota para a defesa: Numa aplicação real, esta rota do Django deve ser pública (ReadOnly)
        axios.get(`https://vetleish-api.onrender.com/api/pets/${id}/`)
            .then(res => {
                setPet(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setErro(true);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p className="text-muted fw-bold">A consultar base de dados do SUS...</p>
            </div>
        );
    }

    if (erro || !pet) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center p-4 text-center" style={{ minHeight: '100vh', backgroundColor: '#fef2f2' }}>
                <FaTimesCircle size={60} className="text-danger mb-3" />
                <h3 className="fw-bold text-danger">Registo Não Encontrado</h3>
                <p className="text-muted">Este QR Code é inválido ou o animal foi removido do sistema da Vigilância Epidemiológica.</p>
            </div>
        );
    }

    // Lógica de Cores e Ícones
    let corStatus = '#94a3b8';
    let IconeStatus = FaExclamationTriangle;
    
    if (pet.status === 'NEGATIVO') { corStatus = '#10b981'; IconeStatus = FaCheckCircle; }
    if (pet.status === 'POSITIVO') { corStatus = '#ef4444'; IconeStatus = FaTimesCircle; }
    if (pet.status === 'SUSPEITO') { corStatus = '#f59e0b'; IconeStatus = FaExclamationTriangle; }

    const fotoUrl = pet.foto ? (pet.foto.startsWith('http') ? pet.foto : `https://vetleish-api.onrender.com${pet.foto}`) : null;
    const usaColeira = pet.visitas?.some(v => v.usa_coleira);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '20px' }}>
            <div className="card border-0 shadow-lg mx-auto overflow-hidden" style={{ maxWidth: '400px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                
                {/* Cabeçalho Oficial */}
                <div className="p-3 text-white text-center" style={{ backgroundColor: '#0f172a' }}>
                    <FaShieldAlt size={30} className="text-primary mb-2" />
                    <h5 className="m-0 fw-bold" style={{ letterSpacing: '1px' }}>LVCVETSUS</h5>
                    <small style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Portal de Validação Sanitária</small>
                </div>

                <div className="card-body p-0 text-center">
                    {/* Faixa Superior com a Cor do Status */}
                    <div style={{ height: '8px', backgroundColor: corStatus, width: '100%' }}></div>

                    {/* Foto Circular */}
                    <div className="mt-4 mb-3 mx-auto" style={{ width: '120px', height: '120px', borderRadius: '50%', border: `4px solid ${corStatus}`, padding: '4px', backgroundColor: '#fff' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            {fotoUrl ? (
                                <img src={fotoUrl} alt={pet.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div className="w-100 h-100 d-flex justify-content-center align-items-center text-muted"><FaDog size={50} /></div>
                            )}
                        </div>
                    </div>

                    <h2 className="fw-bolder text-dark text-uppercase mb-0">{pet.nome}</h2>
                    <p className="text-muted small mb-3">{pet.raca || 'Sem Raça Definida'}</p>

                    {/* Bloco de Status Oficial */}
                    <div className="mx-4 mb-4 p-3 rounded-4" style={{ backgroundColor: `${corStatus}15`, border: `1px solid ${corStatus}40` }}>
                        <IconeStatus size={28} color={corStatus} className="mb-2" />
                        <h6 className="fw-bold mb-1" style={{ color: corStatus, textTransform: 'uppercase' }}>STATUS: {pet.status}</h6>
                        <small className="text-muted">Atestado pela Vigilância Epidemiológica</small>
                    </div>

                    {/* Informações Públicas Resumidas (LGPD Compliant) */}
                    <div className="text-start px-4 pb-4">
                        <div className="d-flex justify-content-between border-bottom py-2">
                            <span className="text-muted small fw-bold">ID do Sistema:</span>
                            <span className="fw-bold text-dark">#{pet.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom py-2">
                            <span className="text-muted small fw-bold">Prevenção Vetorial:</span>
                            <span className={usaColeira ? "fw-bold text-success" : "fw-bold text-danger"}>
                                {usaColeira ? '✅ Coleira Ativa' : '❌ Sem Proteção'}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                            <span className="text-muted small fw-bold">Vacinação V3:</span>
                            <span className={pet.tomou_dose_3 ? "fw-bold text-success" : "fw-bold text-warning"}>
                                {pet.tomou_dose_3 ? 'Imunizado' : 'Pendente'}
                            </span>
                        </div>
                    </div>

                </div>
                <div className="card-footer bg-light text-center py-3 border-0">
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>Informação oficial do sistema municipal de saúde.<br/>Lei Geral de Proteção de Dados (LGPD) aplicada.</small>
                </div>
            </div>
        </div>
    );
}

export default ConsultaPublica;