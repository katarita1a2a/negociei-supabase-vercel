
import React from 'react';

const PremiumBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-md shadow-amber-500/20">
      <span className="material-symbols-outlined text-[14px] fill-1 text-white">verified</span>
      Premium
    </div>
  );
};

export default PremiumBadge;
