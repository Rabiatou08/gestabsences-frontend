import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <AlertTriangle size={18} color="var(--danger)" />
          <p className="dialog-title">{title}</p>
        </div>
        <p className="dialog-body">{message}</p>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onCancel}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
