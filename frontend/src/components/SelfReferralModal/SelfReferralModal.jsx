import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import styles from './SelfReferralModal.module.css';

// Shown when the backend returns SELF_REFERRAL_DETECTED - either a
// deterministic self-referral (same account) or a device-based fraud
// block. Only ever displays the maskedEmail the backend chooses to send;
// never renders any other account/device detail.
function SelfReferralModal({ open, maskedEmail, onClose, onLogin }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="self-referral-title"
          >
            <div className={styles.iconWrap}>
              <ShieldAlert size={28} />
            </div>

            <h3 id="self-referral-title" className={styles.title}>
              Account Already Exists
            </h3>
            <p className={styles.desc}>
              This device has already been associated with a VELOOP Rewards account. Please use your
              existing account to continue.
            </p>

            {maskedEmail && (
              <div className={styles.accountBox}>
                <span className={styles.accountLabel}>Account</span>
                <span className={styles.accountValue}>{maskedEmail}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={onClose}>
                Close
              </button>
              <button className={styles.primaryBtn} onClick={onLogin}>
                Login
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SelfReferralModal;
