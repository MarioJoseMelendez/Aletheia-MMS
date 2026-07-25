// ====================================================================
// ====================================================================
// {1} PANTALLA DE CARGA (LOADING SCREEN)
// ====================================================================
// Controlador sencillo para mostrar/ocultar el overlay de carga.
// La estructura visual está definida puramente en HTML/CSS para que 
// el usuario pueda personalizarla sin tocar JavaScript.
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
