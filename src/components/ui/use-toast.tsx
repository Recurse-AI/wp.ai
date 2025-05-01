import { useCallback } from 'react';
import { toast as hotToast } from 'react-hot-toast';

type ToastVariant = 'default' | 'success' | 'error' | 'destructive' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
      const getStyle = () => {
        switch (variant) {
          case 'success':
            return { 
              style: { 
                background: '#10B981', 
                color: 'white',
                fontWeight: 500
              } 
            };
          case 'error':
          case 'destructive':
            return { 
              style: { 
                background: '#EF4444', 
                color: 'white',
                fontWeight: 500
              } 
            };
          case 'warning':
            return { 
              style: { 
                background: '#F59E0B', 
                color: 'white',
                fontWeight: 500
              } 
            };
          default:
            return {};
        }
      };

      const content = (
        <div>
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="text-sm">{description}</div>}
        </div>
      );

      return hotToast(content, {
        duration,
        position: 'bottom-right',
        ...getStyle(),
      });
    },
    []
  );

  return { toast };
} 