// ====================================================================
// ====================================================================
// {1} LOADING SCREEN
// ====================================================================
// Simple controller to show/hide the loading overlay.
// The visual structure is defined purely in HTML/CSS so that
// the user can customize it without touching JavaScript.
// ====================================================================

export const loadingScreen = {
  element: document.getElementById('loading-screen'),

  show() {
    if (this.element) {
      this.element.classList.remove('hidden');
    }
  },

  hide() {
    if (this.element) {
      this.element.classList.add('hidden');
    }
  }
};
