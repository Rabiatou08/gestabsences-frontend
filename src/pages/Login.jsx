import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: '', mot_de_passe: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errMsg, setErrMsg]   = useState('');

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
    setErrMsg('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.email)        errs.email        = 'Email obligatoire';
    if (!form.mot_de_passe) errs.mot_de_passe = 'Mot de passe obligatoire';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error); return; }

      login(data.token, data.user);

      // Redirection selon le rôle
      if (data.user.role === 'admin')
        navigate('/');
      else if (data.user.role === 'enseignant')
        navigate('/mon-espace');
      else
        navigate('/mes-absences');

    } catch {
      setErrMsg('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <LogIn size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.4px' }}>
            Gest<span style={{ color: 'var(--accent)' }}>Absences</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Carte */}
        <div className="card" style={{ padding: '28px 28px' }}>

          {errMsg && (
            <div style={{
              background: 'var(--danger-bg)', color: 'var(--danger)',
              border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px', fontSize: 13, marginBottom: 18,
            }}>
              {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Adresse email</label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="admin@gestabsences.ci"
                autoComplete="email"
              />
              {errors.email && <span className="form-hint">{errors.email}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 22 }}>
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`form-input ${errors.mot_de_passe ? 'error' : ''}`}
                  name="mot_de_passe"
                  type={showPwd ? 'text' : 'password'}
                  value={form.mot_de_passe}
                  onChange={onChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-3)',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.mot_de_passe && <span className="form-hint">{errors.mot_de_passe}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes de test */}
          <div style={{
            marginTop: 24, padding: '14px',
            background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              Comptes de test :
            </div>
            <div style={{ color: 'var(--text-3)', lineHeight: 2 }}>
              <div>👤 Admin : admin@gestabsences.ci / <strong>admin123</strong></div>
              <div>👨‍🏫 Enseignant : créez un compte dans Utilisateurs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}