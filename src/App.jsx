import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import Sidebar             from './components/Sidebar';
import Login               from './pages/Login';
import Dashboard           from './pages/Dashboard';
import Filieres            from './pages/Filieres';
import Matieres            from './pages/Matieres';
import Enseignants         from './pages/Enseignants';
import Periodes            from './pages/Periodes';
import Etudiants           from './pages/Etudiants';
import Presences           from './pages/Presences';
import Justifications      from './pages/Justifications';
import Editions            from './pages/Editions';
import Utilisateurs        from './pages/Utilisateurs';
import EnseignantDashboard from './pages/EnseignantDashboard';
import EtudiantDashboard   from './pages/EtudiantDashboard';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/filieres" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Filieres /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/matieres" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Matieres /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/enseignants" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Enseignants /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/periodes" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Periodes /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/etudiants" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Etudiants /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/presences" element={
              <ProtectedRoute roles={['admin', 'enseignant']}>
                <AppLayout><Presences /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/justifications" element={
              <ProtectedRoute roles={['admin', 'enseignant']}>
                <AppLayout><Justifications /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/editions" element={
              <ProtectedRoute roles={['admin', 'enseignant']}>
                <AppLayout><Editions /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/utilisateurs" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><Utilisateurs /></AppLayout>
              </ProtectedRoute>
            }/>

            {/* Enseignant */}
            <Route path="/mon-espace" element={
              <ProtectedRoute roles={['enseignant']}>
                <AppLayout><EnseignantDashboard /></AppLayout>
              </ProtectedRoute>
            }/>

            {/* Étudiant */}
            <Route path="/mes-absences" element={
              <ProtectedRoute roles={['etudiant']}>
                <AppLayout><EtudiantDashboard /></AppLayout>
              </ProtectedRoute>
            }/>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}