import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, Check, X as XIcon, Save,
  ChevronRight, AlertCircle, CheckCircle,
  MessageSquare, Mail
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import {
  filieresAPI, matieresAPI, enseignantsAPI,
  periodesAPI, enseignementsAPI, presencesAPI,
  notificationsAPI
} from '../services/api';

export default function Presences() {
  const toast = useToast();

  const [filieres,     setFilieres]     = useState([]);
  const [matieres,     setMatieres]     = useState([]);
  const [enseignants,  setEnseignants]  = useState([]);
  const [periodes,     setPeriodes]     = useState([]);
  const [seances,      setSeances]      = useState([]);
  const [seanceActive, setSeanceActive] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [form, setForm] = useState({
    date_enseignement: '',
    horaire: '',
    id_enseignant: '',
    code_filiere: '',
    id_periode: '',
    code_matiere: '',
  });
  const [etudiants,    setEtudiants]    = useState([]);
  const [presences,    setPresences]    = useState({});
  const [saving,       setSaving]       = useState(false);
  const [justifModal,  setJustifModal]  = useState(null);
  const [justifText,   setJustifText]   = useState('');
  const [emailModal,   setEmailModal]   = useState(null);
  const [emailDest,    setEmailDest]    = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadRef();
    loadSeances();
  }, []);

  async function loadRef() {
    try {
      const [f, m, ens, p] = await Promise.all([
        filieresAPI.getAll(),
        matieresAPI.getAll(),
        enseignantsAPI.getAll(),
        periodesAPI.getAll(),
      ]);
      setFilieres(f);
      setMatieres(m);
      setEnseignants(ens);
      setPeriodes(p);
    } catch {}
  }

  async function loadSeances() {
    try {
      setSeances(await enseignementsAPI.getAll());
    } catch {}
  }

  async function loadPresences(seance) {
    setSeanceActive(seance);
    try {
      const data = await presencesAPI.getBySeance(seance.id_enseignement);
      setEtudiants(data);
      const map = {};
      data.forEach(etud => {
        map[etud.id_etudiant] = etud.statut || 'present';
      });
      setPresences(map);
    } catch { toast('Erreur chargement présences', 'danger'); }
  }

  const onChangeForm = ev => {
    const { name, value } = ev.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  async function handleCreateSeance() {
    if (!form.date_enseignement || !form.horaire || !form.code_filiere || !form.code_matiere) {
      toast('Remplissez les champs obligatoires', 'danger'); return;
    }
    try {
      await enseignementsAPI.create({
        ...form,
        id_enseignant: form.id_enseignant || null,
        id_periode:    form.id_periode    || null,
        code_filiere:  Number(form.code_filiere),
        code_matiere:  Number(form.code_matiere),
      });
      toast('Séance créée ✓');
      setShowForm(false);
      setForm({
        date_enseignement: '', horaire: '', id_enseignant: '',
        code_filiere: '', id_periode: '', code_matiere: '',
      });
      loadSeances();
    } catch (err) { toast(err.message, 'danger'); }
  }

  function togglePresence(id) {
    setPresences(prev => ({
      ...prev,
      [id]: prev[id] === 'absent' ? 'present' : 'absent',
    }));
  }

  async function handleSavePresences() {
    if (!seanceActive) return;
    setSaving(true);
    try {
      const data = Object.entries(presences).map(([id_etudiant, statut]) => ({
        id_etudiant: Number(id_etudiant), statut,
      }));
      await presencesAPI.enregistrer(seanceActive.id_enseignement, { presences: data });
      toast('Présences enregistrées ✓');
      loadPresences(seanceActive);
    } catch (err) { toast(err.message, 'danger'); }
    finally { setSaving(false); }
  }

  async function handleJustifier() {
    if (!justifText.trim()) { toast('Saisissez un motif', 'danger'); return; }
    try {
      await presencesAPI.justifier(
        seanceActive.id_enseignement,
        justifModal.id_etudiant,
        { justification: justifText }
      );
      toast('Absence justifiée ✓');
      setJustifModal(null); setJustifText('');
      loadPresences(seanceActive);
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function handleSendEmail() {

    console.log('Envoi email pour', emailModal, 'destinataire:', emailDest);
    if (!emailDest.trim()) { toast('Email obligatoire', 'danger'); return; }
    setSendingEmail(true);
    try {
      await notificationsAPI.sendAbsence({
        id_etudiant:        emailModal.id_etudiant,
        id_enseignement:    seanceActive.id_enseignement,
        email_destinataire: emailDest,
      });
      toast('Email envoyé ✓');
      setEmailModal(null); setEmailDest('');
    } catch (err) { toast(err.message, 'danger'); }
    finally { setSendingEmail(false); }
  }

  const nbPresents = Object.values(presences).filter(s => s === 'present').length;
  const nbAbsents  = Object.values(presences).filter(s => s === 'absent').length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ClipboardList size={20} color="var(--accent)" /> Présences & Absences
          </h1>
          <span className="page-badge">Saisie</span>
        </div>
      </div>

      <div className="page-body" style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>

        {/* Colonne gauche — séances */}
        <div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="card-title" style={{ marginBottom:0 }}>
                <ClipboardList size={15} /> Séances
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
                <Plus size={14} /> Nouvelle
              </button>
            </div>

            {showForm && (
              <div style={{ background:'var(--bg)', borderRadius:'var(--radius)', padding:14, marginBottom:16 }}>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date"
                    name="date_enseignement" value={form.date_enseignement} onChange={onChangeForm}/>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Horaire *</label>
                  <input className="form-input" type="time"
                    name="horaire" value={form.horaire} onChange={onChangeForm}/>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Filière *</label>
                  <select className="form-select" name="code_filiere"
                    value={form.code_filiere} onChange={onChangeForm}>
                    <option value="">— Choisir —</option>
                    {filieres.map(f => (
                      <option key={f.code_filiere} value={f.code_filiere}>{f.libele_filiere}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Matière *</label>
                  <select className="form-select" name="code_matiere"
                    value={form.code_matiere} onChange={onChangeForm}>
                    <option value="">— Choisir —</option>
                    {matieres.map(m => (
                      <option key={m.code_matiere} value={m.code_matiere}>{m.nom_matiere}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Enseignant</label>
                  <select className="form-select" name="id_enseignant"
                    value={form.id_enseignant} onChange={onChangeForm}>
                    <option value="">— Choisir —</option>
                    {enseignants.map(ens => (
                      <option key={ens.id_enseignant} value={ens.id_enseignant}>
                        {ens.nom} {ens.prenom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:14 }}>
                  <label className="form-label">Période</label>
                  <select className="form-select" name="id_periode"
                    value={form.id_periode} onChange={onChangeForm}>
                    <option value="">— Choisir —</option>
                    {periodes.map(p => (
                      <option key={p.id_periode} value={p.id_periode}>{p.libelle}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                    onClick={() => setShowForm(false)}>
                    <XIcon size={12}/> Annuler
                  </button>
                  <button className="btn btn-primary btn-sm" style={{ flex:1 }}
                    onClick={handleCreateSeance}>
                    <Save size={12}/> Créer
                  </button>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {seances.length === 0 && (
                <p style={{ textAlign:'center', color:'var(--text-3)', fontSize:13, padding:'20px 0' }}>
                  Aucune séance
                </p>
              )}
              {seances.map(s => (
                <div key={s.id_enseignement} onClick={() => loadPresences(s)}
                  style={{
                    padding:'10px 12px', borderRadius:'var(--radius)',
                    cursor:'pointer', transition:'all .15s',
                    border:`1px solid ${seanceActive?.id_enseignement === s.id_enseignement ? 'var(--accent)' : 'var(--border)'}`,
                    background: seanceActive?.id_enseignement === s.id_enseignement ? 'var(--accent-bg)' : 'var(--bg)',
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{s.nom_matiere}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{s.libele_filiere}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>
                        {new Date(s.date_enseignement).toLocaleDateString('fr-FR')} · {s.horaire?.slice(0,5)}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-3)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div>
          {!seanceActive ? (
            <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
              <ClipboardList size={40} color="var(--text-3)" style={{ margin:'0 auto 12px' }}/>
              <p style={{ color:'var(--text-3)', fontSize:14 }}>
                Sélectionnez une séance pour saisir les présences
              </p>
            </div>
          ) : (
            <div className="card">
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize:16, fontWeight:600 }}>{seanceActive.nom_matiere}</h2>
                    <p style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>
                      {seanceActive.libele_filiere} · {new Date(seanceActive.date_enseignement).toLocaleDateString('fr-FR')} · {seanceActive.horaire?.slice(0,5)}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={handleSavePresences} disabled={saving}>
                    <Save size={14}/> {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>

                <div style={{ display:'flex', gap:12, marginTop:16 }}>
                  <div style={{ flex:1, padding:'10px 14px', borderRadius:'var(--radius)', background:'var(--success-bg)', border:'1px solid #bbf7d0' }}>
                    <div style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>PRÉSENTS</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'var(--success)' }}>{nbPresents}</div>
                  </div>
                  <div style={{ flex:1, padding:'10px 14px', borderRadius:'var(--radius)', background:'var(--danger-bg)', border:'1px solid #fecaca' }}>
                    <div style={{ fontSize:11, color:'var(--danger)', fontWeight:600 }}>ABSENTS</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'var(--danger)' }}>{nbAbsents}</div>
                  </div>
                  <div style={{ flex:1, padding:'10px 14px', borderRadius:'var(--radius)', background:'var(--bg)', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>TOTAL</div>
                    <div style={{ fontSize:22, fontWeight:700 }}>{etudiants.length}</div>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  const map = {};
                  etudiants.forEach(etud => map[etud.id_etudiant] = 'present');
                  setPresences(map);
                }}>
                  <CheckCircle size={13}/> Tous présents
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  const map = {};
                  etudiants.forEach(etud => map[etud.id_etudiant] = 'absent');
                  setPresences(map);
                }}>
                  <AlertCircle size={13}/> Tous absents
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {etudiants.length === 0 && (
                  <p style={{ textAlign:'center', color:'var(--text-3)', padding:'30px 0', fontSize:13 }}>
                    Aucun étudiant dans cette filière
                  </p>
                )}
                {etudiants.map(etud => {
                  const statut  = presences[etud.id_etudiant] || 'present';
                  const present = statut === 'present';
                  return (
                    <div key={etud.id_etudiant} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 14px', borderRadius:'var(--radius)',
                      border:`1px solid ${present ? '#bbf7d0' : '#fecaca'}`,
                      background: present ? '#f0fdf4' : '#fff5f5',
                      transition:'all .15s',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:36, height:36, borderRadius:'50%',
                          background: present ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: present ? 'var(--success)' : 'var(--danger)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, flexShrink:0,
                        }}>
                          {(etud.prenom[0]||'').toUpperCase()}{(etud.nom[0]||'').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13.5 }}>{etud.nom} {etud.prenom}</div>
                          {etud.justification && (
                            <div style={{ fontSize:11, color:'var(--warn)', marginTop:2 }}>
                              Justifiée : {etud.justification}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {!present && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background:'#EFF4FF', color:'#2563EB', borderColor:'#BFCFFD' }}
                              onClick={() => { setEmailModal(etud); setEmailDest(''); }}
                            >
                              <Mail size={12}/> Email
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background:'var(--warn-bg)', color:'var(--warn)', borderColor:'#fde68a' }}
                              onClick={() => { setJustifModal(etud); setJustifText(etud.justification || ''); }}
                            >
                              <MessageSquare size={12}/> Justifier
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{
                            background: present ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: present ? 'var(--success)' : 'var(--danger)',
                            borderColor: present ? '#bbf7d0' : '#fecaca',
                            minWidth: 100,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 4,
                          }}
                          onClick={() => togglePresence(etud.id_etudiant)}
                        >
                          {present ? <Check size={13}/> : <XIcon size={13}/>}
                          <span>{present ? 'Présent' : 'Absent'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Email */}
      {emailModal && (
        <div className="overlay" onClick={() => setEmailModal(null)}>
          <div className="dialog" onClick={ev => ev.stopPropagation()}>
            <p className="dialog-title">
              Envoyer une notification d'absence
            </p>
            <p className="dialog-body">
              <strong>{emailModal.nom} {emailModal.prenom}</strong> — {seanceActive?.nom_matiere}
            </p>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Email du destinataire (parent/tuteur) *</label>
              <input
                className="form-input"
                type="email"
                value={emailDest}
                onChange={ev => setEmailDest(ev.target.value)}
                placeholder="parent@exemple.ci"
                autoFocus
              />
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setEmailModal(null)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendEmail}
                disabled={sendingEmail}
              >
                <Mail size={14}/> {sendingEmail ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Justification */}
      {justifModal && (
        <div className="overlay" onClick={() => setJustifModal(null)}>
          <div className="dialog" onClick={ev => ev.stopPropagation()}>
            <p className="dialog-title">
              Justifier l'absence de {justifModal.nom} {justifModal.prenom}
            </p>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Motif de l'absence</label>
              <textarea
                className="form-input"
                rows={4}
                style={{ resize:'vertical' }}
                placeholder="ex: Raison médicale, décès familial..."
                value={justifText}
                onChange={ev => setJustifText(ev.target.value)}
              />
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setJustifModal(null)}>
                Annuler
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