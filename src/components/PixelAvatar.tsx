import React from 'react';
import { motion } from 'framer-motion';
import { ActivityBubble, AvatarConfig, HandRaisedType } from '../types';

interface PixelAvatarProps {
  name: string;
  config: AvatarConfig;
  size?: number;
  bubble?: ActivityBubble;
  handRaised?: HandRaisedType;
  showBadgeTag?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  name,
  config,
  size = 44,
  bubble,
  handRaised,
  showBadgeTag = true,
  highlight = false,
  onClick,
}) => {
  const firstName = name.split(' ')[0];

  return (
    <motion.div
      onClick={onClick}
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`relative inline-flex flex-col items-center select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Floating Hand Raised Alert */}
      {handRaised && (
        <motion.div
          animate={{ y: [0, -4, 0], scale: [1, 1.07, 1] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          className={`mb-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-md border whitespace-nowrap z-20 ${
            handRaised === 'AJUDA'
              ? 'bg-amber-400 text-slate-950 border-amber-600'
              : 'bg-emerald-400 text-slate-950 border-emerald-700'
          }`}
        >
          {handRaised === 'AJUDA' ? '✋ Ajuda' : '✅ Pronto'}
        </motion.div>
      )}

      {/* Activity Bubble */}
      {!handRaised && bubble && (
        <div className="mb-0.5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-medium shadow border border-slate-700 whitespace-nowrap">
          {bubble}
        </div>
      )}

      {/* Pixel Art SVG Sprite */}
      <motion.div
        animate={handRaised ? { y: [0, -2, 0] } : { y: [0, -1, 0] }}
        transition={{ repeat: Infinity, duration: handRaised ? 0.7 : 2.2, ease: 'easeInOut' }}
        className={`relative ${highlight ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]' : ''}`}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          className="pixel-crisp overflow-visible"
          aria-label={`Avatar de ${name}`}
        >
          {/* Shadow */}
          <ellipse cx="8" cy="15" rx="4.5" ry="1.1" fill="rgba(15,23,42,0.28)" />

          {/* Raised arm when handRaised */}
          {handRaised && (
            <g>
              <rect x="12" y="4" width="2" height="6" fill={config.shirt} />
              <rect x="12" y="2" width="2" height="2" fill={config.skin} />
            </g>
          )}

          {/* Legs */}
          <rect x="5" y="12" width="2" height="3" fill="#1E293B" />
          <rect x="9" y="12" width="2" height="3" fill="#1E293B" />

          {/* Shirt / Torso */}
          <rect x="4" y="8" width="8" height="4" fill={config.shirt} />
          <rect x="6" y="8" width="4" height="2" fill={config.accent} />
          {/* Left Arm */}
          <rect x="3" y="8" width="1" height="3" fill={config.skin} />
          {/* Right Arm (normal) */}
          {!handRaised && <rect x="12" y="8" width="1" height="3" fill={config.skin} />}

          {/* Head */}
          <rect x="5" y="3" width="6" height="5" fill={config.skin} />

          {/* Eyes */}
          <rect x="6" y="5" width="1" height="1" fill="#0F172A" />
          <rect x="9" y="5" width="1" height="1" fill="#0F172A" />

          {/* Hair Styles */}
          {config.hairStyle === 'curto' && (
            <>
              <rect x="5" y="2" width="6" height="2" fill={config.hair} />
              <rect x="4" y="3" width="1" height="2" fill={config.hair} />
              <rect x="11" y="3" width="1" height="2" fill={config.hair} />
            </>
          )}
          {config.hairStyle === 'longo' && (
            <>
              <rect x="4" y="2" width="8" height="2" fill={config.hair} />
              <rect x="4" y="4" width="1" height="4" fill={config.hair} />
              <rect x="11" y="4" width="1" height="4" fill={config.hair} />
            </>
          )}
          {config.hairStyle === 'moicano' && (
            <>
              <rect x="7" y="0" width="2" height="3" fill={config.hair} />
              <rect x="5" y="2" width="6" height="1" fill={config.hair} />
            </>
          )}
          {config.hairStyle === 'cacheado' && (
            <>
              <rect x="4" y="1" width="8" height="2" fill={config.hair} />
              <rect x="4" y="3" width="1" height="3" fill={config.hair} />
              <rect x="11" y="3" width="1" height="3" fill={config.hair} />
              <rect x="5" y="2" width="6" height="1" fill={config.hair} />
            </>
          )}

          {/* Accessories */}
          {config.accessory === 'oculos' && (
            <g>
              <rect x="5" y="4" width="2" height="2" fill="none" stroke="#0F172A" strokeWidth="0.5" />
              <rect x="9" y="4" width="2" height="2" fill="none" stroke="#0F172A" strokeWidth="0.5" />
              <rect x="7" y="5" width="2" height="0.5" fill="#0F172A" />
            </g>
          )}
          {config.accessory === 'fone' && (
            <g>
              <rect x="4" y="2" width="8" height="1" fill="#38BDF8" />
              <rect x="3" y="4" width="1" height="3" fill="#0284C7" />
              <rect x="12" y="4" width="1" height="3" fill="#0284C7" />
            </g>
          )}
          {config.accessory === 'bone' && (
            <g>
              <rect x="5" y="1" width="6" height="2" fill={config.accent} />
              <rect x="4" y="2" width="8" height="1" fill={config.accent} />
            </g>
          )}
        </svg>
      </motion.div>

      {/* Nameplate / Crachá */}
      {showBadgeTag && (
        <span
          className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none shadow-sm border ${
            highlight
              ? 'bg-sky-500 text-white border-sky-300'
              : 'bg-white/95 text-slate-800 border-slate-300'
          }`}
        >
          {firstName}
        </span>
      )}
    </motion.div>
  );
};
