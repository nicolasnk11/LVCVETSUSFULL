import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
// Importando ícones premium e minimalistas
import { Bell, Calendar, AlertTriangle, Syringe, ShieldAlert, CheckCircle, Clock, Loader2, History } from 'lucide-react';

// 🧩 COMPONENTE INTELIGENTE: Isolamos o Card para limpar o código principal
const AlertaCard = ({ alerta, onAdiar }) => {
    const isCritico = alerta.status === 'critico';
    const isUrgente = alerta.status === 'urgente';

    const corBorda = isCritico ? 'border-danger' : isUrgente ? 'border-warning' : 'border-primary';
    const corFundoIcone = isCritico ? 'bg-danger text-white' : isUrgente ? 'bg-warning text-dark' : 'bg-primary text-white';
    const corBadge = isCritico ? 'bg-danger-subtle text-danger' : isUrgente ? 'bg-warning-subtle text-dark' : 'bg-primary-subtle text-primary';

    return (
        <div className={`card border-0 shadow-sm rounded-4 bg-white border-start border-5 ${corBorda} overflow-hidden mb-3 transition-hover fade-in`}>
            <div className="card-body p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                
                <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm ${corFundoIcone}`} style={{ width: '48px', height: '48px' }}>
                        {alerta.icone}
                    </div>
                    <div>
                        <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                            {alerta.paciente} 
                            <span className="badge bg-light text-secondary border fw-normal">Tutor: {alerta.tutor}</span>
                        </h6>
                        <p className="small mb-0 text-muted" style={{ lineHeight: '1.4' }}>{alerta.descricao}</p>
                    </div>
                </div>

                <div className="d-flex flex-row flex-md-column align-items-center align-items-md-end justify-content-between mt-3 mt-md-0 gap-2">
                    <span className={`badge rounded-pill px-3 py-2 fw-medium ${corBadge}`}>
                        {isCritico && <AlertTriangle size={14} className="me-1 mb-1" />}
                        Prazo: {alerta.dataCalculada}
                    </span>
                    
                    <button 
                        onClick={() => onAdiar(alerta.id)}
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-2 shadow-sm transition-hover"
                        title="Ocultar por 24 horas"
                    >
                        <History size={14} /> Adiar 24h
                    </button>
                </div>

            </div>
        </div>
    );
};

// 🏥 COMPONENTE PRINCIPAL
function Alertas() {
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🛡️ TRAVA DE SEGURANÇA: Promise.all blindada
        Promise.all([
            axios.get('https://lvcvetsusfull.onrender.com/api/pets/'),
            axios.get('https://lvcvetsusfull.onrender.com/api/proprietarios/')
        ]).then(([resPets, resProps]) => {
            
            // Garante que sejam arrays mesmo que a API venha vazia ou com erro
            const petsData = resPets?.data?.results || resPets?.data || [];
            const propsData = resProps?.data?.results || resProps?.data || [];

            const tutoresMap = {};
            if (Array.isArray(propsData)) {
                propsData.forEach(tutor => {
                    if (tutor?.id) tutoresMap[tutor.id] = tutor.nome;
                });
            }

            if (Array.isArray(petsData)) {
                gerarAlertasInteligentes(petsData, tutoresMap);
            }
            setLoading(false);
        }).catch(err => {
            console.error("Erro na base de dados de alertas:", err);
            setLoading(false);
        });
    }, []);

    const gerarAlertasInteligentes = (petsData, tutoresMap) => {
        let novosAlertas = [];
        const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
        const agora = new Date().getTime(); 

        petsData.forEach(pet => {
            // 🛡️ Segurança de propriedades
            const visitas = pet?.visitas || [];
            const ultimaVisita = visitas.length > 0 ? visitas[visitas.length - 1] : null;
            const nomeTutor = tutoresMap[pet?.proprietario] || 'Sem Tutor Cadastrado';

            // ALERTA 1: Fila de Triagem
            if (pet?.status === 'SUSPEITO') {
                const idUnico = `exame-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) {
                    novosAlertas.push({
                        id: idUnico,
                        paciente: (pet?.nome || "Sem Nome").toUpperCase(),
                        tutor: nomeTutor,
                        status: 'critico',
                        descricao: 'Paciente SUSPEITO. Necessário realizar teste rápido (DPP) e ELISA.',
                        dataCalculada: 'Pendente',
                        icone: <Syringe size={22} />
                    });
                }
            }

            // ALERTA 2: Ausência de Coleira
            if (ultimaVisita && !ultimaVisita.usa_coleira && pet?.status !== 'OBITO') {
                const idUnico = `coleira-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) {
                    novosAlertas.push({
                        id: idUnico,
                        paciente: (pet?.nome || "Sem Nome").toUpperCase(),
                        tutor: nomeTutor,
                        status: 'urgente',
                        descricao: 'Ausência de proteção repelente. Providenciar encoleiramento vetorial.',
                        dataCalculada: 'Imediato',
                        icone: <ShieldAlert size={22} />
                    });
                }
            }

            // ALERTA 3: Tratamento Ativo
            const medicacoes = pet?.medicacoes || [];
            medicacoes.forEach(med => {
                const idUnico = `med-${med.id}-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) {
                    novosAlertas.push({
                        id: idUnico,
                        paciente: (pet?.nome || "Sem Nome").toUpperCase(),
                        tutor: nomeTutor,
                        status: 'atencao',
                        descricao: `Medicamentação ativa: ${med.nome}. Dose: ${med.dose}.`,
                        dataCalculada: new Date(med.data_inicio).toLocaleDateString('pt-BR'),
                        icone: <Clock size={22} />
                    });
                }
            });
        });

        setAlertas(novosAlertas);
    };

    const adiarAlerta = (idUnico) => {
        setAlertas(prev => prev.filter(alerta => alerta.id !== idUnico));
        const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
        const tempo24Horas = 24 * 60 * 60 * 1000; 
        alertasAdiados[idUnico] = new Date().getTime() + tempo24Horas;
        localStorage.setItem('alertasAdiados_LVC', JSON.stringify(alertasAdiados));
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '80vh' }}>
                    <Loader2 className="text-primary mb-3 spin-animation" size={48} />
                    <h6 className="text-muted fw-bold">ANALISANDO RISCOS...</h6>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container-fluid p-3 p-md-5 fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-3">
                    <div>
                        <h2 className="fw-black mb-1 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-1.5px' }}>
                            <Bell className="text-warning" size={32} /> Painel de Alertas
                        </h2>
                        <p className="mb-0 fw-bold text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>Vigilância Proativa Inteligente</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-pill shadow-sm border d-flex align-items-center gap-2 fw-black text-dark small">
                        <Calendar className="text-primary" size={16} />
                        <span>HOJE: {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <div className="row g-0">
                    {alertas.length === 0 ? (
                        <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border border-light">
                            <CheckCircle className="text-success mb-3 opacity-50" size={60} />
                            <h4 className="fw-black text-dark">Área Protegida!</h4>
                            <p className="text-muted mb-0 fw-medium">Nenhuma pendência sanitária detectada no território.</p>
                        </div>
                    ) : (
                        alertas.map((alerta) => (
                            <AlertaCard key={alerta.id} alerta={alerta} onAdiar={adiarAlerta} />
                        ))
                    )}
                </div>

            </div>
        </Layout>
    );
}

export default Alertas;