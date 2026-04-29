import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { filieresAPI } from '../services/api';

const EMPTY = { libele_filiere: '', nbre_etudiant: '' };

export default function Filieres() {
  const toast = useToast();
  const [data, setData]         = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await filieresAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  const filtered = data.filter(f =>
    f.libele_filiere.toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e = {};
    if (!form.libele_filiere.trim()) e.libele_filiere = 'Libellé obligatoire';
    if (form.nbre_etudiant !== '' && isNaN(form.nbre_etudiant))
      e.nbre_etudiant = 'Nombre invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(f) {
    setForm({ libele_filiere: f.libele_filiere, nbre_etudiant: String(f.nbre_etudiant) });
    setErrors({}); setEditId(f.code_filiere); setShowForm(true);
  }

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const body = {
        libele_filiere: form.libele_filiere,
        nbre_etudiant: Number(form.nbre_etudiant) || 0,
      };
      if (editId) {
        await filieresAPI.update(editId, body);
        toast('Filière modifiée ✓');
      } else {
        await filieresAPI.create(body);
        toast('Filière ajoutée ✓');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await filieresAPI.remove(toDelete);
      toast('Filière supprimée', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch size={20} color="var(--accent)" /> Filières
          </h1>
          <span className="page-badge">Paramétrage</span>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total filières</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total étudiants</div>
            <div className="stat-value">{data.reduce((s, f) => s + (f.nbre_etudiant || 0), 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Moy. / filière</div>
            <div className="stat-value">
              {data.length ? Math.round(data.reduce((s, f) => s + (f.nbre_etudiant || 0), 0) / data.length) : 0}
            </div>
          </div>
        </div>

        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15} />
              {editId ? 'Modifier la filière' : 'Nouvelle filière'}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Libellé *</label>
                <input
                  className={`form-input ${errors.libele_filiere ? 'error' : ''}`}
                  name="libele_filiere"
                  value={form.libele_filiere}
                  onChange={onChange}
                  placeholder="ex: Master 2 MBDS"
                />
                {errors.libele_filiere && <span className="form-hint">{errors.libele_filiere}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nombre d'étudiants</label>
                <input
                  className={`form-input ${errors.nbre_etudiant ? 'error' : ''}`}
                  name="nbre_etudiant"
                  type="number"
                  min="0"
                  value={form.nbre_etudiant}
                  onChange={onChange}
                  placeholder="30"
                />
                {errors.nbre_etudiant && <span className="form-hint">{errors.nbre_etudiant}</span>}
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                <X size={14} /> Annuler
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Save size={14} /> {editId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <GitBranch size={15} /> Liste des filières
            </div>
            {!showForm && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> Ajouter
              </button>
            )}
          </div>
          <div className="filter-bar">
            <div className="search-input">
              <Search size={14} />
              <input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>Chargement...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Libellé</th>
                    <th>Nb étudiants</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={4}><div className="empty-state"><p>Aucune filière</p></div></td></tr>
                  )}
                  {filtered.map(f => (
                    <tr key={f.code_filiere}>
                      <td><span className="td-mono">{f.code_filiere}</span></td>
                      <td style={{ fontWeight: 500 }}>{f.libele_filiere}</td>
                      <td><span className="badge badge-info">{f.nbre_etudiant} étudiant(s)</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>
                            <Pencil size={12} /> Modifier
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setToDelete(f.code_filiere)}>
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Supprimer la filière ?"
          message="Cette filière sera supprimée définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}