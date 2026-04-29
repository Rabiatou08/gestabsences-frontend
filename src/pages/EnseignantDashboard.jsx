import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, AlertCircle, GraduationCap,
  CheckCircle, Calendar, ArrowRight, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { enseignantEspaceAPI, presencesAPI } from '../services/api';
import { useToast } from '../components/ToastProvider';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function EnseignantDashboard() {
  const { user }   = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [seances,  setSeances]  = useState([]);
  const [absences, setAbsences] = useState([]);
  const [onglet,   setOnglet]   = useState('seances');
  const [loading,  setLoading]  = useState(true);
  const [seanceActive, setSeanceActive] = useState(null);
  const [etudiants,    setEtudiants]    = useState([]);
  const [presences,    setPresences]    = useState({});
  const [saving,       setSaving]       = useState(false);

  // id_enseignant lié au compte utilisateur
  const idEnseignant = user?.id_enseignant;

  useEffect(() => {
    if (idEnseignant) load();
  }, [idEnseignant]);

  async function load() {
    try {
      setLoading(true);
      const [s, a, st] = await Promise.all([
        enseignantEspaceAPI.seances(idEnseignant),
        enseignantEspaceAPI.absences(idEnseignant),
        enseignantEspaceAPI.stats(idEnseignant),
      ]);
      setSeances(s); setAbsences(a); setStats(st);
    } catch { toast('Erreur chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadPresences(seance) {
    setSeanceActive(seance);
    try {
      const data = await presencesAPI.getBySeance(seance.id_enseignement);
      setEtudiants(data);
      const map = {};
      data.forEach(etud => {
        map[etud.id_etudiant] = etud.statut || 'present';
      });
      setPresences(map);
    } catch { toast('Erreur', 'danger'); }
  }

  function togglePresence(id) {
    setPresences(prev => ({
      ...prev,
      [id]: prev[id] === 'absent' ? 'present' : 'absent',
    }));
  }

  async function handleSave() {
    if (!seanceActive) return;
    setSaving(true);
    try {
      const data = Object.entries(presences).map(([id_etudiant, statut]) => ({
        id_etudiant: Number(id_etudiant), statut,
      }));
      await presencesAPI.enregistrer(seanceActive.id_enseignement, { presences: data });
      toast('Présences enregistrées ✓');
      loadPresences(seanceActive);
      load();
    } catch (err) { toast(err.message, 'danger'); }
    finally { setSaving(false); }
  }

  const nbPresents = Object.values(presences).filter(s => s === 'present').length;
  const nbAbsents  = Object.values(presences).filter(s => s === 'absent').length;

  if (!idEnseignant) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <AlertCircle size={48} color="var(--warn)" style={{ margin:'0 auto 16px' }}/>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>
          Compte non lié à un enseignant
        </h2>
        <p style={{ color:'var(--text-2)', fontSize:14 }}>
          Votre compte utilisateur n'est pas encore lié à un profil enseignant.
          Contactez l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Mon espace</h1>
            <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>
              Bonjour, {user?.prenom} {user?.nom} 👋
            </p>
          </div>
          <span className="page-badge">Enseignant</span>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>Chargement...</p>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Mes séances</div>
                <div className="stat-value" style={{ color:'var(--accent)' }}>{stats?.seances}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Étudiants</div>
                <div className="stat-value">{stats?.etudiants}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Absences</div>
                <div className="stat-value" style={{ color:'var(--danger)' }}>{stats?.absences}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Justifiées</div>
                <div className="stat-value" style={{ color:'var(--success)' }}>{stats?.justifiees}</div>
              </div>
            </div>

            {/* Onglets */}
            <div className="tabs">
              <div className={`tab ${onglet==='seances' ? 'active' : ''}`}
                onClick={() => { setOnglet('seances'); setSeanceActive(null); }}>
                <Calendar size={14}/> Mes séances ({seances.length})
              </div>
              <div className={`tab ${onglet==='absences' ? 'active' : ''}`}
                onClick={() => setOnglet('absences')}>
                <AlertCircle size={14}/> Absences ({absences.length})
              </div>
            </div>

            {/* Séances */}
            {onglet === 'seances' && (
              <div style={{ display:'grid', gridTemplateColumns: seanceActive ? '300px 1fr' : '1fr', gap:20 }}>

                {/* Liste séances */}
                <div className="card">
                  <div className="card-title" style={{ marginBottom:16 }}>
                    <Calendar size={15}/> Séances de cours
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {seances.length === 0 && (
                      <div className="empty-state">
                        <Calendar size={32}/>
                        <p>Aucune séance enregistrée</p>
                      </div>
                    )}
                    {seances.map(s => (
                      <div
                        key={s.id_enseignement}
                        onClick={() => loadPresences(s)}
                        style={{
                          padding:'12px 14px', borderRadius:'var(--radius)',
                          cursor:'pointer', transition:'all .15s',
                          border:`1px solid ${seanceActive?.id_enseignement === s.id_enseignement ? 'var(--accent)' : 'var(--border)'}`,
                          background: seanceActive?.id_enseignement === s.id_enseignement ? 'var(--accent-bg)' : 'var(--bg)',
                        }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{s.nom_matiere}</div>
                            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                              {s.libele_filiere}
                            </div>
                            <div style={{ fontSize:11, color:'var(--text-3)' }}>
                              {formatDate(s.date_enseignement)} · {s.horaire?.slice(0,5)}
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--text-3)' }}>
                              {s.nb_presents}/{s.nb_etudiants} présents
                            </div>
                            <ArrowRight size={14} color="var(--text-3)"/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saisie présences */}
                {seanceActive && (
                  <div className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                      <div>
                        <h2 style={{ fontSize:15, fontWeight:600 }}>{seanceActive.nom_matiere}</h2>
                        <p style={{ fontSize:12, color:'var(--text-2)', marginTop:3 }}>
                          {seanceActive.libele_filiere} · {formatDate(seanceActive.date_enseignement)} · {seanceActive.horaire?.slice(0,5)}
                        </p>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>

                    {/* Stats présences */}
                    <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                      <div style={{ flex:1, padding:'8px 12px', borderRadius:'var(--radius)', background:'var(--success-bg)', border:'1px solid #bbf7d0' }}>
                        <div style={{ fontSize:10, color:'var(--success)', fontWeight:600 }}>PRÉSENTS</div>
                        <div style={{ fontSize:20, fontWeight:700, color:'var(--success)' }}>{nbPresents}</div>
                      </div>
                      <div style={{ flex:1, padding:'8px 12px', borderRadius:'var(--radius)', background:'var(--danger-bg)', border:'1px solid #fecaca' }}>
                        <div style={{ fontSize:10, color:'var(--danger)', fontWeight:600 }}>ABSENTS</div>
                        <div style={{ fontSize:20, fontWeight:700, color:'var(--danger)' }}>{nbAbsents}</div>
                      </div>
                      <div style={{ flex:1, padding:'8px 12px', borderRadius:'var(--radius)', background:'var(--bg)', border:'1px solid var(--border)' }}>
                        <div style={{ fontSize:10, color:'var(--text-3)', fontWeight:600 }}>TOTAL</div>
                        <div style={{ fontSize:20, fontWeight:700 }}>{etudiants.length}</div>
                      </div>
                    </div>

                    {/* Boutons globaux */}
                    <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        const map = {};
                        etudiants.forEach(etud => map[etud.id_etudiant] = 'present');
                        setPresences(map);
                      }}>
                        <CheckCircle size={12}/> Tous présents
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        const map = {};
                        etudiants.forEach(etud => map[etud.id_etudiant] = 'absent');
                        setPresences(map);
                      }}>
                        <AlertCircle size={12}/> Tous absents
                      </button>
                    </div>

                    {/* Liste étudiants */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {etudiants.length === 0 && (
                        <div className="empty-state">
                          <GraduationCap size={32}/>
                          <p>Aucun étudiant dans cette filière</p>
                        </div>
                      )}
                      {etudiants.map(etud => {
                        const statut  = presences[etud.id_etudiant] || 'present';
                        const present = statut === 'present';
                        return (
                          <div key={etud.id_etudiant} style={{
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:'9px 12px', borderRadius:'var(--radius)',
                            border:`1px solid ${present ? '#bbf7d0' : '#fecaca'}`,
                            background: present ? '#f0fdf4' : '#fff5f5',
                          }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{
                                width:32, height:32, borderRadius:'50%',
                                background: present ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: present ? 'var(--success)' : 'var(--danger)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:11, fontWeight:700, flexShrink:0,
                              }}>
                                {(etud.prenom[0]||'').toUpperCase()}{(etud.nom[0]||'').toUpperCase()}
                              </div>
                              <span style={{ fontWeight:600, fontSize:13 }}>
                                {etud.nom} {etud.prenom}
                              </span>
                            </div>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: present ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: present ? 'var(--success)' : 'var(--danger)',
                                borderColor: present ? '#bbf7d0' : '#fecaca',
                                minWidth:90,
                                display:'flex', alignItems:'center',
                                justifyContent:'center', gap:4,
                              }}
                              onClick={() => togglePresence(etud.id_etudiant)}
                            >
                              {present ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                              {present ? 'Présent' : 'Absent'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Absences */}
            {onglet === 'absences' && (
              <div className="card">
                <div className="card-title">
                  <AlertCircle size={15}/> Absences de mes étudiants
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Étudiant</th>
                        <th>Filière</th>
                        <th>Matière</th>
                        <th>Date</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absences.length === 0 && (
                        <tr><td colSpan={5}>
                          <div className="empty-state">
                            <CheckCircle size={32}/>
                            <p>Aucune absence enregistrée 🎉</p>
                          </div>
                        </td></tr>
                      )}
                      {absences.map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600 }}>{a.nom} {a.prenom}</td>
                          <td><span className="badge badge-info">{a.libele_filiere}</span></td>
                          <td>{a.nom_matiere}</td>
                          <td style={{ fontSize:12, color:'var(--text-3)' }}>
                            {formatDate(a.date_enseignement)}
                          </td>
                          <td>
                            {a.justification
                              ? <span className="badge badge-success">Justifiée</span>
                              : <span className="badge badge-danger">Non justifiée</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}