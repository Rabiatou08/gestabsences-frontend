import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, Clock, Search, Save, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { justificationsAPI } from '../services/api';

const AVATAR_COLORS = [
  { bg: '#EFF4FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#FFF1F2', color: '#E11D48' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function Justifications() {
  const toast = useToast();
  const [nonJustifiees, setNonJustifiees] = useState([]);
  const [justifiees,    setJustifiees]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [onglet,        setOnglet]        = useState('non-justifiees');
  const [modal,         setModal]         = useState(null);
  const [motif,         setMotif]         = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const [nj, j] = await Promise.all([
        justificationsAPI.getNonJustifiees(),
        justificationsAPI.getJustifiees(),
      ]);
      setNonJustifiees(nj);
      setJustifiees(j);
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  const filteredNJ = nonJustifiees.filter(a =>
    `${a.nom_etudiant} ${a.prenom_etudiant}`.toLowerCase().includes(search.toLowerCase()) ||
    a.nom_matiere.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJ = justifiees.filter(a =>
    `${a.nom_etudiant} ${a.prenom_etudiant}`.toLowerCase().includes(search.toLowerCase()) ||
    a.nom_matiere.toLowerCase().includes(search.toLowerCase())
  );

  async function handleJustifier() {
    if (!motif.trim()) { toast('Motif obligatoire', 'danger'); return; }
    try {
      await justificationsAPI.justifier(
        modal.id_enseignement,
        modal.id_etudiant,
        { justification: motif }
      );
      toast('Absence justifiée ✓');
      setModal(null); setMotif('');
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <FileCheck size={20} color="var(--accent)" /> Justifications des absences
          </h1>
          <span className="page-badge">Saisie</span>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total absences</div>
            <div className="stat-value">{nonJustifiees.length + justifiees.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Non justifiées</div>
            <div className="stat-value" style={{ color:'var(--danger)' }}>
              {nonJustifiees.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Justifiées</div>
            <div className="stat-value" style={{ color:'var(--success)' }}>
              {justifiees.length}
            </div>
          </div>
        </div>

        <div className="card">
          {/* Onglets */}
          <div className="tabs">
            <div
              className={`tab ${onglet === 'non-justifiees' ? 'active' : ''}`}
              onClick={() => setOnglet('non-justifiees')}
            >
              <Clock size={14} style={{ display:'inline', marginRight:6 }}/>
              Non justifiées
              {nonJustifiees.length > 0 && (
                <span style={{
                  marginLeft:6, background:'var(--danger)', color:'#fff',
                  fontSize:10, padding:'1px 6px', borderRadius:10, fontWeight:700,
                }}>
                  {nonJustifiees.length}
                </span>
              )}
            </div>
            <div
              className={`tab ${onglet === 'justifiees' ? 'active' : ''}`}
              onClick={() => setOnglet('justifiees')}
            >
              <CheckCircle size={14} style={{ display:'inline', marginRight:6 }}/>
              Justifiées ({justifiees.length})
            </div>
          </div>

          {/* Recherche */}
          <div className="filter-bar">
            <div className="search-input">
              <Search size={14} />
              <input
                placeholder="Rechercher par étudiant ou matière..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Liste non justifiées */}
          {onglet === 'non-justifiees' && (
            <div>
              {loading && (
                <p style={{ textAlign:'center', padding:'30px', color:'var(--text-3)' }}>
                  Chargement...
                </p>
              )}
              {!loading && filteredNJ.length === 0 && (
                <div className="empty-state">
                  <CheckCircle size={36} />
                  <p>Aucune absence non justifiée 🎉</p>
                </div>
              )}
              {!loading && filteredNJ.map((a, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={`${a.id_etudiant}-${a.id_enseignement}`} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 0',
                    borderBottom:'1px solid var(--border)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:38, height:38, borderRadius:'50%',
                        background:av.bg, color:av.color,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, flexShrink:0,
                      }}>
                        {(a.prenom_etudiant[0]||'').toUpperCase()}
                        {(a.nom_etudiant[0]||'').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13.5 }}>
                          {a.nom_etudiant} {a.prenom_etudiant}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
                          {a.nom_matiere} · {a.libele_filiere}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>
                          {formatDate(a.date_enseignement)} à {a.horaire?.slice(0,5)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className="badge badge-danger">Non justifiée</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setModal(a); setMotif(''); }}
                      >
                        <FileCheck size={13} /> Justifier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Liste justifiées */}
          {onglet === 'justifiees' && (
            <div>
              {loading && (
                <p style={{ textAlign:'center', padding:'30px', color:'var(--text-3)' }}>
                  Chargement...
                </p>
              )}
              {!loading && filteredJ.length === 0 && (
                <div className="empty-state">
                  <FileCheck size={36} />
                  <p>Aucune absence justifiée</p>
                </div>
              )}
              {!loading && filteredJ.map((a, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={`${a.id_etudiant}-${a.id_enseignement}`} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 0',
                    borderBottom:'1px solid var(--border)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:38, height:38, borderRadius:'50%',
                        background:av.bg, color:av.color,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, flexShrink:0,
                      }}>
                        {(a.prenom_etudiant[0]||'').toUpperCase()}
                        {(a.nom_etudiant[0]||'').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13.5 }}>
                          {a.nom_etudiant} {a.prenom_etudiant}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
                          {a.nom_matiere} · {a.libele_filiere}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>
                          {formatDate(a.date_enseignement)} à {a.horaire?.slice(0,5)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <span className="badge badge-success">Justifiée</span>
                      <div style={{
                        fontSize:12, color:'var(--text-2)',
                        maxWidth:200, textAlign:'right',
                      }}>
                        {a.justification}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>
                        le {formatDate(a.date_justification)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal justification */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <p className="dialog-title">
              Justifier l'absence
            </p>
            <p className="dialog-body">
              <strong>{modal.nom_etudiant} {modal.prenom_etudiant}</strong><br/>
              {modal.nom_matiere} · {formatDate(modal.date_enseignement)}
            </p>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Motif de l'absence *</label>
              <textarea
                className="form-input"
                rows={4}
                style={{ resize:'vertical' }}
                placeholder="ex: Raison médicale, décès familial, problème de transport..."
                value={motif}
                onChange={e => setMotif(e.target.value)}
                autoFocus
              />
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>
                <X size={14}/> Annuler
              </button>
              <button className="btn btn-primary" onClick={handleJustifier}>
                <Save size={14}/> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}