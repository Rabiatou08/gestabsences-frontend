import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GitBranch, BookOpen, UserCheck, Calendar,
  LayoutDashboard, LogOut, GraduationCap,
  ClipboardList, FileCheck, BarChart2, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
];

const adminItems = [
  { label: 'Utilisateurs', icon: Users, path: '/utilisateurs' },
];

const paramItems = [
  { label: 'Filières',    icon: GitBranch,  path: '/filieres' },
  { label: 'Matières',    icon: BookOpen,   path: '/matieres' },
  { label: 'Enseignants', icon: UserCheck,  path: '/enseignants' },
  { label: 'Périodes',    icon: Calendar,   path: '/periodes' },
];

const saisieItems = [
  { label: 'Étudiants',          icon: GraduationCap, path: '/etudiants' },
  { label: 'Présences/Absences', icon: ClipboardList, path: '/presences' },
  { label: 'Justifications',     icon: FileCheck,     path: '/justifications' },
];

const editionsItems = [
  { label: 'Rapports & Éditions', icon: BarChart2, path: '/editions' },
];

const enseignantItems = [
  { label: 'Mon espace',         icon: LayoutDashboard, path: '/mon-espace' },
  { label: 'Présences/Absences', icon: ClipboardList,   path: '/presences' },
  { label: 'Justifications',     icon: FileCheck,       path: '/justifications' },
];

const etudiantItems = [
  { label: 'Mon espace', icon: GraduationCap, path: '/mes-absences' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Gest<span>Absences</span></div>
        <div className="sidebar-sub">Gestion des absences</div>
      </div>

      {/* Profil */}
      {user && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-bg)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {user.prenom} {user.nom}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{user.role}</div>
          </div>
        </div>
      )}

      {/* ── Navigation ADMIN ── */}
      {user?.role === 'admin' && (
        <>
          <nav className="nav-section">
            {navItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
              </div>
            ))}
          </nav>

          <nav className="nav-section">
            <div className="nav-section-label">Administration</div>
            {adminItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
              </div>
            ))}
          </nav>

          <nav className="nav-section">
            <div className="nav-section-label">Paramétrage</div>
            {paramItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
              </div>
            ))}
          </nav>

          <nav className="nav-section">
            <div className="nav-section-label">Saisie</div>
            {saisieItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
              </div>
            ))}
          </nav>

          <nav className="nav-section">
            <div className="nav-section-label">Éditions</div>
            {editionsItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
              </div>
            ))}
          </nav>
        </>
      )}

      {/* ── Navigation ENSEIGNANT ── */}
      {user?.role === 'enseignant' && (
        <nav className="nav-section">
          <div className="nav-section-label">Mon espace</div>
          {enseignantItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </nav>
      )}

      {/* ── Navigation ÉTUDIANT ── */}
      {user?.role === 'etudiant' && (
        <nav className="nav-section">
          <div className="nav-section-label">Mon espace</div>
          {etudiantItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </nav>
      )}

      {/* Déconnexion */}
      <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
        <div
          className="nav-item"
          onClick={handleLogout}
          style={{ color: 'var(--danger)' }}
        >
          <LogOut size={16} />
          Se déconnecter
        </div>
      </div>
    </aside>
  );
}