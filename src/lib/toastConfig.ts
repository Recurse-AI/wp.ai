import { Toast } from 'react-hot-toast';

interface ToastStyle {
  duration: number;
  style: {
    background: string;
    color: string;
    border: string;
  };
}

export const getToastStyle = (theme: string): ToastStyle => ({
  duration: 4000,
  style: {
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    color: theme === 'dark' ? '#FFFFFF' : '#000000',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
  },
}); 