import { motion } from 'framer-motion';
import logo from '../../assets/images/logo.png';
import styles from './Header.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.logoSlot}>
  <div className={styles.logoBg}>
    <motion.img
      src={logo}
      alt="VELoop logo"
      className={styles.logoImg}
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
</div>
        <span className={styles.brandName}>VELoop</span>
        <div className={styles.spacerSlot} />
      </div>
    </header>
  );
}

export default Header;