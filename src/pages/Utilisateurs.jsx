import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Pencil, Trash2, Search,
  X, Save, Key, ToggleLeft, ToggleRight, Mail
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import { utilisateursAPI } from '../services/api';

const EMPTY = { nom: '', prenom: '', email: '', mot_de_passe: '', role: 'enseignant' };
const ROLES = ['admin', 'enseignant', 'etudiant', 'responsable'];

const ROLE_COLORS = {
  admin:        { bg: '#FFF1F2', color: '#E11D48' },
  enseignant:   { bg: '#EFF4FF', color: '#2563EB' },
  etudiant:     { bg: '#ECFDF5', color: '#059669' },
  responsable:  { bg: '#FFF7ED', color: '#D97706' },
};

const AVATAR_COLORS = [
  { bg: '#EFF4FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#FFF1F2', color: '#E11D48' },
];

export default function Utilisateurs() {
  const toast = useToast();
  const [data, setData]           = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [toDelete, setToDelete]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [pwdModal, setPwdModal]   = useState(null);
  const [newPwd, setNewPwd]       = useState('');
  const [showPwd, setShowPwd]     = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await utilisateursAPI.getAll());
    } catch { toast('Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }

  const filtered = data.filter(u => {
    const matchSearch = `${u.nom} ${u.prenom} ${u.email}`
      .toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  function validate() {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Nom obligatoire';
    if (!form.prenom.trim()) e.prenom = 'Prénom obligatoire';
    if (!form.email.trim())  e.email  = 'Email obligatoire';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email invalide';
    if (!editId && !form.mot_de_passe.trim())
      e.mot_de_passe = 'Mot de passe obligatoire';
    if (!editId && form.mot_de_passe.length < 6)
      e.mot_de_passe = 'Minimum 6 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY); setErrors({}); setEditId(null); setShowForm(true);
  }

  function openEdit(u) {
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, mot_de_passe: '', role: u.role });
    setErrors({}); setEditId(u.id_utilisateur); setShowForm(true);
  }

  const onChange = ev => {
    const { name, value } = ev.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  async function handleSubmit() {
    if (!validate()) return;
    try {
      if (editId) {
        await utilisateursAPI.update(editId, {
          nom: form.nom, prenom: form.prenom,
          email: form.email, role: form.role,
        });
        toast('Utilisateur modifié ✓');
      } else {
        await utilisateursAPI.create(form);
        toast('Utilisateur créé ✓');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
      load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleDelete() {
    try {
      await utilisateursAPI.remove(toDelete);
      toast('Utilisateur supprimé', 'danger');
      setToDelete(null); load();
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleToggle(id) {
    try {
      const result = await utilisateursAPI.toggle(id);
      setData(prev => prev.map(u =>
        u.id_utilisateur === id ? { ...u, actif: result.actif } : u
      ));
      toast(result.actif ? 'Compte activé ✓' : 'Compte désactivé');
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleChangePassword() {
    if (!newPwd.trim() || newPwd.length < 6) {
      toast('Minimum 6 caractères', 'danger'); return;
    }
    try {
      await utilisateursAPI.updatePassword(pwdModal.id_utilisateur, { mot_de_passe: newPwd });
      toast('Mot de passe modifié ✓');
      setPwdModal(null); setNewPwd('');
    } catch (err) { toast(err.message, 'danger'); }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Users size={20} color="var(--accent)" /> Gestion des utilisateurs
          </h1>
          <span className="page-badge">Administration</span>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns:'1fr 1fr 1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Admins</div>
            <div className="stat-value" style={{ color:'#E11D48' }}>
              {data.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Enseignants</div>
            <div className="stat-value" style={{ color:'var(--accent)' }}>
              {data.filter(u => u.role === 'enseignant').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Actifs</div>
            <div className="stat-value" style={{ color:'var(--success)' }}>
              {data.filter(u => u.actif).length}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="card">
            <div className="card-title">
              <Save size={15}/>
              {editId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
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
                <label className="form-label">Email *</label>
                <input className={`form-input ${errors.email ? 'error' : ''}`}
                  name="email" type="email" value={form.email} onChange={onChange}
                  placeholder="email@exemple.ci"/>
                {errors.email && <span className="form-hint">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select className="form-select" name="role" value={form.role} onChange={onChange}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {!editId && (
              <div className="form-grid cols-1">
                <div className="form-group">
                  <label className="form-label">Mot de passe *</label>
                  <input
                    className={`form-input ${errors.mot_de_passe ? 'error' : ''}`}
                    name="mot_de_passe" type="password" value={form.mot_de_passe}
                    onChange={onChange} placeholder="Minimum 6 caractères"/>
                  {errors.mot_de_passe && <span className="form-hint">{errors.mot_de_passe}</span>}
                </div>
              </div>
            )}
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                <X size={14}/> Annuler
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Save size={14}/> {editId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div className="card-title" style={{ marginBottom:0 }}>
              <Users size={15}/> Liste des utilisateurs
            </div>
            {!showForm && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14}/> Ajouter
              </button>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-input">
              <Search size={14}/>
              <input placeholder="Rechercher par nom ou email..."
                value={search} onChange={ev => setSearch(ev.target.value)}/>
            </div>
            <select className="form-select" style={{ width:'auto', minWidth:150 }}
              value={filterRole} onChange={ev => setFilterRole(ev.target.value)}>
              <option value="">Tous les rôles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p style={{ textAlign:'center', padding:30, color:'var(--text-3)' }}>Chargement...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state"><p>Aucun utilisateur trouvé</p></div>
                    </td></tr>
                  )}
                  {filtered.map((u, i) => {
                    const av   = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const role = ROLE_COLORS[u.role] || { bg:'var(--bg)', color:'var(--text)' };
                    return (
                      <tr key={u.id_utilisateur}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{
                              width:34, height:34, borderRadius:'50%',
                              background: av.bg, color: av.color,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12, fontWeight:700, flexShrink:0,
                            }}>
                              {(u.prenom[0]||'').toUpperCase()}{(u.nom[0]||'').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600 }}>{u.nom} {u.prenom}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-2)', fontSize:13 }}>
                            <Mail size={12}/>
                            {u.email}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            background: role.bg, color: role.color,
                            padding:'3px 10px', borderRadius:20,
                            fontSize:11.5, fontWeight:600,
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggle(u.id_utilisateur)}
                            style={{
                              display:'flex', alignItems:'center', gap:5,
                              background:'none', border:'none', cursor:'pointer',
                              color: u.actif ? 'var(--success)' : 'var(--text-3)',
                              fontSize:13, fontWeight:500,
                            }}
                          >
                            {u.actif
                              ? <ToggleRight size={20} color="var(--success)"/>
                              : <ToggleLeft size={20} color="var(--text-3)"/>
                            }
                            {u.actif ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td style={{ fontSize:12, color:'var(--text-3)' }}>
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ textAlign:'right' }}>
                          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                            <button
                              className="btn btn-sm"
                              style={{ background:'var(--warn-bg)', color:'var(--warn)', borderColor:'#fde68a' }}
                              onClick={() => { setPwdModal(u); setNewPwd(''); setShowPwd(false); }}
                            >
                              <Key size={12}/> MDP
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                              <Pencil size={12}/> Modifier
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setToDelete(u.id_utilisateur)}>
                              <Trash2 size={12}/> Supprimer
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

      {/* Modal changement mot de passe */}
      {pwdModal && (
        <div className="overlay" onClick={() => setPwdModal(null)}>
          <div className="dialog" onClick={ev => ev.stopPropagation()}>
            <p className="dialog-title">
              Changer le mot de passe
            </p>
            <p className="dialog-body">
              <strong>{pwdModal.nom} {pwdModal.prenom}</strong> — {pwdModal.email}
            </p>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Nouveau mot de passe *</label>
              <div style={{ position:'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={ev => setNewPwd(ev.target.value)}
                  placeholder="Minimum 6 caractères"
                  style={{ paddingRight:40 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position:'absolute', right:10, top:'50%',
                    transform:'translateY(-50%)', background:'none',
                    border:'none', cursor:'pointer', color:'var(--text-3)',
                  }}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setPwdModal(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleChangePassword}>
                <Key size={14}/> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Supprimer l'utilisateur ?"
          message="Cet utilisateur sera supprimé définitivement."
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}