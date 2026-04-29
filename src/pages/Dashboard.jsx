import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, UserCheck, GitBranch, BookOpen,
  ClipboardList, AlertCircle, CheckCircle, Users,
  TrendingUp, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend
} from 'recharts';
import { statsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0891B2'];

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [stats,        setStats]        = useState(null);
  const [absFiliere,   setAbsFiliere]   = useState([]);
  const [absMatiere,   setAbsMatiere]   = useState([]);
  const [dernieres,    setDernieres]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const [g, af, am, d] = await Promise.all([
        statsAPI.globales(),
        statsAPI.absencesParFiliere(),
        statsAPI.absencesParMatiere(),
        statsAPI.dernieresAbsences(),
      ]);
      setStats(g);
      setAbsFiliere(af);
      setAbsMatiere(am);
      setDernieres(d);
    } catch {}
    finally { setLoading(false); }
  }

  const tauxJustification = stats
    ? stats.absences > 0
      ? Math.round((stats.justifiees / stats.absences) * 100)
      : 0
    : 0;

  const statCards = stats ? [
    { label: 'Étudiants',   value: stats.etudiants,   icon: GraduationCap, color: '#2563EB', bg: '#EFF4FF', path: '/etudiants' },
    { label: 'Enseignants', value: stats.enseignants,  icon: UserCheck,     color: '#7C3AED', bg: '#F5F3FF', path: '/enseignants' },
    { label: 'Filières',    value: stats.filieres,     icon: GitBranch,     color: '#059669', bg: '#ECFDF5', path: '/filieres' },
    { label: 'Matières',    value: stats.matieres,     icon: BookOpen,      color: '#D97706', bg: '#FFFBEB', path: '/matieres' },
    { label: 'Séances',     value: stats.seances,      icon: ClipboardList, color: '#0891B2', bg: '#ECFEFF', path: '/presences' },
    { label: 'Absences',    value: stats.absences,     icon: AlertCircle,   color: '#E11D48', bg: '#FFF1F2', path: '/editions' },
    { label: 'Justifiées',  value: stats.justifiees,   icon: CheckCircle,   color: '#16A34A', bg: '#DCFCE7', path: '/justifications' },
    { label: 'Utilisateurs',value: stats.utilisateurs, icon: Users,         color: '#6B6760', bg: '#F5F4F0', path: '/utilisateurs' },
  ] : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>
              Bonjour, {user?.prenom} {user?.nom} 👋
            </p>
          </div>
          <span className="page-badge">Vue globale</span>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
            Chargement du tableau de bord...
          </p>
        ) : (
          <>
            {/* Cartes stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:24 }}>
              {statCards.map(s => (
                <div
                  key={s.label}
                  className="card"
                  style={{ cursor:'pointer', marginBottom:0, transition:'transform .15s, box-shadow .15s' }}
                  onClick={() => navigate(s.path)}
                  onMouseEnter={ev => {
                    ev.currentTarget.style.transform = 'translateY(-2px)';
                    ev.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)';
                  }}
                  onMouseLeave={ev => {
                    ev.currentTarget.style.transform = '';
                    ev.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{
                      width:38, height:38, borderRadius:10,
                      background:s.bg, display:'flex',
                      alignItems:'center', justifyContent:'center',
                    }}>
                      <s.icon size={18} color={s.color}/>
                    </div>
                    <ArrowRight size={14} color="var(--text-3)"/>
                  </div>
                  <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-.5px', color:s.color }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Taux de justification */}
            <div className="card" style={{ marginBottom:24 }}>
              <div className="card-title">
                <TrendingUp size={15}/> Taux de justification des absences
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    height:16, background:'var(--bg)',
                    borderRadius:8, overflow:'hidden',
                  }}>
                    <div style={{
                      width:`${tauxJustification}%`,
                      height:'100%',
                      background: tauxJustification > 70 ? 'var(--success)' :
                                  tauxJustification > 40 ? 'var(--warn)' : 'var(--danger)',
                      borderRadius:8,
                      transition:'width .5s',
                    }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>
                      {stats?.justifiees} justifiées / {stats?.absences} absences
                    </span>
                    <span style={{ fontSize:12, fontWeight:600 }}>{tauxJustification}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

              {/* Bar chart — absences par filière */}
              <div className="card">
                <div className="card-title">
                  <AlertCircle size={15}/> Absences par filière
                </div>
                {absFiliere.length === 0 ? (
                  <div className="empty-state"><AlertCircle size={32}/><p>Aucune donnée</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={absFiliere} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                      <XAxis dataKey="libele_filiere" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }}/>
                      <Tooltip
                        contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }}
                      />
                      <Bar dataKey="total_absences" name="Total" fill="#2563EB" radius={[4,4,0,0]}/>
                      <Bar dataKey="justifiees" name="Justifiées" fill="#16A34A" radius={[4,4,0,0]}/>
                      <Bar dataKey="non_justifiees" name="Non justifiées" fill="#E11D48" radius={[4,4,0,0]}/>
                      <Legend wrapperStyle={{ fontSize:11 }}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie chart — absences par matière */}
              <div className="card">
                <div className="card-title">
                  <BookOpen size={15}/> Absences par matière
                </div>
                {absMatiere.length === 0 ? (
                  <div className="empty-state"><BookOpen size={32}/><p>Aucune donnée</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={absMatiere}
                        dataKey="total_absences"
                        nameKey="nom_matiere"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ nom_matiere, percent }) =>
                          `${nom_matiere} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {absMatiere.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Dernières absences */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div className="card-title" style={{ marginBottom:0 }}>
                  <AlertCircle size={15}/> Dernières absences
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/editions')}>
                  Voir tout <ArrowRight size={12}/>
                </button>
              </div>
              {dernieres.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={32}/>
                  <p>Aucune absence enregistrée 🎉</p>
                </div>
              ) : (
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
                      {dernieres.map((a, i) => (
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
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}