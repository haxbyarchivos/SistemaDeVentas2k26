// Sistema de temas centralizado
// Este archivo contiene todos los colores del sistema para facilitar cambios futuros

export const themes = {
  dark: {
    // Fondos principales
    background: '#0a0a0a',
    backgroundAlt: '#121212',
    
    // Cards y contenedores
    cardBg: '#1a1a1a',
    cardBgHover: '#262626',
    cardBgActive: '#2d2d2d',
    modalBg: '#1a1a1a',
    
    // Textos
    text: '#ffffff',
    textMuted: '#999999',
    textDisabled: '#666666',
    
    // Bordes
    border: '#333333',
    borderLight: 'rgba(255,255,255,0.03)',
    borderDark: '#1a1a1a',
    
    // Sidebar
    sidebarBg: '#1a1a1a',
    sidebarBorder: '#333',
    sidebarItemActive: '#2d2d2d',
    sidebarItemHover: '#262626',
    
    // Inputs y formularios
    inputBg: '#1a1a1a',
    inputBorder: '#333',
    inputBorderFocus: '#555',
    inputText: '#ffffff',
    inputPlaceholder: '#c0b9c0',
    
    // Botones
    btnPrimary: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
    btnPrimaryHover: 'rgba(255,255,255,0.05)',
    btnPrimaryBorder: 'rgba(255,255,255,0.03)',
    btnDanger: '#c41e3a',
    btnDangerHover: '#a01830',
    btnGhost: 'transparent',
    
    // Estados
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    info: '#4da6ff',
    infoBg: 'rgba(77, 166, 255, 0.15)',
    
    // Colores específicos
    purple: '#8b5cf6',
    purpleBg: 'rgba(139, 92, 246, 0.15)',
    orange: '#f39c12',
    pink: '#cf30aa',
    blue: '#402fb5',
    
    // Tablas
    tableHeader: '#141414',
    tableBorder: 'rgba(255,255,255,0.03)',
    tableRowHover: '#141414',
    
    // Sombras
    shadowLight: '0 6px 18px rgba(0,0,0,0.6)',
    shadowMedium: '0 8px 20px rgba(0,0,0,0.4)',
    shadowHeavy: '0 16px 32px rgba(0,0,0,0.6)',
  },
  
  light: {
    // Fondos principales
    background: '#f5f5f5',
    backgroundAlt: '#ffffff',
    
    // Cards y contenedores
    cardBg: '#ffffff',
    cardBgHover: '#f9f9f9',
    cardBgActive: '#f0f0f0',
    modalBg: '#ffffff',
    
    // Textos
    text: '#000000',
    textMuted: '#666666',
    textDisabled: '#999999',
    
    // Bordes
    border: '#dddddd',
    borderLight: 'rgba(0,0,0,0.05)',
    borderDark: '#cccccc',
    
    // Sidebar
    sidebarBg: '#ffffff',
    sidebarBorder: '#e0e0e0',
    sidebarItemActive: '#f0f0f0',
    sidebarItemHover: '#f9f9f9',
    
    // Inputs y formularios
    inputBg: '#ffffff',
    inputBorder: '#dddddd',
    inputBorderFocus: '#999999',
    inputText: '#000000',
    inputPlaceholder: '#999999',
    
    // Botones
    btnPrimary: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))',
    btnPrimaryHover: 'rgba(0,0,0,0.05)',
    btnPrimaryBorder: 'rgba(0,0,0,0.1)',
    btnDanger: '#dc2626',
    btnDangerHover: '#b91c1c',
    btnGhost: 'transparent',
    
    // Estados
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.1)',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
    error: '#dc2626',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    info: '#2563eb',
    infoBg: 'rgba(37, 99, 235, 0.1)',
    
    // Colores específicos
    purple: '#7c3aed',
    purpleBg: 'rgba(124, 58, 237, 0.1)',
    orange: '#ea580c',
    pink: '#db2777',
    blue: '#3b82f6',
    
    // Tablas
    tableHeader: '#f9f9f9',
    tableBorder: 'rgba(0,0,0,0.05)',
    tableRowHover: '#f9f9f9',
    
    // Sombras
    shadowLight: '0 6px 18px rgba(0,0,0,0.1)',
    shadowMedium: '0 8px 20px rgba(0,0,0,0.08)',
    shadowHeavy: '0 16px 32px rgba(0,0,0,0.12)',
  }
}

// Hook para usar el tema actual
export function useTheme() {
  const currentTheme = localStorage.getItem('tema') || 'oscuro'
  return currentTheme === 'oscuro' ? themes.dark : themes.light
}

// Función para obtener tema sin hook (para uso fuera de componentes)
export function getTheme() {
  const currentTheme = localStorage.getItem('tema') || 'oscuro'
  return currentTheme === 'oscuro' ? themes.dark : themes.light
}

// Exportar por defecto el tema oscuro (actual)
export default themes.dark
