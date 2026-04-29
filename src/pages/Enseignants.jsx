import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Search, X, Save, Printer } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { etudiantsAPI, filieresAPI } from '../services/api';
import { printRecuInscription } from '../utils/printRecu';

const EMPTY = { nom: '', prenom: '', sexe: 'M', code_filiere: '', email_parent: '' };

const AVATAR_COLORS = [
  { bg: '#EFF4FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#FFF1F2', color: '#E11D48' },
];

export default function Etudiants() {
  const toast = useToast();
  const [data, setData]           = useState([]);
  const [filieres, setFilieres]   = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');
  const [filterFil, setFilterFil] = useState('');
  const [toDelete, setToDelete]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { load(); loadFilieres(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await etudiantsAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadFilieres() {
    try { setFilieres(await filieresAPI.getAll()); }
    catch {}
  }

  const filtered = data.filter(e => {
    const matchSearch = `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase());
    const matchFil    = !filterFil || String(e.code_filiere) === String(filterFil);
    return matchSearch && matchFil;
  });

  function validate() {
    const e = {};
    if (!form.nom.trim())    e.nom          = 'Nom obligatoire';
    if (!form.prenom.trim()) e.prenom       = 'Prénom obligatoire';
    if (!form.code_filiere)  e.code_filiere = 'Filière obligatoire';
    if (form.email_parent && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_parent))
      e.email_parent = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(e) {
    setForm({
      nom: e.nom, prenom: e.prenom,
      sexe: e.sexe, code_filiere: String(e.code_filiere),
      email_parent: e.email_parent || '',
    });
    setErrors({}); setEditId(e.id_etudiant); setShowForm(true);
  }

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const body = { ...form, code_filiere: Number(form.code_filiere) };
      if (editId) {
        await etudiantsAPI.update(editId, body);
        toast('Étudiant modifié ✓');
        setShowForm(false); setForm(EMPTY); setEditId(null);
        load();
      } else {
        const result = await etudiantsAPI.create(body);
        toast('Étudiant inscrit ✓');
        setShowForm(false); setForm(EMPTY); setEditId(null);
        const all = await etudiantsAPI.getAll();
        setData(all);
        // Imprimer le reçu avec les infos du compte
        const found = all.find(e => e.id_etudiant === result.etudiant.id_etudiant);
        if (found) printRecuInscription(found, result.compte);
      }
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await etudiantsAPI.remove(toDelete);
      toast('Étudiant supprimé', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap size={20} color="var(--accent)" /> Étudiants
          </h1>
          <span className="page-badge">Saisie</span>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total étudiants</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Garçons</div>
            <div className="stat-value">{data.filter(e => e.sexe === 'M').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Filles</div>
            <div className="stat-value">{data.filter(e => e.sexe === 'F').length}</div>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15} />
              {editId ? "Modifier l'étudiant" : 'Inscrire un étudiant'}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  className={`form-input ${errors.nom ? 'error' : ''}`}
                  name="nom" value={form.nom} onChange={onChange}
                  placeholder="Nom de famille"
                />
                {errors.nom && <span className="form-hint">{errors.nom}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  className={`form-input ${errors.prenom ? 'error' : ''}`}
                  name="prenom" value={form.prenom} onChange={onChange}
                  placeholder="Prénom"
                />
                {errors.prenom && <span className="form-hint">{errors.prenom}</span>}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Sexe</label>
                <select className="form-select" name="sexe" value={form.sexe} onChange={onChange}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Filière *</label>
                <select
                  className={`form-select ${errors.code_filiere ? 'error' : ''}`}
                  name="code_filiere" value={form.code_filiere} onChange={onChange}
                >
                  <option value="">— Choisir une filière —</option>
                  {filieres.map(f => (
                    <option key={f.code_filiere} value={f.code_filiere}>
                      {f.libele_filiere}
                    </option>
                  ))}
                </select>
                {errors.code_filiere && <span className="form-hint">{errors.code_filiere}</span>}
              </div>
            </div>
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Email parent/tuteur</label>
                <input
                  className={`form-input ${errors.email_parent ? 'error' : ''}`}
                  name="email_parent" type="email" value={form.email_parent}
                  onChange={onChange} placeholder="parent@exemple.ci"
                />
                {errors.email_parent && <span className="form-hint">{errors.email_parent}</span>}
                <span style={{ fontSize:11, color:'var(--text-3)', marginTop:3 }}>
                  Utilisé pour les notifications d'absence
                </span>
              </div>
            </div>

            {!editId && (
              <div style={{
                background:'var(--accent-bg)', border:'1px solid var(--accent-bd)',
                borderRadius:'var(--radius-sm)', padding:'10px 14px',
                fontSize:12, color:'var(--accent)', marginBottom:14,
              }}>
                ℹ️ Un compte de connexion sera créé automatiquement pour l'étudiant.
                Les identifiants apparaîtront sur le reçu PDF.
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                <X size={14} /> Annuler
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Save size={14} /> {editId ? 'Mettre à jour' : 'Inscrire et imprimer reçu'}
              </button>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <GraduationCap size={15} /> Liste des étudiants
            </div>
            {!showForm && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> Inscrire
              </button>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-input">
              <Search size={14} />
              <input
                placeholder="Rechercher par nom ou prénom..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 180 }}
              value={filterFil}
              onChange={e => setFilterFil(e.target.value)}
            >
              <option value="">Toutes les filières</option>
              {filieres.map(f => (
                <option key={f.code_filiere} value={f.code_filiere}>
                  {f.libele_filiere}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>
                Chargement...
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Étudiant</th>
                    <th>Sexe</th>
                    <th>Filière</th>
                    <th>Email parent</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <GraduationCap size={32} />
                          <p>Aucun étudiant inscrit</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((e, i) => {
                    const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <tr key={e.id_etudiant}>
                        <td>
                          <span className="td-mono">
                            ETU-{String(e.id_etudiant).padStart(4, '0')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: av.bg, color: av.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 600, flexShrink: 0,
                            }}>
                              {(e.prenom[0]||'').toUpperCase()}{(e.nom[0]||'').toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 600 }}>{e.nom} {e.prenom}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${e.sexe === 'F' ? 'badge-warn' : 'badge-info'}`}>
                            {e.sexe === 'F' ? 'Fille' : 'Garçon'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-success">{e.libele_filiere || '—'}</span>
                        </td>
                        <td style={{ fontSize:12, color:'var(--text-3)' }}>
                          {e.email_parent || <span style={{ color:'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: 'var(--accent-bg)',
                                color: 'var(--accent)',
                                borderColor: 'var(--accent-bd)',
                              }}
                              onClick={() => printRecuInscription(e, null)}
                            >
                              <Printer size={12} /> Reçu
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>
                              <Pencil size={12} /> Modifier
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setToDelete(e.id_etudiant)}>
                              <Trash2 size={12} /> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Supprimer l'étudiant ?"
          message="L'étudiant et son compte de connexion seront supprimés définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}