// ====================================================================
// ====================================================================
// {1} ADMIN PANEL — ENTRY POINT
// ====================================================================
// Loads the molecule list from Cloudflare KV, initializes the
// upload form, and renders the admin table.
// ====================================================================

import { UploadForm } from './upload-form.js';
import { CONFIG } from '../shared/constants.js';

class AdminPanel {
  constructor() {
    this.tbody = document.getElementById('molecules-tbody');
    this.toastContainer = document.getElementById('toast-container');
    
    this.uploadForm = new UploadForm((newMolecule) => {
      this.showToast(`Molecule "${newMolecule.name}" created successfully`);
      this.loadMolecules();
    });

    this.init();
  }

  // ====================================================================
  // {2} LOAD MOLECULES FROM WORKER / KV
  // ====================================================================
  async loadMolecules() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/molecules`);
      if (!res.ok) throw new Error('Error loading molecules');
      const data = await res.json();
      this.renderTable(data.molecules || []);
    } catch (err) {
      console.error('[Admin] Error loading table:', err);
      this.showToast('Error loading molecule list', 'error');
    }
  }

  // ====================================================================
  // {3} TABLE RENDERING
  // ====================================================================
  renderTable(molecules) {
    this.tbody.innerHTML = '';

    if (molecules.length === 0) {
      this.tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table">No molecules registered yet. Click "+ New Molecule".</td>
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
        <td>${mol.audioFile ? '🎵 Yes' : '❌ No'}</td>
        <td>${dateStr}</td>
        <td>
          <button class="icon-btn delete-btn" data-id="${mol.id}">Delete</button>
        </td>
      `;

      // Event listener for delete
      const delBtn = tr.querySelector('.delete-btn');
      delBtn.addEventListener('click', () => this.deleteMolecule(mol));

      this.tbody.appendChild(tr);
    });
  }

  // ====================================================================
  // {4} CRUD ACTIONS (DELETE)
  // ====================================================================
  async deleteMolecule(mol) {
    if (!confirm(`Are you sure you want to delete "${mol.name}"?`)) {
      return;
    }

    // NOTE: To delete, the DELETE route will be added in the final polish version if required
    this.showToast(`Delete "${mol.name}" is not enabled in demo`, 'info');
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
    console.log('[Aletheia] Admin Panel initialized');
    this.loadMolecules();
  }
}

window.addEventListener('DOMContentLoaded', () => new AdminPanel());
