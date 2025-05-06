import { Toast, IconTheme, Renderable } from 'react-hot-toast';
import { IconType } from 'react-icons';
import { FiCheck, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type ToastTheme = 'dark' | 'light' | 'system';

export interface ToastStyle {
  duration: number;
  style: {
    background: string;
    color: string;
    border: string;
    borderRadius?: string;
    padding?: string;
    boxShadow?: string;
    maxWidth?: string;
    fontSize?: string;
  };
  icon?: Renderable;
  position?: ToastPosition;
  className?: string;
  iconTheme?: IconTheme;
}

interface ThemeColors {
  background: string;
  text: string;
  border: string;
}

interface ToastTypeColors {
  success: ThemeColors;
  error: ThemeColors;
  info: ThemeColors;
  warning: ThemeColors;
  default: ThemeColors;
}

// Using a function to create icons to avoid JSX in the object declaration
const createIcons = () => ({
  success: React.createElement(FiCheck),
  error: React.createElement(FiX),
  info: React.createElement(FiInfo),
  warning: React.createElement(FiAlertTriangle),
  default: React.createElement(FiInfo),
});

const TOAST_ICONS = createIcons();

const THEME_COLORS: Record<ToastTheme, ToastTypeColors> = {
  dark: {
    success: { background: '#065f46', text: '#ffffff', border: '#047857' },
    error: { background: '#7f1d1d', text: '#ffffff', border: '#991b1b' },
    info: { background: '#1e40af', text: '#ffffff', border: '#1e3a8a' },
    warning: { background: '#92400e', text: '#ffffff', border: '#b45309' },
    default: { background: '#1F2937', text: '#FFFFFF', border: '#374151' },
  },
  light: {
    success: { background: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    error: { background: '#fee2e2', text: '#7f1d1d', border: '#fecaca' },
    info: { background: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    warning: { background: '#fef3c7', text: '#92400e', border: '#fde68a' },
    default: { background: '#FFFFFF', text: '#000000', border: '#E5E7EB' },
  },
  system: {
    success: { background: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    error: { background: '#fee2e2', text: '#7f1d1d', border: '#fecaca' },
    info: { background: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    warning: { background: '#fef3c7', text: '#92400e', border: '#fde68a' },
    default: { background: '#FFFFFF', text: '#000000', border: '#E5E7EB' },
  },
};

export interface ToastOptions {
  type?: ToastType;
  theme?: ToastTheme;
  duration?: number;
  position?: ToastPosition;
  icon?: Renderable | boolean;
  style?: Partial<ToastStyle['style']>;
}

/**
 * Get toast style configuration based on provided options
 * 
 * @param options - Toast configuration options or theme string (for backward compatibility)
 * @returns ToastStyle configuration object
 */
export const getToastStyle = (options: ToastOptions | ToastTheme | undefined = {}): ToastStyle => {
  // Handle backward compatibility with old usage: getToastStyle(theme)
  let opts: ToastOptions;
  
  if (typeof options === 'string') {
    opts = { theme: options as ToastTheme };
  } else {
    opts = options || {};
  }

  const {
    type = 'default',
    theme = 'dark',
    duration = 4000,
    position = 'top-right',
    icon = true,
    style = {},
  } = opts;

  // Determine if we should use system theme
  const effectiveTheme = theme === 'system' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  // Get colors for the selected theme and type
  const colors = THEME_COLORS[effectiveTheme as ToastTheme][type];

  return {
    duration,
    position,
    icon: icon === true ? TOAST_ICONS[type] : (icon || undefined),
    style: {
      background: colors.background,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxWidth: '350px',
      fontSize: '14px',
      ...style,
    },
  };
};

/**
 * Helper function to create toast configurations for specific types
 */
export const createToast = {
  success: (options: Omit<ToastOptions, 'type'> | ToastTheme | undefined = {}) => 
    getToastStyle(typeof options === 'string' ? { theme: options, type: 'success' } : { ...options, type: 'success' }),
  error: (options: Omit<ToastOptions, 'type'> | ToastTheme | undefined = {}) => 
    getToastStyle(typeof options === 'string' ? { theme: options, type: 'error' } : { ...options, type: 'error' }),
  info: (options: Omit<ToastOptions, 'type'> | ToastTheme | undefined = {}) => 
    getToastStyle(typeof options === 'string' ? { theme: options, type: 'info' } : { ...options, type: 'info' }),
  warning: (options: Omit<ToastOptions, 'type'> | ToastTheme | undefined = {}) => 
    getToastStyle(typeof options === 'string' ? { theme: options, type: 'warning' } : { ...options, type: 'warning' }),
  default: (options: Omit<ToastOptions, 'type'> | ToastTheme | undefined = {}) => 
    getToastStyle(typeof options === 'string' ? { theme: options, type: 'default' } : { ...options, type: 'default' }),
};