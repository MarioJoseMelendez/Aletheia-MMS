// ====================================================================
// ====================================================================
// {1} CONSTANTES COMPARTIDAS
// ====================================================================
// Valores globales utilizados en todo el frontend.
// ====================================================================

// ====================================================================
// {2} EVENTOS WEBSOCKET
// ====================================================================
export const WS_EVENTS = {
  SELECT_MOLECULE: 'select-molecule',
  CAMERA_UPDATE: 'camera-update',
  STYLE_CHANGE: 'style-change',
  AUDIO_CONTROL: 'audio-control',
  RESET_VIEW: 'reset-view',
  DISPLAY_STATUS: 'display-status',
  RELOAD_DISPLAY: 'reload-display'
};

// ====================================================================
// {3} ESTILOS DE VISUALIZACIÓN
// ====================================================================
export const VISUALIZATION_STYLES = {
  SPHERES: 'spheres',
  BALL_AND_STICK: 'ball-and-stick',
  STICKS: 'sticks'
};

// ====================================================================
// {4} CONFIGURACIÓN GENERAL
// ====================================================================
export const CONFIG = {
  API_BASE_URL: '/api',
  WS_BASE_URL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
};

// ====================================================================
// {5} COLORES CPK (Corey-Pauling-Koltun)
// ====================================================================
// Mapeo básico de elementos a colores hexadecimales
// ====================================================================
export const CPK_COLORS = {
  H: 0xFFFFFF, // Hidrógeno - Blanco
  C: 0x909090, // Carbono - Gris
  O: 0xFF0D0D, // Oxígeno - Rojo
  N: 0x3050F8, // Nitrógeno - Azul
  S: 0xFFFF30, // Azufre - Amarillo
  P: 0xFF8000, // Fósforo - Naranja
  // Fallback para otros elementos
  DEFAULT: 0xFF1493 // Rosa brillante para detectar elementos no mapeados
};
