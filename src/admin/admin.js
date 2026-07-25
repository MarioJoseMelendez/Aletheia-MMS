// ====================================================================
// ====================================================================
// {1} PANEL DE ADMINISTRACIÓN — ENTRY POINT
// ====================================================================
// Carga la lista de moléculas de Cloudflare KV, inicializa el 
// formulario de upload y renderiza la tabla administrativa.
// ====================================================================

import { UploadForm } from './upload-form.js';
import { CONFIG } from '../shared/constants.js';

class AdminPanel {
  constructor() {
    this.tbody = document.getElementById('molecules-tbody');
    this.toastContainer = document.getElementById('toast-container');
    
    this.uploadForm = new UploadForm((newMolecule) => {
      this.showToast(`Molécula "${newMolecule.name}" creada exitosamente`);
      this.loadMolecules();
    });

    this.init();
  }

  // ====================================================================
  // {2} CARGAR MOLÉCULAS DESDE WORKER / KV
  // ====================================================================
  async loadMolecules() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/molecules`);
      if (!res.ok) throw new Error('Error al cargar moléculas');
      const data = await res.json();
      this.renderTable(data.molecules || []);
    } catch (err) {
      console.error('[Admin] Error cargando tabla:', err);
      this.showToast('Error cargando la lista de moléculas', 'error');
    }
  }

  // ====================================================================
  // {3} RENDERIZADO DE TABLA
  // ====================================================================
  renderTable(molecules) {
    this.tbody.innerHTML = '';

    if (molecules.length === 0) {
      this.tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table">No hay moléculas registradas aún. Click en "+ Nueva Molécula".</td>
        </tr>
      `;
      return;
    }

    molecules.forEach(mol => {
      const tr = document.createElement('tr');
      const dateStr = mol.createdAt ? new Date(mol.createdAt).toLocaleDateString('es-ES') : '-';
      
      tr.innerHTML = `
        <td><strong>${mol.name}</strong></td>
        <td><span class="tag">${mol.category || 'General'}</span></td>
        <td>${mol.atomCount || 'Auto'}</td>
        <td>${mol.audioFile ? '🎵 Sí' : '❌ No'}</td>
        <td>${dateStr}</td>
        <td>
          <button class="icon-btn delete-btn" data-id="${mol.id}">Eliminar</button>
        </td>
      `;

      // Event listener para eliminar
      const delBtn = tr.querySelector('.delete-btn');
      delBtn.addEventListener('click', () => this.deleteMolecule(mol));

      this.tbody.appendChild(tr);
    });
  }

  // ====================================================================
  // {4} ACCIONES CRUD (DELETE)
  // ====================================================================
  async deleteMolecule(mol) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${mol.name}"?`)) {
      return;
    }

    // NOTA: Para eliminar se agregará la ruta DELETE en la versión final de polish si se requiere
    this.showToast(`Eliminar "${mol.name}" no está habilitado en demo`, 'info');
  }

  // ====================================================================
  // {5} TOAST NOTIFICATIONS
  // ====================================================================
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  init() {
    console.log('[Aletheia] Admin Panel inicializado');
    this.loadMolecules();
  }
}

window.addEventListener('DOMContentLoaded', () => new AdminPanel());
