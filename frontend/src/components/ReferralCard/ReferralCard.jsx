import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import ConfettiBurst from '../common/ConfettiBurst';
import Toast from '../common/Toast';
import { useReferralData } from '../../context/ReferralDataContext';
import styles from './ReferralCard.module.css';

function ReferralCard() {
  const { data, loading, error } = useReferralData();
  const [copiedField, setCopiedField] = useState(null);
  const [burstId, setBurstId] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleCopy = async (text, field, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setBurstId((id) => id + 1);
      setToast({ show: true, message: `${label} copied!` });
      setTimeout(() => setCopiedField(null), 2000);
      setTimeout(() => setToast({ show: false, message: '' }), 2200);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Everything shown here - the code and link - is backend-generated.
  // Nothing user-specific is hardcoded in this component.
  const code = loading ? 'Loading…' : data?.referralCode || '—';
  const link = loading ? 'Loading…' : data?.referralLink || '—';
  const disabled = loading || !!error || !data;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {error && (
        <div className={styles.inlineError} role="alert">
          {error.code === 'NO_TOKEN' ? 'Sign in to see your referral code.' : error.message}
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Your Referral Code</span>
          <span className={styles.value}>{code}</span>
        </div>
        <div className={styles.copyBtnWrap}>
          <ConfettiBurst burstId={copiedField === 'code' ? burstId : 0} />
          <button
            className={styles.copyBtn}
            onClick={() => handleCopy(data?.referralCode, 'code', 'Referral code')}
            aria-label="Copy referral code"
            disabled={disabled}
          >
            {copiedField === 'code' ? <Check size={18} /> : <Copy size={18} />}
            {copiedField === 'code' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Referral Link</span>
          <span className={styles.valueSmall}>{link}</span>
        </div>
        <div className={styles.copyBtnWrap}>
          <ConfettiBurst burstId={copiedField === 'link' ? burstId : 0} />
          <button
            className={styles.copyBtn}
            onClick={() => handleCopy(data?.referralLink, 'link', 'Referral link')}
            aria-label="Copy referral link"
            disabled={disabled}
          >
            {copiedField === 'link' ? <Check size={18} /> : <Copy size={18} />}
            {copiedField === 'link' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </motion.div>
  );
}

export default ReferralCard;