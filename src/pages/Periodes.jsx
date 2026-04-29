import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { periodesAPI } from '../services/api';

const EMPTY = { libelle: '', date_debut: '', date_fin: '' };

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR');
}

function getStatut(dateDebut, dateFin) {
  const now = new Date();
  const d = new Date(dateDebut);
  const f = new Date(dateFin);
  if (now < d) return { label: 'À venir',  cls: 'badge-warn' };
  if (now > f) return { label: 'Terminée', cls: 'badge-info' };
  return           { label: 'En cours',   cls: 'badge-success' };
}

export default function Periodes() {
  const toast = useToast();
  const [data, setData]         = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [editId, setEditId]     = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await periodesAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  function validate() {
    const e = {};
    if (!form.libelle.trim())  e.libelle    = 'Libellé obligatoire';
    if (!form.date_debut)      e.date_debut = 'Date de début obligatoire';
    if (!form.date_fin)        e.date_fin   = 'Date de fin obligatoire';
    if (form.date_debut && form.date_fin && form.date_debut >= form.date_fin)
      e.date_fin = 'La date de fin doit être après la date de début';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      libelle: p.libelle,
      date_debut: p.date_debut.slice(0, 10),
      date_fin: p.date_fin.slice(0, 10),
    });
    setErrors({}); setEditId(p.id_periode); setShowForm(true);
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
        await periodesAPI.update(editId, form);
        toast('Période modifiée ✓');
      } else {
        await periodesAPI.create(form);
        toast('Période ajoutée ✓');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await periodesAPI.remove(toDelete);
      toast('Période supprimée', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  const enCours = data.filter(p => {
    const now = new Date();
    return new Date(p.date_debut) <= now && now <= new Date(p.date_fin);
  }).length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="var(--accent)" /> Périodes d'évaluation
          </h1>
          <span className="page-badge">Paramétrage</span>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total périodes</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">En cours</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{enCours}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Terminées</div>
            <div className="stat-value">
              {data.filter(p => new Date(p.date_fin) < new Date()).length}
            </div>
          </div>
        </div>

        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15} />
              {editId ? 'Modifier la période' : 'Nouvelle période'}
            </div>
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Libellé *</label>
                <input
                  className={`form-input ${errors.libelle ? 'error' : ''}`}
                  name="libelle" value={form.libelle} onChange={onChange}
                  placeholder="ex: Semestre 1 — 2025-2026"
                />
                {errors.libelle && <span className="form-hint">{errors.libelle}</span>}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Date de début *</label>
                <input
                  className={`form-input ${errors.date_debut ? 'error' : ''}`}
                  name="date_debut" type="date" value={form.date_debut} onChange={onChange}
                />
                {errors.date_debut && <span className="form-hint">{errors.date_debut}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Date de fin *</label>
                <input
                  className={`form-input ${errors.date_fin ? 'error' : ''}`}
                  name="date_fin" type="date" value={form.date_fin} onChange={onChange}
                />
                {errors.date_fin && <span className="form-hint">{errors.date_fin}</span>}
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
              <Calendar size={15} /> Liste des périodes
            </div>
            {!showForm && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> Ajouter
              </button>
            )}
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>Chargement...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.length === 0 && (
                <div className="empty-state"><Calendar size={32} /><p>Aucune période</p></div>
              )}
              {data.map(p => {
                const s = getStatut(p.date_debut, p.date_fin);
                const totalDays = Math.ceil((new Date(p.date_fin) - new Date(p.date_debut)) / 86400000);
                const elapsed = Math.max(0, Math.min(totalDays,
                  Math.ceil((new Date() - new Date(p.date_debut)) / 86400000)));
                const pct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;
                return (
                  <div key={p.id_periode} style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>{p.libelle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {formatDate(p.date_debut)} → {formatDate(p.date_fin)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setToDelete(p.id_periode)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, pct)}%`, height: '100%',
                          background: 'var(--accent)', borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 32, textAlign: 'right' }}>
                        {Math.min(100, pct)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Supprimer la période ?"
          message="Cette période sera supprimée définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}