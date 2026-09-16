import styles from './CoinScatterBackground.module.css';

function RupeeCoin({ rotate }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        <linearGradient id={`rcGrad-${rotate}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#C9820A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#rcGrad-${rotate})`} stroke="#FFF3D6" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#FFF3D6" strokeWidth="1.5" opacity="0.5" />
      <text x="50" y="63" fontSize="34" fontWeight="800" fill="#8A5A00" textAnchor="middle" fontFamily="Sora, sans-serif">
        ₹
      </text>
    </svg>
  );
}

const SCATTER = [
  { top: '4%', left: '3%', size: 46, rotate: -15 },
  { top: '10%', left: '22%', size: 30, rotate: 20 },
  { top: '2%', left: '48%', size: 34, rotate: -8 },
  { top: '8%', left: '78%', size: 42, rotate: 12 },
  { top: '6%', left: '94%', size: 28, rotate: -25 },
  { top: '38%', left: '8%', size: 32, rotate: 18 },
  { top: '42%', left: '90%', size: 38, rotate: -12 },
  { top: '65%', left: '15%', size: 40, rotate: -20 },
  { top: '70%', left: '60%', size: 30, rotate: 10 },
  { top: '75%', left: '85%', size: 44, rotate: 22 },
  { top: '92%', left: '30%', size: 34, rotate: -10 },
  { top: '90%', left: '70%', size: 28, rotate: 15 },
];

function CoinScatterBackground() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {SCATTER.map((c, i) => (
        <div
          key={i}
          className={styles.coin}
          style={{ top: c.top, left: c.left, width: c.size, height: c.size }}
        >
          <RupeeCoin rotate={c.rotate} />
        </div>
      ))}
    </div>
  );
}

export default CoinScatterBackground;