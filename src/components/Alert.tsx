import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const styles = {
    error: {
      container: 'bg-rose-50/90 border-rose-200 text-rose-950',
      iconBox: 'bg-rose-100 text-rose-700',
      icon: AlertCircle,
      closeBtn: 'text-rose-400 hover:text-rose-700 hover:bg-rose-100/60'
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
      iconBox: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle2,
      closeBtn: 'text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100/60'
    },
    warning: {
      container: 'bg-amber-50/90 border-amber-200 text-amber-950',
      iconBox: 'bg-amber-100 text-amber-800',
      icon: AlertTriangle,
      closeBtn: 'text-amber-400 hover:text-amber-800 hover:bg-amber-100/60'
    },
    info: {
      container: 'bg-slate-50 border-slate-200 text-slate-900',
      iconBox: 'bg-slate-200/80 text-slate-700',
      icon: Info,
      closeBtn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
    }
  }[variant];

  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed animate-fade-in shadow-sm ${styles.container} ${className}`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.iconBox}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && <h4 className="font-bold text-xs mb-0.5">{title}</h4>}
        <div className="font-medium text-slate-700">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-md transition-colors flex-shrink-0 -mr-1 -mt-1 ${styles.closeBtn}`}
          aria-label="Tutup notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
