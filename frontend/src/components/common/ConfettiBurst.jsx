import { motion } from 'framer-motion';

const COLORS = ['#6C5CE7', '#00D9B5', '#FFB020', '#F43F5E', '#22C55E'];

function ConfettiBurst({ burstId }) {
  if (!burstId) return null;

  const particles = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const distance = 50 + Math.random() * 35;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 4,
    };
  });

  return (
    <div
      key={burstId}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default ConfettiBurst;