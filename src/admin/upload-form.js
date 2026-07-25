// ====================================================================
// ====================================================================
// {1} COMPONENT: UPLOAD FORM (ADMIN)
// ====================================================================
// Manages the Drag & Drop zone for .pdb and audio files,
// and sends the multipart/form-data to the Cloudflare Worker API.
// ====================================================================

import { CONFIG } from '../shared/constants.js';

export class UploadForm {
  constructor(onSuccessCallback) {
    this.modal = document.getElementById('molecule-modal');
    this.form = document.getElementById('molecule-form');
    this.addBtn = document.getElementById('add-molecule-btn');
    this.cancelBtn = document.getElementById('cancel-btn');
    
    // Dropzones and inputs
    this.pdbDropzone = document.getElementById('pdb-dropzone');
    this.pdbInput = document.getElementById('mol-pdb');
    this.pdbFilenameLabel = document.getElementById('pdb-filename');

    this.audioDropzone = document.getElementById('audio-dropzone');
    this.audioInput = document.getElementById('mol-audio');
    this.audioFilenameLabel = document.getElementById('audio-filename');

    this.progressContainer = document.getElementById('upload-progress');
    this.progressFill = document.getElementById('upload-progress-fill');
    this.statusText = document.getElementById('upload-status');

    this.onSuccessCallback = onSuccessCallback;
    this.setupEventListeners();
  }

  // ====================================================================
  // {2} EVENT LISTENERS AND DRAG & DROP
  // ====================================================================
  setupEventListeners() {
    // Open/Close Modal
    this.addBtn.addEventListener('click', () => this.openModal());
    this.cancelBtn.addEventListener('click', () => this.closeModal());

    // Submit Form
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Drag & Drop for PDB
    this.setupDropzone(this.pdbDropzone, this.pdbInput, this.pdbFilenameLabel, ['.pdb']);
    
    // Drag & Drop for Audio
    this.setupDropzone(this.audioDropzone, this.audioInput, this.audioFilenameLabel, ['audio/']);
  }

  setupDropzone(dropzone, input, label, allowedTypes) {
    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
      dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        this.updateFileLabel(input, label);
      }
    });

    input.addEventListener('change', () => this.updateFileLabel(input, label));
  }

  updateFileLabel(input, label) {
    if (input.files.length) {
      label.textContent = `Selected file: ${input.files[0].name}`;
    } else {
      label.textContent = '';
    }
  }

  // ====================================================================
  // {3} MODAL HANDLERS
  // ====================================================================
  openModal() {
    this.form.reset();
    this.pdbFilenameLabel.textContent = '';
    this.audioFilenameLabel.textContent = '';
    this.progressContainer.classList.add('hidden');
    this.modal.classList.remove('hidden');
  }

  closeModal() {
    this.modal.classList.add('hidden');
  }

  // ====================================================================
  // {4} SUBMIT AND SEND TO WORKER (R2/KV)
  // ====================================================================
  async handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('mol-name').value;
    const description = document.getElementById('mol-description').value;
    const category = document.getElementById('mol-category').value;

    const pdbFile = this.pdbInput.files[0];
    const audioFile = this.audioInput.files[0];

    if (!pdbFile) {
      alert('Please select a required .pdb file.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('pdb', pdbFile);
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    try {
      this.showProgress('Uploading files to Cloudflare R2...');

      const response = await fetch(`${CONFIG.API_BASE_URL}/molecules`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload error');
      }

      const result = await response.json();
      this.closeModal();
      if (this.onSuccessCallback) {
        this.onSuccessCallback(result);
      }
    } catch (err) {
      console.error('[UploadForm] Error submitting form:', err);
      alert(`Error uploading molecule: ${err.message}`);
    } finally {
      this.hideProgress();
    }
  }

  showProgress(statusMessage) {
    this.progressContainer.classList.remove('hidden');
    this.statusText.textContent = statusMessage;
    this.progressFill.style.width = '100%';
  }

  hideProgress() {
    this.progressContainer.classList.add('hidden');
    this.progressFill.style.width = '0%';
  }
}
