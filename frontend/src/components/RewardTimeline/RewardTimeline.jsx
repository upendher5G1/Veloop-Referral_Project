import { motion } from 'framer-motion';
import { UserPlus, Trophy } from 'lucide-react';
import FloatingOrbs from '../common/FloatingOrbs';
import CoinScatterBackground from '../common/CoinScatterBackground';
import { useReferralData } from '../../context/ReferralDataContext';
import styles from './RewardTimeline.module.css';

// Static labels for the milestone tiers - same thresholds as the backend's
// RewardConfiguration. "achieved" below is driven entirely by whether the
// backend's ledger actually credited that milestone.
const MILESTONE_TIERS = [
  { id: 'r1', title: '5000 SVE', condition: 'Friend completes 15 Ad Watch tasks', milestone: 15, rewardType: 'SVE' },
  { id: 'r2', title: '2 Lucky Spins', condition: 'Friend completes 20 Ad Watch tasks', milestone: 20, rewardType: 'SPINS' },
  { id: 'r3', title: '5000 Tokens', condition: 'Friend completes 30 Ad Watch tasks', milestone: 30, rewardType: 'TOKENS' },
  { id: 'r4', title: '10 Gems', condition: 'Friend completes 35 Ad Watch tasks', milestone: 35, rewardType: 'GEMS' },
];

function RewardTimeline() {
  const { data } = useReferralData();

  const creditedKeys = new Set(
    (data?.rewardMilestones || [])
      .filter((r) => r.status === 'CREDITED')
      .map((r) => `${r.milestone}:${r.rewardType}`)
  );

  const steps = [
    { id: 'start', title: 'Registration', desc: 'You joined the referral program', achieved: !!data, isStart: true },
    ...MILESTONE_TIERS.map((r) => ({
      id: r.id,
      title: r.title,
      desc: r.condition,
      achieved: creditedKeys.has(`${r.milestone}:${r.rewardType}`),
    })),
  ];

  return (
    <div className={styles.panel}>
      <CoinScatterBackground />
      <FloatingOrbs />

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Your Reward Journey</h2>
        <p className={styles.subtitle}>Every referral brings you closer to the next reward</p>
      </motion.div>

      <div className={styles.timeline}>
        <div className={styles.trackBg} />
        <motion.div
          className={styles.trackFill}
          initial={{ scaleY: 0 }}
          whileInView={{
            scaleY: steps.filter((s) => s.achieved).length / steps.length,
          }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
        />

        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            className={styles.step}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <div className={`${styles.node} ${step.achieved ? styles.nodeAchieved : ''}`}>
              {step.isStart ? <UserPlus size={16} /> : <Trophy size={16} />}
            </div>
            <div className={styles.content}>
              <h4 className={styles.stepTitle}>{step.title}</h4>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RewardTimeline;