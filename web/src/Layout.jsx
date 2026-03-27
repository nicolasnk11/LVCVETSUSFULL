import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartPie, FaMapMarkedAlt, FaPaw, FaClipboardList, FaSignOutAlt, FaUserMd, FaBell} from 'react-icons/fa';
import axios from 'axios'; // 🔥 Adicionado o axios para buscar os dados

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [nomeUsuario, setNomeUsuario] = useState('Carregando...');
  const [alertCount, setAlertCount] = useState(0); // 🔥 Novo estado para a contagem real

  useEffect(() => {
    // Busca o nome do usuário salvo
    const usuarioSalvo = localStorage.getItem('lvcvetsus_usuario');
    if (usuarioSalvo) {
      setNomeUsuario(usuarioSalvo);
    } else {
      setNomeUsuario('Profissional de Saúde'); 
    }
  }, []);

  // 🔥 NOVA MÁGICA: Buscar a quantidade REAL de alertas sempre que mudar de tela
  useEffect(() => {
    axios.get('https://lvcvetsusfull.onrender.com/api/pets/')
      .then(res => {
        const totalAlertas = calcularAlertasAtivos(res.data);
        setAlertCount(totalAlertas);
      })
      .catch(err => console.error("Erro ao buscar alertas para a Sidebar:", err));
  }, [location.pathname]); // Atualiza o número sempre que navegar!

  // Função que faz a mesma matemática da tela de Alertas
  const calcularAlertasAtivos = (petsData) => {
    const alertasAdiados = JSON.parse(localStorage.getItem('alertasAdiados_LVC')) || {};
    const agora = new Date().getTime();
    let count = 0;

    petsData.forEach(pet => {
        const ultimaVisita = pet.visitas && pet.visitas.length > 0 ? pet.visitas[pet.visitas.length - 1] : null;

        // Regra 1: Suspeito
        if (pet.status === 'SUSPEITO') {
            const idUnico = `exame-pet-${pet.id}`;
            if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
        }
        // Regra 2: Sem Coleira
        if (ultimaVisita && !ultimaVisita.usa_coleira && pet.status !== 'OBITO') {
            const idUnico = `coleira-pet-${pet.id}`;
            if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
        }
        // Regra 3: Medicações Ativas
        if (pet.medicacoes && pet.medicacoes.length > 0) {
            pet.medicacoes.forEach(med => {
                const idUnico = `med-${med.id}-pet-${pet.id}`;
                if (!alertasAdiados[idUnico] || agora > alertasAdiados[idUnico]) count++;
            });
        }
    });
    return count;
  };

  const handleLogout = () => {
    localStorage.removeItem('lvcvetsus_token'); 
    localStorage.removeItem('lvcvetsus_usuario'); 
    window.location.href = '/login'; 
  };

  return (
    <div className="d-flex">
      {/* SIDEBAR ESCURA */}
      <aside className="sidebar shadow-lg" style={{ 
          width: '260px', 
          backgroundColor: '#0f172a', 
          color: '#cbd5e1', 
          minHeight: '100vh', 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 1000
      }}>
        
        {/* LOGO OFICIAL */}
        <div className="mb-4 d-flex flex-column align-items-center text-center">
          <div className="bg-white p-2 rounded-4 shadow-sm w-100 d-flex justify-content-center align-items-center mb-3">
            <img 
              src="/logovetsus.jpg" 
              alt="Logo LVCVETSUS" 
              style={{ 
                width: '100%', 
                maxWidth: '160px',
                objectFit: 'contain',
                borderRadius: '8px'
              }} 
            />
          </div>
          
          <div className="border-top pt-2 w-100" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
            <small style={{color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold'}}>
               Vigilância Epidemiológica
            </small>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-grow-1 mt-2">
          <div className="nav-category mt-3 mb-2 small fw-bold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>Visão Geral</div>
          
          <Link to="/dashboard" className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded mb-1 text-decoration-none ${location.pathname === '/dashboard' ? 'bg-primary text-white shadow-sm' : 'text-light'}`} style={{transition: '0.2s'}}>
            <FaChartPie /> Dashboard
          </Link>

          <Link to="/" className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded mb-1 text-decoration-none ${location.pathname === '/' ? 'bg-primary text-white shadow-sm' : 'text-light'}`} style={{transition: '0.2s'}}>
            <FaClipboardList /> Painel de Triagem
          </Link>
         
         <Link to="/alertas" className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded mb-1 text-decoration-none position-relative ${location.pathname === '/alertas' ? 'bg-primary text-white shadow-sm' : 'text-light'}`} style={{transition: '0.2s'}}>
           <FaBell /> Alertas Inteligentes
           {/* 🔥 SÓ MOSTRA A BOLINHA SE TIVER ALERTA MAIOR QUE ZERO */}
           {alertCount > 0 && (
             <span className="position-absolute top-50 end-0 translate-middle-y badge rounded-pill bg-danger me-3 shadow-sm" style={{ fontSize: '0.7rem' }}>
               {alertCount}
             </span>
           )}
         </Link>

          <div className="nav-category mt-4 mb-2 small fw-bold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>Epidemiologia</div>

          <Link to="/mapa" className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded mb-1 text-decoration-none ${location.pathname === '/mapa' ? 'bg-primary text-white shadow-sm' : 'text-light'}`}>
            <FaMapMarkedAlt /> Mapa de Risco
          </Link>
          
          <div className="nav-category mt-4 mb-2 small fw-bold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>Gestão Clínica</div>
          
          <Link to="/clinica" className={`nav-item d-flex align-items-center gap-3 py-2 px-3 rounded mb-1 text-decoration-none ${location.pathname === '/clinica' ? 'bg-primary text-white shadow-sm' : 'text-light'}`}>
            <FaPaw /> Prontuários
          </Link>
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto pt-4 border-top" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
           <Link 
             to="/perfil" 
             className="d-flex align-items-center gap-3 mb-3 p-2 rounded text-decoration-none hover-scale" 
             style={{
                 background: location.pathname === '/perfil' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)', 
                 border: location.pathname === '/perfil' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                 transition: 'all 0.2s cursor-pointer'
             }}
             title="Ver Meu Perfil Funcional"
           >
              <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center text-white fw-bolder shadow-sm" 
                   style={{width: 40, height: 40, fontSize: '16px'}}>
                 <FaUserMd />
              </div>
              <div style={{flex: 1, overflow: 'hidden'}}>
                 <p className="text-white m-0 fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>{nomeUsuario}</p>
                 <p className="m-0" style={{color: '#34d399', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}>● Ver Meu Perfil</p>
              </div>
           </Link>

           <button 
             onClick={handleLogout} 
             className="btn btn-outline-danger w-100 d-flex justify-content-center align-items-center gap-2 fw-bold" 
             style={{transition: '0.2s', padding: '10px'}}
           >
             <FaSignOutAlt /> Encerrar Sessão
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content flex-grow-1" style={{ backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;