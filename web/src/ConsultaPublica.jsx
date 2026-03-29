import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// Ícones Premium e profissionais
import { ShieldCheck, Dog, CheckCircle, AlertTriangle, XCircle, Loader2, Info, ShieldAlert, Syringe } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Padroniza as linhas de dados públicos
const LinhaDadoPublico = ({ icone: Icon, titulo, valor, corValor = "text-dark" }) => (
    <div className="d-flex justify-content-between align-items-center border-bottom py-3">
        <div className="d-flex align-items-center gap-2 text-muted">
            <Icon size={16} />
            <span className="small fw-bold" style={{ letterSpacing: '0.5px' }}>{titulo}</span>
        </div>
        <span className={`fw-bold ${corValor}`}>{valor}</span>
    </div>
);

// 🏥 COMPONENTE PRINCIPAL
function ConsultaPublica() {
    const { id } = useParams();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        // Busca os dados públicos do paciente
        axios.get(`https://lvcvetsusfull.onrender.com/api/pets/${id}/`)
            .then(res => {
                setPet(res.data);
                setTimeout(() => setLoading(false), 300); // Suaviza a entrada
            })
            .catch(err => {
                console.error("Erro na validação:", err);
                setErro(true);
                setLoading(false);
            });
    }, [id]);

    // ⏳ ESTADO DE CARREGAMENTO PREMIUM
    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center fade-in" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <Loader2 size={48} className="text-primary mb-3 spin-animation" />
                <h6 className="text-muted fw-bold" style={{ letterSpacing: '1px' }}>VALIDANDO IDENTIFICAÇÃO...</h6>
                <style>{`.spin-animation { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .fade-in { animation: fadeIn 0.4s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
        );
    }

    // ❌ ESTADO DE ERRO (QR Code inválido)
    if (erro || !pet) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center p-4 text-center fade-in" style={{ minHeight: '100vh', backgroundColor: '#fef2f2' }}>
                <div className="bg-white p-4 rounded-circle shadow-sm mb-4">
                    <XCircle size={64} className="text-danger" />
                </div>
                <h3 className="fw-black text-danger mb-2">Registro Não Encontrado</h3>
                <p className="text-muted fw-medium" style={{ maxWidth: '300px' }}>
                    Este QR Code é inválido ou o paciente foi removido da base da Vigilância Epidemiológica.
                </p>
            </div>
        );
    }

    // 🧠 LÓGICA DE STATUS INTELIGENTE
    const getStatusConfig = () => {
        switch (pet.status) {
            case 'NEGATIVO': return { cor: '#10b981', icone: CheckCircle, label: 'NEGATIVO PARA LVC', bg: '#d1fae5' };
            case 'POSITIVO': return { cor: '#ef4444', icone: XCircle, label: 'POSITIVO PARA LVC', bg: '#fee2e2' };
            case 'SUSPEITO': return { cor: '#f59e0b', icone: AlertTriangle, label: 'CASO SUSPEITO', bg: '#fef3c7' };
            default: return { cor: '#94a3b8', icone: Info, label: 'STATUS INDEFINIDO', bg: '#f1f5f9' };
        }
    };
    const statusConfig = getStatusConfig();
    const IconeStatus = statusConfig.icone;

    // Foto e Lógica de Coleira (Corrigida para olhar só a última visita)
    const fotoUrl = pet.foto ? (pet.foto.startsWith('http') ? pet.foto : `https://lvcvetsusfull.onrender.com${pet.foto}`) : null;
    const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;
    const usaColeira = ultimaVisita ? ultimaVisita.usa_coleira : false;

    return (
        <div className="d-flex justify-content-center align-items-center fade-in" style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px' }}>
            <div className="card border-0 shadow-lg w-100 overflow-hidden" style={{ maxWidth: '420px', borderRadius: '20px', backgroundColor: '#ffffff' }}>
                
                {/* Cabeçalho Oficial */}
                <div className="p-4 text-white text-center" style={{ backgroundColor: '#0f172a' }}>
                    <ShieldCheck size={36} className="text-primary mb-2" />
                    <h5 className="m-0 fw-bolder" style={{ letterSpacing: '1px' }}>LVCVETSUS</h5>
                    <small className="fw-medium" style={{ color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '0.5px' }}>PORTAL DE VALIDAÇÃO SANITÁRIA</small>
                </div>

                <div className="card-body p-0 text-center">
                    {/* Faixa de Cor do Status */}
                    <div style={{ height: '8px', backgroundColor: statusConfig.cor, width: '100%' }}></div>

                    {/* Foto Circular com borda dinâmica */}
                    <div className="mt-4 mb-3 mx-auto shadow-sm" style={{ width: '130px', height: '130px', borderRadius: '50%', border: `4px solid ${statusConfig.cor}`, padding: '4px', backgroundColor: '#fff' }}>
                        <div className="d-flex justify-content-center align-items-center text-muted" style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            {fotoUrl ? (
                                <img src={fotoUrl} alt={pet.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                            ) : null}
                            <Dog size={50} style={{ display: fotoUrl ? 'none' : 'block' }} />
                        </div>
                    </div>

                    <h2 className="fw-black text-dark text-uppercase mb-0" style={{ letterSpacing: '-0.5px' }}>{pet.nome}</h2>
                    <p className="text-muted fw-medium mb-3">{pet.raca || 'Sem Raça Definida'}</p>

                    {/* Bloco de Status Oficial em Destaque */}
                    <div className="mx-4 mb-4 p-3 rounded-4 shadow-sm" style={{ backgroundColor: statusConfig.bg, border: `1px solid ${statusConfig.cor}40` }}>
                        <IconeStatus size={32} color={statusConfig.cor} className="mb-2" />
                        <h6 className="fw-bolder mb-1" style={{ color: statusConfig.cor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {statusConfig.label}
                        </h6>
                        <small className="fw-medium" style={{ color: statusConfig.cor, opacity: 0.8 }}>Atestado pela Vigilância Epidemiológica</small>
                    </div>

                    {/* Dados Públicos (LGPD Compliant) */}
                    <div className="text-start px-4 pb-4">
                        <LinhaDadoPublico 
                            icone={Info} 
                            titulo="ID do Sistema" 
                            valor={`#${pet.id.toString().padStart(6, '0')}`} 
                        />
                        <LinhaDadoPublico 
                            icone={usaColeira ? ShieldCheck : ShieldAlert} 
                            titulo="Proteção Vetorial" 
                            valor={usaColeira ? 'Coleira Ativa' : 'Sem Proteção'} 
                            corValor={usaColeira ? "text-success" : "text-danger"} 
                        />
                        <LinhaDadoPublico 
                            icone={Syringe} 
                            titulo="Vacinação (LVC)" 
                            valor={pet.tomou_dose_3 ? 'Imunizado' : 'Pendente / Incompleta'} 
                            corValor={pet.tomou_dose_3 ? "text-success" : "text-warning"} 
                        />
                    </div>
                </div>

                {/* Rodapé LGPD */}
                <div className="bg-light text-center py-3 px-4 border-top">
                    <small className="text-muted fw-medium" style={{ fontSize: '0.65rem', lineHeight: '1.4', display: 'block' }}>
                        Informação oficial do sistema de saúde.<br/>Dados exibidos em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                    </small>
                </div>
            </div>
        </div>
    );
}

export default ConsultaPublica;