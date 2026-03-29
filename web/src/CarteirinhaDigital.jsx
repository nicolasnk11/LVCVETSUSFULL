import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ShieldCheck, Dog, User, ShieldAlert, Fingerprint, Check, X } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Limpa a repetição de linhas de informação
const InfoLinha = ({ icone: Icon, titulo, valor, destaque = false, corIcone = "text-muted" }) => (
    <div className="d-flex align-items-start gap-2 mb-2">
        <Icon size={14} className={`mt-1 flex-shrink-0 ${corIcone}`} />
        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.2' }}>
            <strong className="d-block" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{titulo}</strong>
            <span className={destaque ? "fw-bold text-dark" : "fw-medium"}>{valor}</span>
        </div>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
function CarteirinhaDigital({ pet, proprietario }) {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Documento_LVCVETSUS_${pet?.nome}`,
    });

    if (!pet) return null;

    // Lógica inteligente de status epidemiológico
    const getStatusConfig = () => {
        switch (pet.status) {
            case 'NEGATIVO': return { cor: '#10b981', label: 'NEGATIVO', bg: '#d1fae5' };
            case 'POSITIVO': return { cor: '#ef4444', label: 'POSITIVO', bg: '#fee2e2' };
            case 'SUSPEITO': return { cor: '#f59e0b', label: 'SUSPEITO', bg: '#fef3c7' };
            default: return { cor: '#94a3b8', label: 'INDEFINIDO', bg: '#f1f5f9' };
        }
    };
    const statusConfig = getStatusConfig();

    // Lógica corrigida: Avalia apenas a ÚLTIMA visita para proteção atual
    const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;
    const temColeiraAtiva = ultimaVisita ? ultimaVisita.usa_coleira : false;

    const linkConsultaPublica = `${window.location.origin}/consulta/${pet.id}`;
    const fotoUrl = pet.foto ? (pet.foto.startsWith('http') ? pet.foto : `https://lvcvetsusfull.onrender.com${pet.foto}`) : null;

    return (
        <div className="d-flex flex-column align-items-center">
            
            {/* 🪪 O CARTÃO (Área de Impressão Isolada) */}
            <div ref={componentRef} className="p-3 w-100 d-flex justify-content-center" style={{ backgroundColor: '#f8fafc' }}>
                
                <div className="card border-0 shadow-sm overflow-hidden bg-white print-card" style={{ maxWidth: '400px', width: '100%', borderRadius: '16px' }}>
                    
                    {/* Cabeçalho Oficial */}
                    <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0f172a' }}>
                        <div className="d-flex align-items-center gap-2">
                            <ShieldCheck size={22} className="text-primary" />
                            <h6 className="m-0 fw-bolder" style={{ letterSpacing: '1px' }}>LVCVETSUS</h6>
                        </div>
                        <span className="badge bg-white text-dark fw-bold border" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                            ID VETORIAL
                        </span>
                    </div>

                    <div className="card-body p-0">
                        {/* Faixa de Status Epidemiológico */}
                        <div style={{ height: '6px', backgroundColor: statusConfig.cor, width: '100%' }}></div>

                        {/* Corpo do Cartão: Foto e Nome */}
                        <div className="p-4 d-flex gap-3 align-items-center border-bottom bg-white">
                            <div className="shadow-sm d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: '85px', height: '85px', borderRadius: '50%', border: `3px solid ${statusConfig.cor}`, overflow: 'hidden', flexShrink: 0 }}>
                                {fotoUrl ? (
                                    <img src={fotoUrl} alt={pet.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                ) : null}
                                <Dog size={40} style={{ display: fotoUrl ? 'none' : 'block' }} />
                            </div>

                            <div>
                                <h4 className="fw-black mb-0 text-dark" style={{ textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{pet.nome}</h4>
                                <p className="mb-2 text-muted small fw-medium">{pet.raca || 'Sem Raça Definida'}</p>
                                <span className="badge rounded-pill fw-bold border" style={{ backgroundColor: statusConfig.bg, color: statusConfig.cor, borderColor: statusConfig.cor }}>
                                    STATUS: {statusConfig.label}
                                </span>
                            </div>
                        </div>

                        {/* Rodapé: Dados e QR Code */}
                        <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc' }}>
                            <div className="d-flex flex-column gap-1">
                                <InfoLinha icone={User} titulo="TUTOR RESPONSÁVEL" valor={proprietario?.nome || 'Não Informado'} destaque />
                                
                                <InfoLinha 
                                    icone={temColeiraAtiva ? ShieldCheck : ShieldAlert} 
                                    corIcone={temColeiraAtiva ? "text-success" : "text-danger"}
                                    titulo="PROTEÇÃO (COLEIRA)" 
                                    valor={
                                        <span className={`d-flex align-items-center gap-1 ${temColeiraAtiva ? 'text-success' : 'text-danger'}`}>
                                            {temColeiraAtiva ? <><Check size={14}/> Ativa</> : <><X size={14}/> Inativa</>}
                                        </span>
                                    } 
                                />
                                
                                <InfoLinha icone={Fingerprint} titulo="ID DO SISTEMA" valor={`#${pet.id.toString().padStart(6, '0')}`} />
                            </div>

                            {/* QR CODE MÁGICO */}
                            <div className="bg-white p-2 rounded-4 shadow-sm border text-center d-flex flex-column align-items-center">
                                <QRCodeSVG value={linkConsultaPublica} size={85} bgColor={"#ffffff"} fgColor={"#0f172a"} level={"Q"} />
                                <span className="mt-2 fw-bold" style={{ fontSize: '0.55rem', color: '#64748b', letterSpacing: '0.5px' }}>
                                    ESCANEIE AQUI
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🖨️ AÇÃO DO USUÁRIO (Não sai na impressão) */}
            <div className="text-center mt-4 fade-in">
                <button 
                    onClick={handlePrint} 
                    className="btn btn-primary fw-bold rounded-pill px-4 py-2 shadow transition-hover d-flex align-items-center mx-auto gap-2"
                >
                    <Printer size={20} /> Imprimir Documento Oficial
                </button>
                <p className="small text-muted mt-2 fw-medium">
                    Gere a credencial física para a coleira do paciente.
                </p>
            </div>

            <style>
                {`
                .transition-hover { transition: all 0.2s ease-in-out; }
                .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(13, 110, 253, .25)!important; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                /* Garante que o fundo cinza não vaze na impressão */
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
                }
                `}
            </style>
        </div>
    );
}

export default CarteirinhaDigital;