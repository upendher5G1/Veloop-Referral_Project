import { Mail } from 'lucide-react';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.brandName}>VELoop</span>
            <span className={styles.tagline}>Rewarding Every Meaningful Action.</span>
          </div>

          <a href="mailto:velooprewardsofficial@gmail.com" className={styles.contact}>
            <Mail size={16} />
            <span>velooprewardsofficial@gmail.com</span>
          </a>
        </div>

        <div className={styles.bottomBar}>
          <span>© 2026 VELoop Rewards. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;