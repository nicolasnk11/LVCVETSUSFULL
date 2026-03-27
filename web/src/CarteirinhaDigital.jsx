import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaPrint, FaShieldAlt, FaDog } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';

function CarteirinhaDigital({ pet, proprietario }) {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Carteirinha_${pet?.nome}_LVCVETSUS`,
    });

    if (!pet) return null;

    // Ajusta a cor da borda baseada no status epidemiológico
    let corStatus = '#94a3b8'; // Padrão cinza
    if (pet.status === 'NEGATIVO') corStatus = '#10b981'; // Verde
    if (pet.status === 'POSITIVO') corStatus = '#ef4444'; // Vermelho
    if (pet.status === 'SUSPEITO') corStatus = '#f59e0b'; // Laranja

    
    const linkConsultaPublica = `${window.location.origin}/consulta/${pet.id}`;

    // Helper para foto
    const fotoUrl = pet.foto ? (pet.foto.startsWith('http') ? pet.foto : `https://lvcvetsusfull.onrender.com${pet.foto}`) : null;

    return (
        <div>
            {/* O Cartão (Escondido numa div, formatado perfeitamente para impressão) */}
            <div ref={componentRef} className="p-4" style={{ backgroundColor: '#f8fafc' }}>
                
                <div className="card border-0 shadow-lg mx-auto overflow-hidden" style={{ width: '400px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                    
                    {/* Cabeçalho do Cartão */}
                    <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0f172a' }}>
                        <div className="d-flex align-items-center gap-2">
                            <FaShieldAlt size={20} className="text-primary" />
                            <h6 className="m-0 fw-bold" style={{ letterSpacing: '1px' }}>LVCVETSUS</h6>
                        </div>
                        <span className="badge bg-light text-dark" style={{ fontSize: '0.65rem' }}>IDENTIFICAÇÃO VETORIAL</span>
                    </div>

                    <div className="card-body p-0">
                        {/* Faixa de Status (Verde, Vermelha, Laranja) */}
                        <div style={{ height: '8px', backgroundColor: corStatus, width: '100%' }}></div>

                        <div className="p-4 d-flex gap-3 align-items-center border-bottom">
                            {/* Foto do Pet */}
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: `4px solid ${corStatus}`, overflow: 'hidden', flexShrink: 0 }}>
                                {fotoUrl ? (
                                    <img src={fotoUrl} alt={pet.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="w-100 h-100 d-flex justify-content-center align-items-center bg-light text-muted"><FaDog size={40} /></div>
                                )}
                            </div>

                            {/* Dados do Pet */}
                            <div>
                                <h4 className="fw-bolder mb-0 text-dark" style={{ textTransform: 'uppercase' }}>{pet.nome}</h4>
                                <p className="mb-1 text-muted small">{pet.raca || 'Sem Raça Definida'}</p>
                                <span className="badge rounded-pill fw-bold" style={{ backgroundColor: `${corStatus}20`, color: corStatus, border: `1px solid ${corStatus}` }}>
                                    STATUS: {pet.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-light d-flex justify-content-between align-items-center">
                            {/* Informações do Tutor */}
                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                <p className="mb-1"><strong>TUTOR RESPON.:</strong><br/>{proprietario?.nome || 'N/A'}</p>
                                <p className="mb-1"><strong>PROTEÇÃO (COLEIRA):</strong><br/>{pet.visitas?.some(v => v.usa_coleira) ? '✅ Sim (Ativa)' : '❌ Não'}</p>
                                <p className="mb-0"><strong>ID DO SISTEMA:</strong><br/>#{pet.id.toString().padStart(6, '0')}</p>
                            </div>

                            {/* QR CODE MÁGICO */}
                            <div className="bg-white p-2 rounded-3 shadow-sm border">
                                <QRCodeSVG 
                                    value={linkConsultaPublica} 
                                    size={90} 
                                    bgColor={"#ffffff"} 
                                    fgColor={"#0f172a"} 
                                    level={"Q"} 
                                />
                                <div className="text-center mt-1" style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#64748b' }}>ESCANEIE AQUI</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão de Ação que ficará visível na tela */}
            <div className="text-center mt-3">
                <button 
                    onClick={handlePrint} 
                    className="btn btn-primary fw-bold rounded-pill px-4 py-2 shadow-sm d-flex align-items-center mx-auto gap-2"
                >
                    <FaPrint /> Imprimir Carteirinha do Pet
                </button>
                <p className="small text-muted mt-2">Gere a credencial para ser fixada na coleira ou guardada pelo tutor.</p>
            </div>
        </div>
    );
}

export default CarteirinhaDigital;