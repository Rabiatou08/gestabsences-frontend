import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Pencil, Trash2, Search, X, Save, Mail } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { enseignantsAPI } from '../services/api';

const EMPTY = { nom: '', prenom: '', mail: '', specialite: '', diplome: '', sexe: 'M' };
const DIPLOMES = ['Licence', 'Master', 'Ingénieur', 'Doctorat', 'HDR'];
const AVATAR_COLORS = [
  { bg: '#EFF4FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#FFF1F2', color: '#E11D48' },
];

export default function Enseignants() {
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
      setData(await enseignantsAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  const filtered = data.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.specialite || '').toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Nom obligatoire';
    if (!form.prenom.trim()) e.prenom = 'Prénom obligatoire';
    if (form.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail))
      e.mail = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(e) {
    setForm({ nom: e.nom, prenom: e.prenom, mail: e.mail || '',
      specialite: e.specialite || '', diplome: e.diplome || '', sexe: e.sexe || 'M' });
    setErrors({}); setEditId(e.id_enseignant); setShowForm(true);
  }

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  async function handleSubmit() {
    if (!validate()) return;
    try {
      if (editId) {
        await enseignantsAPI.update(editId, form);
        toast('Enseignant modifié ✓');
      } else {
        await enseignantsAPI.create(form);
        toast('Enseignant ajouté ✓');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await enseignantsAPI.remove(toDelete);
      toast('Enseignant supprimé', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={20} color="var(--accent)" /> Enseignants
          </h1>
          <span className="page-badge">Paramétrage</span>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total enseignants</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Docteurs / HDR</div>
            <div className="stat-value">
              {data.filter(e => e.diplome === 'Doctorat' || e.diplome === 'HDR').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Femmes</div>
            <div className="stat-value">{data.filter(e => e.sexe === 'F').length}</div>
          </div>
        </div>

        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15} />
              {editId ? "Modifier l'enseignant" : 'Nouvel enseignant'}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input className={`form-input ${errors.nom ? 'error' : ''}`}
                  name="nom" value={form.nom} onChange={onChange} placeholder="Nom"/>
                {errors.nom && <span className="form-hint">{errors.nom}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input className={`form-input ${errors.prenom ? 'error' : ''}`}
                  name="prenom" value={form.prenom} onChange={onChange} placeholder="Prénom"/>
                {errors.prenom && <span className="form-hint">{errors.prenom}</span>}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className={`form-input ${errors.mail ? 'error' : ''}`}
                  name="mail" type="email" value={form.mail} onChange={onChange}
                  placeholder="email@univ.ci"/>
                {errors.mail && <span className="form-hint">{errors.mail}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Sexe</label>
                <select className="form-select" name="sexe" value={form.sexe} onChange={onChange}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Spécialité</label>
                <input className="form-input" name="specialite" value={form.specialite}
                  onChange={onChange} placeholder="ex: Informatique"/>
              </div>
              <div className="form-group">
                <label className="form-label">Diplôme</label>
                <select className="form-select" name="diplome" value={form.diplome} onChange={onChange}>
                  <option value="">— Choisir —</option>
                  {DIPLOMES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
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
              <UserCheck size={15} /> Liste des enseignants
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
              <input placeholder="Rechercher par nom, spécialité..."
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>Chargement...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Enseignant</th>
                    <th>Email</th>
                    <th>Spécialité</th>
                    <th>Diplôme</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5}><div className="empty-state"><p>Aucun enseignant</p></div></td></tr>
                  )}
                  {filtered.map((e, i) => {
                    const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <tr key={e.id_enseignant}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: av.bg, color: av.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 600, flexShrink: 0,
                            }}>
                              {(e.prenom[0] || '').toUpperCase()}{(e.nom[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{e.nom} {e.prenom}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                                {e.sexe === 'F' ? 'Femme' : 'Homme'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}>
                            <Mail size={12} />
                            {e.mail || <span style={{ color: 'var(--text-3)' }}>—</span>}
                          </div>
                        </td>
                        <td>{e.specialite || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                        <td>
                          {e.diplome
                            ? <span className="badge badge-success">{e.diplome}</span>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>
                              <Pencil size={12} /> Modifier
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setToDelete(e.id_enseignant)}>
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
          title="Supprimer l'enseignant ?"
          message="Cet enseignant sera supprimé définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}