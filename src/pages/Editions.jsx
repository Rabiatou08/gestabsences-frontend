import React, { useState, useEffect } from 'react';
import {
  BarChart2, BookOpen, AlertCircle,
  GraduationCap, CheckCircle, Search, Filter, Printer
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { editionsAPI, filieresAPI, periodesAPI, etudiantsAPI } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function Editions() {
  const toast = useToast();
  const [onglet, setOnglet] = useState('matieres');

  const [filieres,  setFilieres]  = useState([]);
  const [periodes,  setPeriodes]  = useState([]);
  const [etudiants, setEtudiants] = useState([]);

  const [matieres,   setMatieres]   = useState([]);
  const [absFiliere, setAbsFiliere] = useState([]);
  const [absEtud,    setAbsEtud]    = useState([]);
  const [absJust,    setAbsJust]    = useState([]);

  const [filterFiliere,  setFilterFiliere]  = useState('');
  const [filterPeriode,  setFilterPeriode]  = useState('');
  const [filterEtudiant, setFilterEtudiant] = useState('');
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    loadRef();
    loadMatieres();
    loadAbsJust();
  }, []);

  async function loadRef() {
    try {
      const [f, p, e] = await Promise.all([
        filieresAPI.getAll(),
        periodesAPI.getAll(),
        etudiantsAPI.getAll(),
      ]);
      setFilieres(f); setPeriodes(p); setEtudiants(e);
    } catch {}
  }

  async function loadMatieres() {
    try {
      setLoading(true);
      setMatieres(await editionsAPI.matieresFiliere());
    } catch { toast('Erreur chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadAbsFiliere() {
    try {
      setLoading(true);
      const params = {};
      if (filterFiliere) params.code_filiere = filterFiliere;
      if (filterPeriode) params.id_periode   = filterPeriode;
      setAbsFiliere(await editionsAPI.absencesFiliere(params));
    } catch { toast('Erreur chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadAbsEtudiant() {
    try {
      setLoading(true);
      const params = {};
      if (filterEtudiant) params.id_etudiant = filterEtudiant;
      setAbsEtud(await editionsAPI.absencesEtudiant(params));
    } catch { toast('Erreur chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadAbsJust() {
    try {
      setAbsJust(await editionsAPI.absencesJustifiees());
    } catch {}
  }

  const matieresByFiliere = matieres.reduce((acc, m) => {
    const key = m.libele_filiere || 'Sans filière';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const filteredAbsFiliere = absFiliere.filter(a =>
    `${a.nom} ${a.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    a.nom_matiere.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAbsJust = absJust.filter(a =>
    `${a.nom} ${a.prenom}`.toLowerCase().includes(search.toLowerCase())
  );

  function exportPDFAbsFiliere() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des absences', pageWidth / 2, 18, { align: 'center' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [['Étudiant', 'Filière', 'Matière', 'Date', 'Statut']],
      body: filteredAbsFiliere.map(a => [
        `${a.nom} ${a.prenom}`,
        a.libele_filiere,
        a.nom_matiere,
        formatDate(a.date_enseignement),
        a.justification ? 'Justifiée' : 'Non justifiée',
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [239, 244, 255] },
      styles: { fontSize: 9 },
    });

    doc.save('absences_filiere.pdf');
  }

  function exportPDFEtudiant() {
    if (absEtud.length === 0) { toast('Aucune donnée à exporter', 'warn'); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const etud = absEtud[0];

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Absences — ${etud.nom} ${etud.prenom}`, pageWidth / 2, 18, { align: 'center' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filière : ${etud.libele_filiere}`, 14, 40);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 48);

    autoTable(doc, {
      startY: 56,
      head: [['Matière', 'Enseignant', 'Date', 'Horaire', 'Statut']],
      body: absEtud.map(a => [
        a.nom_matiere,
        `${a.nom_enseignant || ''} ${a.prenom_enseignant || ''}`,
        formatDate(a.date_enseignement),
        a.horaire?.slice(0, 5) || '—',
        a.justification ? 'Justifiée' : 'Non justifiée',
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [239, 244, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`absences_${etud.nom}_${etud.prenom}.pdf`);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BarChart2 size={20} color="var(--accent)" /> Éditions & Rapports
          </h1>
          <span className="page-badge">Éditions</span>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          <div className={`tab ${onglet==='matieres' ? 'active' : ''}`}
            onClick={() => { setOnglet('matieres'); loadMatieres(); }}>
            <BookOpen size={14}/> Matières par filière
          </div>
          <div className={`tab ${onglet==='absences-filiere' ? 'active' : ''}`}
            onClick={() => { setOnglet('absences-filiere'); loadAbsFiliere(); }}>
            <AlertCircle size={14}/> Absences par filière
          </div>
          <div className={`tab ${onglet==='absences-etudiant' ? 'active' : ''}`}
            onClick={() => { setOnglet('absences-etudiant'); loadAbsEtudiant(); }}>
            <GraduationCap size={14}/> Par étudiant
          </div>
          <div className={`tab ${onglet==='justifiees' ? 'active' : ''}`}
            onClick={() => { setOnglet('justifiees'); loadAbsJust(); }}>
            <CheckCircle size={14}/> Absences justifiées
          </div>
        </div>

        {/* ── Matières par filière ── */}
        {onglet === 'matieres' && (
          <div>
            {loading && (
              <p style={{ color:'var(--text-3)', textAlign:'center', padding:30 }}>Chargement...</p>
            )}
            {!loading && Object.entries(matieresByFiliere).map(([filiere, items]) => (
              <div key={filiere} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>
                    <BookOpen size={15}/> {filiere}
                    <span className="badge badge-info" style={{ marginLeft:8 }}>
                      {items.filter(i => i.nom_matiere).length} matière(s)
                    </span>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th>Volume horaire</th>
                        <th>Nb séances</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(i => i.nom_matiere).length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign:'center', color:'var(--text-3)', padding:20 }}>
                            Aucune matière
                          </td>
                        </tr>
                      )}
                      {items.filter(i => i.nom_matiere).map(m => (
                        <tr key={m.code_matiere}>
                          <td style={{ fontWeight:500 }}>{m.nom_matiere}</td>
                          <td><span className="badge badge-warn">{m.volume_horaire}h</span></td>
                          <td><span className="badge badge-info">{m.nb_seances} séance(s)</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {!loading && Object.keys(matieresByFiliere).length === 0 && (
              <div className="empty-state">
                <BookOpen size={36}/>
                <p>Aucune donnée disponible</p>
              </div>
            )}
          </div>
        )}

        {/* ── Absences par filière ── */}
        {onglet === 'absences-filiere' && (
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="card-title" style={{ marginBottom:0 }}>
                <AlertCircle size={15}/> Absences par filière et période
              </div>
              <button className="btn btn-primary btn-sm" onClick={exportPDFAbsFiliere}>
                <Printer size={13}/> Exporter PDF
              </button>
            </div>
            <div className="filter-bar">
              <select className="form-select" style={{ width:'auto', minWidth:180 }}
                value={filterFiliere}
                onChange={ev => setFilterFiliere(ev.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => (
                  <option key={f.code_filiere} value={f.code_filiere}>{f.libele_filiere}</option>
                ))}
              </select>
              <select className="form-select" style={{ width:'auto', minWidth:180 }}
                value={filterPeriode}
                onChange={ev => setFilterPeriode(ev.target.value)}>
                <option value="">Toutes les périodes</option>
                {periodes.map(p => (
                  <option key={p.id_periode} value={p.id_periode}>{p.libelle}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={loadAbsFiliere}>
                <Filter size={13}/> Filtrer
              </button>
              <div className="search-input" style={{ flex:1 }}>
                <Search size={14}/>
                <input placeholder="Rechercher..." value={search}
                  onChange={ev => setSearch(ev.target.value)}/>
              </div>
            </div>

            <div className="stats-row" style={{ gridTemplateColumns:'1fr 1fr 1fr', marginBottom:16 }}>
              <div className="stat-card">
                <div className="stat-label">Total absences</div>
                <div className="stat-value">{filteredAbsFiliere.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Non justifiées</div>
                <div className="stat-value" style={{ color:'var(--danger)' }}>
                  {filteredAbsFiliere.filter(a => !a.justification).length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Justifiées</div>
                <div className="stat-value" style={{ color:'var(--success)' }}>
                  {filteredAbsFiliere.filter(a => a.justification).length}
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <p style={{ textAlign:'center', padding:30, color:'var(--text-3)' }}>Chargement...</p>
              ) : (
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
                    {filteredAbsFiliere.length === 0 && (
                      <tr><td colSpan={5}>
                        <div className="empty-state"><p>Aucune absence trouvée</p></div>
                      </td></tr>
                    )}
                    {filteredAbsFiliere.map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{a.nom} {a.prenom}</td>
                        <td><span className="badge badge-info">{a.libele_filiere}</span></td>
                        <td>{a.nom_matiere}</td>
                        <td>{formatDate(a.date_enseignement)}</td>
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
              )}
            </div>
          </div>
        )}

        {/* ── Absences par étudiant ── */}
        {onglet === 'absences-etudiant' && (
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="card-title" style={{ marginBottom:0 }}>
                <GraduationCap size={15}/> Absences par étudiant
              </div>
              {absEtud.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={exportPDFEtudiant}>
                  <Printer size={13}/> Exporter PDF
                </button>
              )}
            </div>
            <div className="filter-bar">
              <select className="form-select" style={{ width:'auto', minWidth:220 }}
                value={filterEtudiant}
                onChange={ev => setFilterEtudiant(ev.target.value)}>
                <option value="">— Choisir un étudiant —</option>
                {etudiants.map(etud => (
                  <option key={etud.id_etudiant} value={etud.id_etudiant}>
                    {etud.nom} {etud.prenom} — {etud.libele_filiere}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={loadAbsEtudiant}>
                <Filter size={13}/> Afficher
              </button>
            </div>

            {!filterEtudiant && (
              <div className="empty-state">
                <GraduationCap size={36}/>
                <p>Sélectionnez un étudiant pour voir ses absences</p>
              </div>
            )}

            {filterEtudiant && !loading && absEtud.length === 0 && (
              <div className="empty-state">
                <GraduationCap size={36}/>
                <p>Aucune absence pour cet étudiant</p>
              </div>
            )}

            {absEtud.length > 0 && (
              <>
                <div className="stats-row" style={{ gridTemplateColumns:'1fr 1fr 1fr', marginBottom:16 }}>
                  <div className="stat-card">
                    <div className="stat-label">Total absences</div>
                    <div className="stat-value">{absEtud.length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Non justifiées</div>
                    <div className="stat-value" style={{ color:'var(--danger)' }}>
                      {absEtud.filter(a => !a.justification).length}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Justifiées</div>
                    <div className="stat-value" style={{ color:'var(--success)' }}>
                      {absEtud.filter(a => a.justification).length}
                    </div>
                  </div>
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
                      {absEtud.map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:500 }}>{a.nom_matiere}</td>
                          <td>
                            {a.nom_enseignant
                              ? `${a.nom_enseignant} ${a.prenom_enseignant}`
                              : <span style={{ color:'var(--text-3)' }}>—</span>
                            }
                          </td>
                          <td>{formatDate(a.date_enseignement)}</td>
                          <td>{a.horaire?.slice(0,5) || '—'}</td>
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
              </>
            )}
          </div>
        )}

        {/* ── Absences justifiées ── */}
        {onglet === 'justifiees' && (
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="card-title" style={{ marginBottom:0 }}>
                <CheckCircle size={15}/> Liste des absences justifiées
              </div>
            </div>
            <div className="filter-bar">
              <div className="search-input">
                <Search size={14}/>
                <input placeholder="Rechercher par étudiant..."
                  value={search} onChange={ev => setSearch(ev.target.value)}/>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Filière</th>
                    <th>Matière</th>
                    <th>Date absence</th>
                    <th>Motif</th>
                    <th>Date justification</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsJust.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state"><p>Aucune absence justifiée</p></div>
                    </td></tr>
                  )}
                  {filteredAbsJust.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{a.nom} {a.prenom}</td>
                      <td><span className="badge badge-info">{a.libele_filiere}</span></td>
                      <td>{a.nom_matiere}</td>
                      <td>{formatDate(a.date_enseignement)}</td>
                      <td style={{ maxWidth:200, color:'var(--text-2)', fontSize:12 }}>
                        {a.justification}
                      </td>
                      <td>{formatDate(a.date_justification)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}