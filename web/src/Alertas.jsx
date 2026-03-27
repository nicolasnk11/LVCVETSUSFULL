import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { FaBell, FaCalendarAlt, FaExclamationTriangle, FaSyringe, FaShieldAlt, FaCheck, FaClock, FaSpinner, FaHistory } from 'react-icons/fa';

function Alertas() {
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get('https://vetleish-api.onrender.com/api/pets/'),
            axios.get('https://vetleish-api.onrender.com/api/proprietarios/')
        ]).then(([resPets, resProps]) => {
            
            const tutoresMap = {};
            resProps.data.forEach(tutor => {
                tutoresMap[tutor.id] = tutor.nome;
            });

            gerarAlertasInteligentes(resPets.data, tutoresMap);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao buscar dados:", err);
            setLoading(false);
        });
    }, []);

    const gerarAlertasInteligentes = (petsData, tutoresMap) => {
        let novosAlertas = [];
        
        // 🔥 NOVA LÓGICA: Lê o relógio interno dos alertas adiados
        const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
        const agora = new Date().getTime(); // Hora atual exata em milissegundos

        petsData.forEach(pet => {
            const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;
            const nomeTutor = tutoresMap[pet.proprietario] || 'Sem Tutor Cadastrado';

            // 🔴 ALERTA 1: Fila de Triagem
            if (pet.status === 'SUSPEITO') {
                const idUnico = `exame-pet-${pet.id}`;
                const tempoDespertar = alertasAdiados[idUnico];
                
                // Só mostra se nunca foi adiado OU se o tempo de adiar já venceu
                if (!tempoDespertar || agora > tempoDespertar) {
                    novosAlertas.push({
                        id: idUnico,
                        paciente: pet.nome.toUpperCase(),
                        tutor: nomeTutor,
                        tipo: 'exame',
                        dataCalculada: 'Pendente',
                        status: 'critico',
                        descricao: 'Animal classificado como SUSPEITO. Necessário realizar ou registrar resultado de teste rápido (DPP) e ELISA.',
                        icone: <FaSyringe size={20} />
                    });
                }
            }

            // 🟡 ALERTA 2: Ausência de Coleira
            if (ultimaVisita && !ultimaVisita.usa_coleira && pet.status !== 'OBITO') {
                const idUnico = `coleira-pet-${pet.id}`;
                const tempoDespertar = alertasAdiados[idUnico];

                if (!tempoDespertar || agora > tempoDespertar) {
                    novosAlertas.push({
                        id: idUnico,
                        paciente: pet.nome.toUpperCase(),
                        tutor: nomeTutor,
                        tipo: 'coleira',
                        dataCalculada: 'Imediato',
                        status: 'urgente',
                        descricao: 'Identificada ausência de coleira repelente na última visita. Providenciar encoleiramento para bloqueio vetorial.',
                        icone: <FaShieldAlt size={20} />
                    });
                }
            }

            // 🔵 ALERTA 3: Tratamento Ativo
            if (pet.medicacoes && pet.medicacoes.length > 0) {
                pet.medicacoes.forEach(med => {
                    const idUnico = `med-${med.id}-pet-${pet.id}`;
                    const tempoDespertar = alertasAdiados[idUnico];

                    if (!tempoDespertar || agora > tempoDespertar) {
                        novosAlertas.push({
                            id: idUnico,
                            paciente: pet.nome.toUpperCase(),
                            tutor: nomeTutor,
                            tipo: 'tratamento',
                            dataCalculada: new Date(med.data_inicio).toLocaleDateString('pt-BR'),
                            status: 'atencao',
                            descricao: `Tratamento ativo: ${med.nome}. Dose recomendada: ${med.dose}.`,
                            icone: <FaClock size={20} />
                        });
                    }
                });
            }
        });

        setAlertas(novosAlertas);
    };

    // 🔥 NOVA FUNÇÃO SONECA: Esconde por 24 horas
    const adiarAlerta = (idUnico) => {
        // 1. Tira o alerta da tela na hora
        setAlertas(alertas.filter(alerta => alerta.id !== idUnico));
        
        // 2. Anota na agenda do navegador: "Só acorde este alerta amanhã"
        const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
        const tempo24Horas = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
        const amanha = new Date().getTime() + tempo24Horas;
        
        alertasAdiados[idUnico] = amanha;
        localStorage.setItem('alertasAdiados_LVC', JSON.stringify(alertasAdiados));
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f4f7f6' }}>
                    <FaSpinner className="text-primary mb-3 spin-animation" size={40} />
                    <h5 className="text-primary fw-bolder mb-0" style={{ letterSpacing: '1px' }}>ANALISANDO PENDÊNCIAS...</h5>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <style>
                {`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin-animation { animation: spin 1s linear infinite; }
                `}
            </style>

            <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px' }}>
                <div className="container-fluid p-0 mx-auto" style={{ maxWidth: '1000px' }}>
                    
                    <div className="d-flex justify-content-between align-items-end mb-4 fade-in">
                        <div>
                            <h2 className="fw-black mb-1 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-1px' }}>
                                <FaBell className="text-warning" /> Agenda Inteligente
                            </h2>
                            <p className="mb-0 fw-bold text-muted small">Monitoramento proativo alimentado pela base de dados real</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-pill shadow-sm border d-flex align-items-center gap-2 fw-bold text-dark">
                            <FaCalendarAlt className="text-primary" />
                            <span>Hoje: {new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>

                    <div className="row g-3 fade-in" style={{ animationDelay: '0.1s' }}>
                        {alertas.length === 0 ? (
                            <div className="col-12 text-center py-5 mt-4">
                                <FaCheck className="text-success mb-3 opacity-50" size={60} />
                                <h4 className="fw-bold text-muted">Tudo em dia!</h4>
                                <p className="text-secondary">Não há alertas pendentes para o seu território ou eles foram adiados.</p>
                            </div>
                        ) : (
                            alertas.map((alerta) => {
                                let corBorda = alerta.status === 'critico' ? 'border-danger' : alerta.status === 'urgente' ? 'border-warning' : 'border-primary';
                                let corFundoIcone = alerta.status === 'critico' ? 'bg-danger text-white' : alerta.status === 'urgente' ? 'bg-warning text-dark' : 'bg-primary text-white';

                                return (
                                    <div key={alerta.id} className="col-12">
                                        <div className={`card border-0 shadow-sm rounded-4 bg-white border-start border-5 ${corBorda} overflow-hidden transition-hover`}>
                                            <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                                                
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm ${corFundoIcone}`} style={{ width: '50px', height: '50px' }}>
                                                        {alerta.icone}
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                                            {alerta.paciente} 
                                                            <span className="badge bg-light text-secondary border fw-normal">Tutor: {alerta.tutor}</span>
                                                        </h6>
                                                        <p className="small mb-0 text-muted">{alerta.descricao}</p>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-4">
                                                    <div className="text-end">
                                                        <span className={`badge rounded-pill px-3 py-2 ${alerta.status === 'critico' ? 'bg-danger-subtle text-danger' : alerta.status === 'urgente' ? 'bg-warning-subtle text-dark' : 'bg-primary-subtle text-primary'}`}>
                                                            {alerta.status === 'critico' && <FaExclamationTriangle className="me-1" />}
                                                            Data / Prazo: {alerta.dataCalculada}
                                                        </span>
                                                    </div>
                                                    {/* NOVO BOTÃO DE SONECA */}
                                                    <button 
                                                        onClick={() => adiarAlerta(alerta.id)}
                                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-2 shadow-sm"
                                                        title="Ocultar por 24 horas"
                                                    >
                                                        <FaHistory /> Adiar 24h
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            </div>
        </Layout>
    );
}

export default Alertas;