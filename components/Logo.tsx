
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  theme = 'light'
}) => {
  // Alturas proporcionais para manter a legibilidade em diferentes contextos
  const heights = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20'
  };

  /**
   * Esta URL deve apontar para o arquivo de imagem que você carregou.
   * Como engenheiro, recomendo salvar a imagem como 'logo-completa.png' na sua pasta de assets.
   */
  const logoUrl = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/negociei-logo-completa.png"; 

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img 
        src={logoUrl} 
        alt="Negociei.app" 
        className={`${heights[size]} w-auto object-contain transition-all duration-300 ${theme === 'dark' ? 'brightness-0 invert' : ''}`}
        style={{ maxWidth: '100%' }}
        onError={(e) => {
          // Fallback elegante caso a imagem falhe (exibe texto estilizado)
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const textSpan = document.createElement('span');
          textSpan.className = "font-black text-2xl text-primary tracking-tighter flex items-center gap-2";
          textSpan.innerHTML = `<span class="material-symbols-outlined fill-1">handshake</span> Negociei.app`;
          target.parentElement?.appendChild(textSpan);
        }}
      />
    </div>
  );
};

export default Logo;
