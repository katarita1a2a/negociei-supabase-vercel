
import React from 'react';
import { DemandStatus } from '../types';

interface StatusBadgeProps {
  status: DemandStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles = {
    [DemandStatus.ABERTO]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [DemandStatus.EM_ANALISE]: 'bg-amber-50 text-amber-700 border-amber-100',
    [DemandStatus.FECHADO]: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const dots = {
    [DemandStatus.ABERTO]: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    [DemandStatus.EM_ANALISE]: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    [DemandStatus.FECHADO]: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${styles[status]} ${className}`}>
      <span className={`size-1.5 rounded-full ${dots[status]} animate-pulse`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
