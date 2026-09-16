import { motion } from 'framer-motion';
import styles from './FloatingRewardIcons.module.css';

function BitcoinIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="btcGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFDD8A" />
          <stop offset="50%" stopColor="#FFA71F" />
          <stop offset="100%" stopColor="#E8850A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#btcGrad2)" stroke="#FFE9B8" strokeWidth="3" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="#FFE9B8" strokeWidth="2" opacity="0.5" />
      <text x="50" y="65" fontSize="42" fontWeight="900" fill="#A85E00" textAnchor="middle" fontFamily="Georgia, serif">
        &#8383;
      </text>
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="diaTop2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BEE3FF" />
          <stop offset="100%" stopColor="#5FA8E8" />
        </linearGradient>
        <linearGradient id="diaBody2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7EC0F0" />
          <stop offset="100%" stopColor="#2E6FB8" />
        </linearGradient>
      </defs>
      <polygon points="18,32 82,32 50,90" fill="url(#diaBody2)" stroke="#1A4A80" strokeWidth="1.5" />
      <polygon points="18,32 50,10 82,32" fill="url(#diaTop2)" stroke="#1A4A80" strokeWidth="1.5" />
      <polygon points="18,32 50,32 50,10" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="coinGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#C9820A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#coinGrad2)" stroke="#FFF3D6" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#FFF3D6" strokeWidth="1.5" opacity="0.55" />
      <text x="50" y="61" fontSize="32" fontWeight="800" fill="#8A5A00" textAnchor="middle" fontFamily="Sora, sans-serif">
        $
      </text>
    </svg>
  );
}

const ICON_MAP = { bitcoin: BitcoinIcon, diamond: DiamondIcon, coin: CoinIcon };

function FloatingRewardIcons({ items }) {
  return (
    <div className={styles.layer} aria-hidden="true">
      {items.map((it, i) => {
        const IconComp = ICON_MAP[it.type];
        return (
          <motion.div
            key={i}
            className={styles.icon}
            style={{ top: it.top, left: it.left, width: it.size, height: it.size }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -14, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: it.delay },
              y: { duration: it.duration, repeat: Infinity, ease: 'easeInOut', delay: it.delay },
            }}
          >
            <IconComp />
          </motion.div>
        );
      })}
    </div>
  );
}

export default FloatingRewardIcons;