import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import styles from './Hero.module.css';

function BitcoinIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="btcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFDD8A" />
          <stop offset="50%" stopColor="#FFA71F" />
          <stop offset="100%" stopColor="#E8850A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#btcGrad)" stroke="#FFE9B8" strokeWidth="3" />
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
        <linearGradient id="diaTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BEE3FF" />
          <stop offset="100%" stopColor="#5FA8E8" />
        </linearGradient>
        <linearGradient id="diaBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7EC0F0" />
          <stop offset="100%" stopColor="#2E6FB8" />
        </linearGradient>
      </defs>
      <polygon points="18,32 82,32 50,90" fill="url(#diaBody)" stroke="#1A4A80" strokeWidth="1.5" />
      <polygon points="18,32 50,10 82,32" fill="url(#diaTop)" stroke="#1A4A80" strokeWidth="1.5" />
      <polygon points="18,32 50,32 50,10" fill="#FFFFFF" opacity="0.35" />
      <line x1="18" y1="32" x2="82" y2="32" stroke="#1A4A80" strokeWidth="1" opacity="0.6" />
      <line x1="50" y1="32" x2="50" y2="90" stroke="#1A4A80" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#C9820A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#coinGrad)" stroke="#FFF3D6" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#FFF3D6" strokeWidth="1.5" opacity="0.55" />
      <text x="50" y="61" fontSize="32" fontWeight="800" fill="#8A5A00" textAnchor="middle" fontFamily="Sora, sans-serif">
        $
      </text>
    </svg>
  );
}

const ICON_MAP = { bitcoin: BitcoinIcon, diamond: DiamondIcon, coin: CoinIcon };

function FloatingIcon({ type, top, left, size, delay, duration }) {
  const IconComp = ICON_MAP[type];
  return (
    <motion.div
      className={styles.floatIcon}
      style={{ top, left, width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -14, 0] }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    >
      <IconComp />
    </motion.div>
  );
}

function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.iconLayer} aria-hidden="true">
        <FloatingIcon type="coin" top="4%" left="8%" size={50} delay={0.2} duration={4.5} />
        <FloatingIcon type="diamond" top="10%" left="82%" size={56} delay={0.5} duration={5} />
        <FloatingIcon type="bitcoin" top="55%" left="4%" size={48} delay={0.3} duration={4.8} />
        <FloatingIcon type="coin" top="60%" left="88%" size={42} delay={0.8} duration={5.3} />
        <FloatingIcon type="bitcoin" top="85%" left="20%" size={40} delay={0.6} duration={4.2} />
        <FloatingIcon type="diamond" top="88%" left="70%" size={44} delay={0.9} duration={4.6} />
      </div>

      <motion.div
        className={styles.badge}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Gift size={16} />
        <span>Referral Program</span>
      </motion.div>

      <motion.h1
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Invite Friends,
        <br />
        <span className={styles.titleGradient}>Earn Together</span>
      </motion.h1>

      <motion.p
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Share your referral code with friends and earn real rewards for
        every successful invite — instantly tracked, always rewarding.
      </motion.p>
    </div>
  );
}

export default Hero;
