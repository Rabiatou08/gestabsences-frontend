import React, { useState, useEffect } from 'react';
import {
  GraduationCap, AlertCircle, CheckCircle,
  Calendar, BookOpen, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { etudiantEspaceAPI } from '../services/api';
import { useToast } from '../components/ToastProvider';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function EtudiantDashboard() {
  const { user }   = useAuth();
  const toast      = useToast();
  const [stats,    setStats]    = useState(null);
  const [absences, setAbsences] = useState([]);
  const [seances,  setSeances]  = useState([]);
  const [onglet,   setOnglet]   = useState('apercu');
  const [loading,  setLoading]  = useState(true);

  const idEtudiant = user?.id_etudiant;

  useEffect(() => {
    if (idEtudiant) load();
  }, [idEtudiant]);

  async function load() {
    try {
      setLoading(true);
      const [st, ab, se] = await Promise.all([
        etudiantEspaceAPI.stats(idEtudiant),
        etudiantEspaceAPI.absences(idEtudiant),
        etudiantEspaceAPI.seances(idEtudiant),
      ]);
      setStats(st); setAbsences(ab); setSeances(se);
    } catch { toast('Erreur chargement', 'danger'); }
    finally { setLoading(false); }
  }

  const tauxPresence = stats?.seances > 0
    ? Math.round((stats.presences / stats.seances) * 100)
    : 100;

  if (!idEtudiant) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <GraduationCap size={48} color="var(--warn)" style={{ margin:'0 auto 16px' }}/>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>
          Compte non lié à un étudiant
        </h2>
        <p style={{ color:'var(--text-2)', fontSize:14 }}>
          Votre compte n'est pas encore lié à un profil étudiant.
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
            <h1 className="page-title">Mon espace étudiant</h1>
            <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>
              Bonjour, {user?.prenom} {user?.nom} 👋
            </p>
          </div>
          <span className="page-badge">Étudiant</span>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
            Chargement...
          </p>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Séances total</div>
                <div className="stat-value">{stats?.seances}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Présences</div>
                <div className="stat-value" style={{ color:'var(--success)' }}>
                  {stats?.presences}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Absences</div>
                <div className="stat-value" style={{ color:'var(--danger)' }}>
                  {stats?.absences}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Justifiées</div>
                <div className="stat-value" style={{ color:'var(--warn)' }}>
                  {stats?.justifiees}
                </div>
              </div>
            </div>

            {/* Taux de présence */}
            <div className="card" style={{ marginBottom:24 }}>
              <div className="card-title">
                <GraduationCap size={15}/> Mon taux de présence
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    height:20, background:'var(--bg)',
                    borderRadius:10, overflow:'hidden',
                  }}>
                    <div style={{
                      width:`${tauxPresence}%`,
                      height:'100%',
                      background: tauxPresence >= 75 ? 'var(--success)' :
                                  tauxPresence >= 50 ? 'var(--warn)' : 'var(--danger)',
                      borderRadius:10,
                      transition:'width .5s',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {tauxPresence > 15 && (
                        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>
                          {tauxPresence}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>
                      {stats?.presences} présences / {stats?.seances} séances
                    </span>
                    <span style={{
                      fontSize:13, fontWeight:600,
                      color: tauxPresence >= 75 ? 'var(--success)' :
                             tauxPresence >= 50 ? 'var(--warn)' : 'var(--danger)',
                    }}>
                      {tauxPresence >= 75 ? '✅ Bon' :
                       tauxPresence >= 50 ? '⚠️ Attention' : '❌ Insuffisant'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte si trop d'absences */}
            {stats?.absences > 3 && (
              <div style={{
                background:'var(--danger-bg)', border:'1px solid #fecaca',
                borderRadius:'var(--radius)', padding:'14px 18px',
                marginBottom:20, display:'flex', alignItems:'center', gap:12,
              }}>
                <AlertCircle size={20} color="var(--danger)"/>
                <div>
                  <div style={{ fontWeight:600, color:'var(--danger)', fontSize:14 }}>
                    Attention — Trop d'absences
                  </div>
                  <div style={{ fontSize:13, color:'var(--danger)', opacity:.8, marginTop:2 }}>
                    Vous avez {stats.absences} absences. Pensez à les justifier rapidement.
                  </div>
                </div>
              </div>
            )}

            {/* Onglets */}
            <div className="tabs">
              <div className={`tab ${onglet==='apercu' ? 'active' : ''}`}
                onClick={() => setOnglet('apercu')}>
                <Calendar size={14}/> Toutes mes séances ({seances.length})
              </div>
              <div className={`tab ${onglet==='absences' ? 'active' : ''}`}
                onClick={() => setOnglet('absences')}>
                <AlertCircle size={14}/> Mes absences ({absences.length})
              </div>
            </div>

            {/* Toutes les séances */}
            {onglet === 'apercu' && (
              <div className="card">
                <div className="card-title">
                  <Calendar size={15}/> Historique des séances
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th>Enseignant</th>
                        <th>Date</th>
                        <th>Horaire</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seances.length === 0 && (
                        <tr><td colSpan={5}>
                          <div className="empty-state">
                            <Calendar size={32}/>
                            <p>Aucune séance enregistrée</p>
                          </div>
                        </td></tr>
                      )}
                      {seances.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:500 }}>{s.nom_matiere}</td>
                          <td style={{ fontSize:12, color:'var(--text-2)' }}>
                            {s.nom_enseignant
                              ? `${s.nom_enseignant} ${s.prenom_enseignant}`
                              : '—'
                            }
                          </td>
                          <td style={{ fontSize:12, color:'var(--text-3)' }}>
                            {formatDate(s.date_enseignement)}
                          </td>
                          <td style={{ fontSize:12, color:'var(--text-3)' }}>
                            {s.horaire?.slice(0,5) || '—'}
                          </td>
                          <td>
                            {s.statut === 'present'
                              ? <span className="badge badge-success">Présent(e)</span>
                              : s.justification
                                ? <span className="badge badge-warn">Abs. justifiée</span>
                                : <span className="badge badge-danger">Absent(e)</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Absences */}
            {onglet === 'absences' && (
              <div className="card">
                <div className="card-title">
                  <AlertCircle size={15}/> Mes absences
                </div>
                {absences.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle size={36}/>
                    <p>Aucune absence — Continuez comme ça ! 🎉</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {absences.map((a, i) => (
                      <div key={i} style={{
                        padding:'14px 16px',
                        borderRadius:'var(--radius)',
                        border:`1px solid ${a.justification ? '#bbf7d0' : '#fecaca'}`,
                        background: a.justification ? '#f0fdf4' : '#fff5f5',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>
                              {a.nom_matiere}
                            </div>
                            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>
                              {formatDate(a.date_enseignement)} à {a.horaire?.slice(0,5) || '—'}
                            </div>
                            {a.nom_enseignant && (
                              <div style={{ fontSize:12, color:'var(--text-3)' }}>
                                Enseignant : {a.nom_enseignant} {a.prenom_enseignant}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign:'right' }}>
                            {a.justification
                              ? <span className="badge badge-success">Justifiée</span>
                              : <span className="badge badge-danger">Non justifiée</span>
                            }
                          </div>
                        </div>
                        {a.justification && (
                          <div style={{
                            marginTop:10, padding:'8px 12px',
                            background:'var(--success-bg)',
                            borderRadius:'var(--radius-sm)',
                            fontSize:12, color:'var(--success)',
                          }}>
                            <strong>Motif :</strong> {a.justification}
                            {a.date_justification && (
                              <span style={{ marginLeft:8, opacity:.7 }}>
                                (le {formatDate(a.date_justification)})
                              </span>
                            )}
                          </div>
                        )}
                        {!a.justification && (
                          <div style={{
                            marginTop:10, padding:'8px 12px',
                            background:'var(--danger-bg)',
                            borderRadius:'var(--radius-sm)',
                            fontSize:12, color:'var(--danger)',
                          }}>
                            ⚠️ Cette absence n'est pas encore justifiée.
                            Contactez votre enseignant ou l'administration.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}