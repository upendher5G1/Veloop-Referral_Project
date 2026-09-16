import { motion } from 'framer-motion';
import { Lock, GitBranch, Ban, ShieldAlert, LineChart, CheckCircle } from 'lucide-react';
import { referralRules } from '../../utils/dummyData';
import FloatingOrbs from '../common/FloatingOrbs';
import styles from './ReferralRules.module.css';
import CoinScatterBackground from '../common/CoinScatterBackground';

const RULE_ICONS = [Lock, GitBranch, CheckCircle, Ban, ShieldAlert, LineChart];

function CheckBadge() {
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="27" fill="#22C55E" opacity="0.9" />
      <path d="M18 31 L26 39 L42 21" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossBadge() {
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="27" fill="#F43F5E" opacity="0.9" />
      <path d="M20 20 L40 40 M40 20 L20 40" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

const FLOATING_BADGES = [
  { type: 'check', top: '8%', left: '4%', size: 42, delay: 0.2, duration: 4.5 },
  { type: 'cross', top: '12%', left: '92%', size: 38, delay: 0.5, duration: 5 },
  { type: 'check', top: '55%', left: '96%', size: 34, delay: 0.4, duration: 4.8 },
  { type: 'cross', top: '85%', left: '3%', size: 40, delay: 0.7, duration: 5.2 },
];

function FloatingBadges() {
  return (
    <div className={styles.badgeLayer} aria-hidden="true">
      {FLOATING_BADGES.map((b, i) => (
        <motion.div
          key={i}
          className={styles.floatBadge}
          style={{ top: b.top, left: b.left, width: b.size, height: b.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -14, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: b.delay },
            y: { duration: b.duration, repeat: Infinity, ease: 'easeInOut', delay: b.delay },
          }}
        >
          {b.type === 'check' ? <CheckBadge /> : <CrossBadge />}
        </motion.div>
      ))}
    </div>
  );
}

function ReferralRules() {
  return (
    <div className={styles.panel}>
      <CoinScatterBackground />
      <FloatingOrbs />
      <FloatingBadges />

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Referral Rules</h2>
        <p className={styles.subtitle}>Simple guidelines to keep the program fair for everyone</p>
      </motion.div>

      <div className={styles.grid}>
        {referralRules.map((rule, i) => {
          const Icon = RULE_ICONS[i % RULE_ICONS.length];
          return (
            <motion.div
              key={i}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -8 }}
            >
              <div className={styles.iconWrap}>
                <Icon size={20} />
              </div>
              <p className={styles.ruleText}>{rule}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default ReferralRules;