import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { matieresAPI, filieresAPI } from '../services/api';

const EMPTY = { nom_matiere: '', volume_horaire: '', code_filiere: '' };

export default function Matieres() {
  const toast = useToast();
  const [data, setData]         = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState('');
  const [filterFil, setFilterFil] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); loadFilieres(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await matieresAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  async function loadFilieres() {
    try { setFilieres(await filieresAPI.getAll()); }
    catch {}
  }

  const filtered = data.filter(m => {
    const matchSearch = m.nom_matiere.toLowerCase().includes(search.toLowerCase());
    const matchFil = !filterFil || String(m.code_filiere) === String(filterFil);
    return matchSearch && matchFil;
  });

  function validate() {
    const e = {};
    if (!form.nom_matiere.trim()) e.nom_matiere = 'Nom obligatoire';
    if (!form.code_filiere)       e.code_filiere = 'Filière obligatoire';
    if (form.volume_horaire !== '' && isNaN(form.volume_horaire))
      e.volume_horaire = 'Volume invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(m) {
    setForm({
      nom_matiere: m.nom_matiere,
      volume_horaire: String(m.volume_horaire),
      code_filiere: String(m.code_filiere),
    });
    setErrors({}); setEditId(m.code_matiere); setShowForm(true);
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
        nom_matiere: form.nom_matiere,
        volume_horaire: Number(form.volume_horaire) || 0,
        code_filiere: Number(form.code_filiere),
      };
      if (editId) {
        await matieresAPI.update(editId, body);
        toast('Matière modifiée ✓');
      } else {
        await matieresAPI.create(body);
        toast('Matière ajoutée ✓');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await matieresAPI.remove(toDelete);
      toast('Matière supprimée', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={20} color="var(--accent)" /> Matières
          </h1>
          <span className="page-badge">Paramétrage</span>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total matières</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Volume total</div>
            <div className="stat-value">{data.reduce((s, m) => s + (m.volume_horaire || 0), 0)}h</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Filières couvertes</div>
            <div className="stat-value">{new Set(data.map(m => m.code_filiere)).size}</div>
          </div>
        </div>

        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15} />
              {editId ? 'Modifier la matière' : 'Nouvelle matière'}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nom de la matière *</label>
                <input
                  className={`form-input ${errors.nom_matiere ? 'error' : ''}`}
                  name="nom_matiere"
                  value={form.nom_matiere}
                  onChange={onChange}
                  placeholder="ex: Développement Web"
                />
                {errors.nom_matiere && <span className="form-hint">{errors.nom_matiere}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Volume horaire (h)</label>
                <input
                  className={`form-input ${errors.volume_horaire ? 'error' : ''}`}
                  name="volume_horaire"
                  type="number"
                  min="0"
                  value={form.volume_horaire}
                  onChange={onChange}
                  placeholder="40"
                />
                {errors.volume_horaire && <span className="form-hint">{errors.volume_horaire}</span>}
              </div>
            </div>
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Filière *</label>
                <select
                  className={`form-select ${errors.code_filiere ? 'error' : ''}`}
                  name="code_filiere"
                  value={form.code_filiere}
                  onChange={onChange}
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
              <BookOpen size={15} /> Liste des matières
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
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>Chargement...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Filière</th>
                    <th>Volume</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5}><div className="empty-state"><p>Aucune matière</p></div></td></tr>
                  )}
                  {filtered.map(m => (
                    <tr key={m.code_matiere}>
                      <td><span className="td-mono">{m.code_matiere}</span></td>
                      <td style={{ fontWeight: 500 }}>{m.nom_matiere}</td>
                      <td><span className="badge badge-info">{m.libele_filiere || '—'}</span></td>
                      <td><span className="badge badge-warn">{m.volume_horaire}h</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>
                            <Pencil size={12} /> Modifier
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setToDelete(m.code_matiere)}>
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
          title="Supprimer la matière ?"
          message="Cette matière sera supprimée définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}