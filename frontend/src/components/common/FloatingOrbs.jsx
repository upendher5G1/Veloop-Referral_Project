import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './FloatingOrbs.module.css';

const ORBS = [
  { size: 260, top: '5%', left: '2%', color: '#6C5CE7', speed: 0.3 },
  { size: 220, top: '45%', left: '80%', color: '#00D9B5', speed: -0.2 },
  { size: 200, top: '75%', left: '15%', color: '#FFB020', speed: 0.15 },
  { size: 180, top: '10%', left: '65%', color: '#F43F5E', speed: -0.25 },
];

function Orb({ orb }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120 * orb.speed]);

  return (
    <motion.div
      ref={ref}
      className={styles.orb}
      style={{
        width: orb.size,
        height: orb.size,
        top: orb.top,
        left: orb.left,
        background: `radial-gradient(circle at 35% 30%, ${orb.color}, transparent 72%)`,
        y,
      }}
    />
  );
}

function FloatingOrbs() {
  return (
    <div className={styles.orbLayer} aria-hidden="true">
      {ORBS.map((orb, i) => (
        <Orb key={i} orb={orb} />
      ))}
    </div>
  );
}

export default FloatingOrbs;