import { motion } from 'framer-motion';
import { Trophy, Target, Megaphone } from 'lucide-react';
import styles from './ReferralProgress.module.css';
import CoinScatterBackground from '../common/CoinScatterBackground';
import EmptyState from '../common/EmptyState';
import { useReferralData } from '../../context/ReferralDataContext';

// Static display copy for the milestone tiers. The THRESHOLDS and REWARD
// AMOUNTS here mirror the backend's RewardConfiguration exactly, but this
// array is only used for labels - the actual current progress and which
// milestones are reached always come from the backend (see below).
const MILESTONE_TIERS = [
  { milestone: 15, title: '5000 SVE' },
  { milestone: 20, title: '2 Lucky Spins' },
  { milestone: 30, title: '5000 Tokens' },
  { milestone: 35, title: '10 Gems' },
];

function getNextMilestone(current) {
  return MILESTONE_TIERS.find((t) => t.milestone > current) || MILESTONE_TIERS[MILESTONE_TIERS.length - 1];
}

function ReferralProgress() {
  const { data, loading, error } = useReferralData();

  if (loading) {
    return (
      <div className={styles.panel} aria-busy="true">
        <CoinScatterBackground />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <EmptyState
          title={error.code === 'NO_TOKEN' ? 'Sign in required' : 'Could not load your progress'}
          description={error.message}
        />
      </div>
    );
  }

  // Progress is shown for the most recently active referral. Ad-watch
  // counts are derived server-side from verified events - never
  // client-supplied.
  const activeReferral = data.referralProgress.find((r) => r.status !== 'SUCCESSFUL') || data.referralProgress[0];

  if (!activeReferral) {
    return (
      <div className={styles.panel}>
        <CoinScatterBackground />
        <EmptyState
          title="No active referral to track yet"
          description="Once a friend signs up with your link, their ad-watch progress will show up here."
        />
      </div>
    );
  }

  const current = activeReferral.eligibleAdsWatched;
  const nextMilestone = getNextMilestone(current);
  const target = nextMilestone.milestone;
  const percent = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, target - current);

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
    >
      <CoinScatterBackground />

      <motion.div
        className={styles.megaphoneWrap}
        animate={{ scale: [1, 1.18, 1], rotate: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1.4,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      >
        <Megaphone size={22} />
        <motion.span
          className={styles.pulseRing}
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      <div className={styles.top}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBadge}>
            <Target size={20} />
          </div>
          <div>
            <h3 className={styles.title}>Next Milestone</h3>
            <p className={styles.subtitle}>
              {remaining > 0
                ? `${remaining} more ad watches from your friend to unlock ${nextMilestone.title}`
                : 'Milestone reached!'}
            </p>
          </div>
        </div>

        <div className={styles.rewardChip}>
          <Trophy size={16} />
          <span>{nextMilestone.title}</span>
        </div>
      </div>

      <div className={styles.barTrack}>
        <motion.div
          className={styles.barFill}
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
        <motion.div
          className={styles.barGlowDot}
          initial={{ left: '0%', opacity: 0 }}
          whileInView={{ left: `${percent}%`, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      <div className={styles.bottom}>
        <span className={styles.countLabel}>
          <strong>{current}</strong> / {target} ad watches
        </span>
        <span className={styles.percentLabel}>{percent}%</span>
      </div>
    </motion.div>
  );
}

export default ReferralProgress;