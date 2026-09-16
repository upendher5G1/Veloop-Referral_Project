import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Users, CheckCircle2, Clock, Coins, Zap, Gem } from 'lucide-react';
import FloatingOrbs from '../common/FloatingOrbs';
import FloatingRewardIcons from '../common/FloatingRewardIcons';
import EmptyState from '../common/EmptyState';
import CoinScatterBackground from '../common/CoinScatterBackground';
import { useReferralData } from '../../context/ReferralDataContext';
import styles from './StatsSection.module.css';

const ICONS = {
  total: Users,
  success: CheckCircle2,
  pending: Clock,
  earnings: Coins,
  xp: Zap,
  gems: Gem,
};

const ACCENTS = {
  total: 'indigo',
  success: 'emerald',
  pending: 'amber',
  earnings: 'gold',
  xp: 'teal',
  gems: 'rose',
};

function Counter({ value }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest).toLocaleString('en-IN'));
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionVal, value, { duration: 1.4, ease: 'easeOut' });
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [isInView, value, motionVal, rounded]);

  return <span ref={ref}>{display}</span>;
}

function StatBar({ stat, index }) {
  const Icon = ICONS[stat.id];
  const accent = ACCENTS[stat.id];

  return (
    <motion.div
      className={`${styles.card} ${styles[accent]}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <div className={styles.iconWrap}>
        <Icon size={20} />
      </div>
      <div className={styles.textCol}>
        <div className={styles.value}>
          <Counter value={stat.value} />
          {stat.unit && <span className={styles.unit}> {stat.unit}</span>}
        </div>
        <div className={styles.label}>{stat.label}</div>
      </div>
    </motion.div>
  );
}

function buildStatistics(data) {
  // All values here are computed by the backend from the reward ledger and
  // referral records - nothing is derived or guessed on the client.
  return [
    { id: 'total', label: 'Total Referrals', value: data.totalReferrals },
    { id: 'success', label: 'Successful Referrals', value: data.successfulReferrals },
    { id: 'pending', label: 'Pending Referrals', value: data.pendingReferrals },
    { id: 'earnings', label: 'Total Rewards Earned', value: data.totalSvesEarned, unit: 'SVE' },
    { id: 'xp', label: 'Total XP Earned', value: data.totalXpEarned },
    { id: 'gems', label: 'Total Gems Earned', value: data.totalGemsEarned },
  ];
}

function StatsSection() {
  const { data, loading, error } = useReferralData();

  return (
    <div className={styles.panel}>
      <CoinScatterBackground />
      <FloatingOrbs />
      <FloatingRewardIcons
        items={[
          { type: 'coin', top: '5%', left: '6%', size: 44, delay: 0.2, duration: 4.5 },
          { type: 'diamond', top: '12%', left: '90%', size: 40, delay: 0.5, duration: 5 },
          { type: 'bitcoin', top: '70%', left: '4%', size: 38, delay: 0.4, duration: 4.8 },
          { type: 'coin', top: '80%', left: '92%', size: 36, delay: 0.7, duration: 5.2 },
        ]}
      />

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Your Referral Stats</h2>
        <p className={styles.subtitle}>Track every milestone of your referral journey</p>
      </motion.div>

      {loading ? (
        <div className={styles.bar} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className={`${styles.card} ${styles.skeleton}`} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title={error.code === 'NO_TOKEN' ? 'Sign in required' : 'Could not load your stats'}
          description={error.message}
        />
      ) : data.totalReferrals === 0 ? (
        <EmptyState
          title="No referrals yet"
          description="Share your referral link with friends to start tracking your stats here."
          actionLabel="Copy Referral Link"
        />
      ) : (
        <div className={styles.bar}>
          {buildStatistics(data).map((stat, i) => (
            <StatBar key={stat.id} stat={stat} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StatsSection;