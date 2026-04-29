import jsPDF from 'jspdf';

export function printRecuInscription(etudiant, compte) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GestAbsences', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Systeme de Gestion des Absences', pageWidth / 2, 28, { align: 'center' });

  // Titre
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("RECU D'INSCRIPTION", pageWidth / 2, 58, { align: 'center' });
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(20, 63, pageWidth - 20, 63);

  // Numéro et date
  const now = new Date();
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N Inscription : ETU-${String(etudiant.id_etudiant).padStart(4, '0')}`, 20, 75);
  doc.text(`Date : ${now.toLocaleDateString('fr-FR')}`, pageWidth - 20, 75, { align: 'right' });

  // Infos étudiant
  doc.setFillColor(239, 244, 255);
  doc.roundedRect(20, 82, pageWidth - 40, 68, 4, 4, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("INFORMATIONS DE L'ETUDIANT", 30, 95);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);

  const infos = [
    ['Nom & Prenom',  `${etudiant.nom} ${etudiant.prenom}`],
    ['Sexe',          etudiant.sexe === 'M' ? 'Masculin' : 'Feminin'],
    ['Filiere',       etudiant.libele_filiere || '—'],
    ['N Etudiant',    `ETU-${String(etudiant.id_etudiant).padStart(4, '0')}`],
  ];

  infos.forEach(([label, value], i) => {
    const y = 108 + i * 12;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, 30, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 100, y);
  });

  // Compte de connexion
  if (compte) {
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(20, 158, pageWidth - 40, 45, 4, 4, 'F');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPTE DE CONNEXION', 30, 171);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Email :', 30, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(compte.email, 70, 184);
    doc.setFont('helvetica', 'bold');
    doc.text('Mot de passe :', 30, 196);
    doc.setFont('helvetica', 'normal');
    doc.text(compte.mot_de_passe, 80, 196);
  }

  // Confirmation
  doc.setFillColor(239, 244, 255);
  doc.roundedRect(20, 212, pageWidth - 40, 18, 4, 4, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Inscription confirmee avec succes', pageWidth / 2, 224, { align: 'center' });

  // Année académique
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const annee = `${now.getFullYear()}-${now.getFullYear() + 1}`;
  doc.text(`Annee academique : ${annee}`, pageWidth / 2, 244, { align: 'center' });

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 252, pageWidth - 20, 252);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(
    'Ce document est genere automatiquement par GestAbsences',
    pageWidth / 2, 260, { align: 'center' }
  );
  doc.text(
    `Imprime le ${now.toLocaleDateString('fr-FR')} a ${now.toLocaleTimeString('fr-FR')}`,
    pageWidth / 2, 267, { align: 'center' }
  );

  doc.save(`recu_inscription_${etudiant.nom}_${etudiant.prenom}.pdf`);
}