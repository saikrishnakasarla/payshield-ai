import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface Fallback3DProps {
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const Fallback3D: React.FC<Fallback3DProps> = ({
  size = 'lg',
  showDetails = true,
}) => {
  const isLarge = size === 'lg';
  const isMedium = size === 'md';

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-soc-cyan/15 blur-3xl pointer-events-none" />
      <div className="absolute w-48 h-48 rounded-full bg-soc-teal/20 blur-2xl pointer-events-none" />

      {/* Holographic Concentric Orbital Rings */}
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-soc-cyan/30 border-dashed animate-spin [animation-duration:20s] pointer-events-none" />
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-soc-teal/20 animate-spin [animation-duration:35s] [animation-direction:reverse] pointer-events-none" />

      {/* Center Shield Graphic */}
      <div className="relative z-10 flex flex-col items-center">
        <div className={`relative flex items-center justify-center rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1b2a]/90 via-[#071522]/90 to-[#050a12]/95 border-2 border-soc-cyan/60 shadow-[0_0_50px_rgba(0,229,255,0.4)] backdrop-blur-xl ${
          isLarge ? 'w-44 h-52 sm:w-56 sm:h-64' : isMedium ? 'w-32 h-40' : 'w-24 h-28 p-4'
        }`}>
          {/* Internal shield glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-soc-cyan/20 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-2 relative z-10">
            <div className="p-3 rounded-2xl bg-soc-cyan/20 border border-soc-cyan/50 text-soc-cyan shadow-[0_0_20px_rgba(0,229,255,0.5)]">
              <ShieldCheck className={`${isLarge ? 'w-12 h-12' : isMedium ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </div>
            {showDetails && (
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-soc-cyan block">
                  PAYSHIELD SOC
                </span>
                <span className="text-[9px] text-soc-teal/90 font-mono">AI Active</span>
              </div>
            )}
          </div>

          {/* Corner highlights */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-soc-cyan shadow-[0_0_6px_#00E5FF]" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-soc-teal shadow-[0_0_6px_#00F5C8]" />
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-soc-cyan shadow-[0_0_6px_#00E5FF]" />
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-soc-teal shadow-[0_0_6px_#00F5C8]" />
        </div>

        {/* Reflective Platform beneath */}
        <div className="w-48 sm:w-64 h-4 mt-6 rounded-[100%] bg-gradient-to-r from-transparent via-soc-cyan/40 to-transparent blur-sm" />
      </div>
    </div>
  );
};
