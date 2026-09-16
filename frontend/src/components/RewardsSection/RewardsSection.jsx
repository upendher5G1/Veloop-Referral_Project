import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock, CheckCircle2, Sparkles } from 'lucide-react';
import FloatingOrbs from '../common/FloatingOrbs';
import styles from './RewardsSection.module.css';
import CoinScatterBackground from '../common/CoinScatterBackground';
import { useReferralData } from '../../context/ReferralDataContext';

// Static display copy mirroring the backend's RewardConfiguration. Whether
// a tile shows as "Unlocked" is NOT decided here - it's decided by whether
// the backend's reward ledger (data.rewardMilestones) actually contains a
// CREDITED row for that milestone.
const REWARD_TIERS = [
  { id: 'r1', title: '5000 SVE', subtitle: '≈ ₹10', condition: 'Friend completes 15 Ad Watch tasks', milestone: 15, rewardType: 'SVE' },
  { id: 'r2', title: '2 Lucky Spins', subtitle: null, condition: 'Friend completes 20 Ad Watch tasks', milestone: 20, rewardType: 'SPINS' },
  { id: 'r3', title: '5000 Tokens', subtitle: null, condition: 'Friend completes 30 Ad Watch tasks', milestone: 30, rewardType: 'TOKENS' },
  { id: 'r4', title: '10 Gems', subtitle: null, condition: 'Friend completes 35 Ad Watch tasks', milestone: 35, rewardType: 'GEMS' },
  { id: 'r5', title: '+20 XP', subtitle: null, condition: 'Awarded for every successful referral', milestone: 0, rewardType: 'XP' },
];

function TiltCard({ reward, index, unlocked }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className={styles.cardInner} style={{ transform: 'translateZ(30px)' }}>
        <div className={styles.statusIcon}>
          {unlocked ? <CheckCircle2 size={18} /> : <Lock size={16} />}
        </div>

        <div className={styles.sparkleIcon}>
          <Sparkles size={26} />
        </div>

        <h3 className={styles.rewardTitle}>{reward.title}</h3>
        {reward.subtitle && <p className={styles.rewardSubtitle}>{reward.subtitle}</p>}

        <p className={styles.condition}>{reward.condition}</p>

        {unlocked && <div className={styles.unlockedBadge}>Unlocked</div>}
      </div>

      <div className={styles.shine} />
    </motion.div>
  );
}

function RewardsSection() {
  const { data } = useReferralData();

  // A tier is "unlocked" only if the backend's ledger actually credited it
  // for this user - never inferred client-side from a raw ad/referral count.
  const creditedKeys = new Set(
    (data?.rewardMilestones || [])
      .filter((r) => r.status === 'CREDITED')
      .map((r) => `${r.milestone}:${r.rewardType}`)
  );

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
        <h2 className={styles.title}>Referral Rewards</h2>
        <p className={styles.subtitle}>Unlock exciting rewards as your friends complete tasks</p>
      </motion.div>

      <div className={styles.grid}>
        {REWARD_TIERS.map((reward, i) => {
          const unlocked = creditedKeys.has(`${reward.milestone}:${reward.rewardType}`);
          return <TiltCard key={reward.id} reward={reward} index={i} unlocked={unlocked} />;
        })}
      </div>
    </div>
  );
}

export default RewardsSection;