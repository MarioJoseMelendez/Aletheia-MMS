// ====================================================================
// ====================================================================
// {1} SHARED CONSTANTS
// ====================================================================
// Global values used across the entire frontend.
// ====================================================================

// ====================================================================
// {2} WEBSOCKET EVENTS
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
// {3} VISUALIZATION STYLES
// ====================================================================
export const VISUALIZATION_STYLES = {
  SPHERES: 'spheres',
  BALL_AND_STICK: 'ball-and-stick',
  STICKS: 'sticks'
};

// ====================================================================
// {4} GENERAL CONFIGURATION
// ====================================================================
export const CONFIG = {
  API_BASE_URL: '/api',
  WS_BASE_URL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
};

// ====================================================================
// {5} CPK COLORS (Corey-Pauling-Koltun)
// ====================================================================
// Basic mapping of elements to hex colors
// ====================================================================
export const CPK_COLORS = {
  H: 0xFFFFFF, // Hydrogen - White
  C: 0x909090, // Carbon - Gray
  O: 0xFF0D0D, // Oxygen - Red
  N: 0x3050F8, // Nitrogen - Blue
  S: 0xFFFF30, // Sulfur - Yellow
  P: 0xFF8000, // Phosphorus - Orange
  // Fallback for other elements
  DEFAULT: 0xFF1493 // Bright pink to detect unmapped elements
};
