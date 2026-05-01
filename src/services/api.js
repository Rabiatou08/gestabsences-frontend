//const BASE = 'https://gestabsences-backend.onrender.com/api';
const BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const filieresAPI = {
  getAll:  ()      => request('/filieres'),
  create:  (body)  => request('/filieres',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, b) => request(`/filieres/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  remove:  (id)    => request(`/filieres/${id}`, { method: 'DELETE' }),
};

export const matieresAPI = {
  getAll:  ()      => request('/matieres'),
  create:  (body)  => request('/matieres',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, b) => request(`/matieres/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  remove:  (id)    => request(`/matieres/${id}`, { method: 'DELETE' }),
};

export const enseignantsAPI = {
  getAll:  ()      => request('/enseignants'),
  create:  (body)  => request('/enseignants',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, b) => request(`/enseignants/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  remove:  (id)    => request(`/enseignants/${id}`, { method: 'DELETE' }),
};

export const periodesAPI = {
  getAll:  ()      => request('/periodes'),
  create:  (body)  => request('/periodes',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, b) => request(`/periodes/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  remove:  (id)    => request(`/periodes/${id}`, { method: 'DELETE' }),
};

export const etudiantsAPI = {
  getAll:       ()      => request('/etudiants'),
  getByFiliere: (id)    => request(`/etudiants/filiere/${id}`),
  create:       (body)  => request('/etudiants',       { method: 'POST',   body: JSON.stringify(body) }),
  update:       (id, b) => request(`/etudiants/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  remove:       (id)    => request(`/etudiants/${id}`, { method: 'DELETE' }),
};

export const enseignementsAPI = {
  getAll:  ()      => request('/enseignements'),
  create:  (body)  => request('/enseignements',       { method: 'POST',   body: JSON.stringify(body) }),
  remove:  (id)    => request(`/enseignements/${id}`, { method: 'DELETE' }),
};

export const presencesAPI = {
  getBySeance:  (id)             => request(`/presences/${id}`),
  enregistrer:  (id, body)       => request(`/presences/${id}`,                     { method: 'POST', body: JSON.stringify(body) }),
  justifier:    (idS, idE, body) => request(`/presences/justifier/${idS}/${idE}`,   { method: 'PUT',  body: JSON.stringify(body) }),
};

export const justificationsAPI = {
  getAll:          ()                => request('/justifications'),
  getNonJustifiees:()                => request('/justifications/non-justifiees'),
  getJustifiees:   ()                => request('/justifications/justifiees'),
  justifier:       (idE, idEt, body) => request(`/justifications/${idE}/${idEt}`,   { method: 'PUT',  body: JSON.stringify(body) }),
};

export const editionsAPI = {
  matieresFiliere:    ()       => request('/editions/matieres-filiere'),
  absencesFiliere:    (params) => request(`/editions/absences-filiere?${new URLSearchParams(params)}`),
  absencesEtudiant:   (params) => request(`/editions/absences-etudiant?${new URLSearchParams(params)}`),
  absencesJustifiees: ()       => request('/editions/absences-justifiees'),
};

export const utilisateursAPI = {
  getAll:         ()        => request('/utilisateurs'),
  create:         (body)    => request('/utilisateurs',                { method: 'POST',   body: JSON.stringify(body) }),
  update:         (id, b)   => request(`/utilisateurs/${id}`,          { method: 'PUT',    body: JSON.stringify(b) }),
  updatePassword: (id, b)   => request(`/utilisateurs/${id}/password`, { method: 'PUT',    body: JSON.stringify(b) }),
  toggle:         (id)      => request(`/utilisateurs/${id}/toggle`,   { method: 'PUT' }),
  remove:         (id)      => request(`/utilisateurs/${id}`,          { method: 'DELETE' }),
};

export const statsAPI = {
  globales:           () => request('/stats/globales'),
  absencesParFiliere: () => request('/stats/absences-par-filiere'),
  absencesParMatiere: () => request('/stats/absences-par-matiere'),
  dernieresAbsences:  () => request('/stats/dernieres-absences'),
};

export const enseignantEspaceAPI = {
  seances:  (id) => request(`/enseignant-espace/seances/${id}`),
  absences: (id) => request(`/enseignant-espace/absences/${id}`),
  stats:    (id) => request(`/enseignant-espace/stats/${id}`),
};

export const etudiantEspaceAPI = {
  stats:    (id) => request(`/etudiant-espace/stats/${id}`),
  absences: (id) => request(`/etudiant-espace/absences/${id}`),
  seances:  (id) => request(`/etudiant-espace/seances/${id}`),
};

export const authAPI = {
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/auth/me'),
};

export const notificationsAPI = {
  sendAbsence:       (body) => request('/notifications/absence',       { method: 'POST', body: JSON.stringify(body) }),
  sendJustification: (body) => request('/notifications/justification',  { method: 'POST', body: JSON.stringify(body) }),
};