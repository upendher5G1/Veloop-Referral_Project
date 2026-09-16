import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2 } from 'lucide-react';
import { api, ApiError, getToken } from '../../utils/apiClient';
import { useReferralData } from '../../context/ReferralDataContext';
import SelfReferralModal from '../SelfReferralModal/SelfReferralModal';
import Toast from '../common/Toast';
import styles from './AttributeReferralForm.module.css';

// NOTE: the original frontend had no way at all to submit a referral code -
// it only ever displayed the current user's own code/link. This small form
// is the minimal addition needed to actually exercise POST
// /referrals/attribute (and therefore the self-referral modal) end to end;
// everything else about the existing page layout is unchanged.
function AttributeReferralForm() {
  const { refetch } = useReferralData();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [modal, setModal] = useState({ open: false, maskedEmail: null });
  const [fieldError, setFieldError] = useState(null);

  if (!getToken()) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setFieldError(null);
    try {
      const result = await api.attributeReferral(code.trim().toUpperCase());
      setCode('');
      setToast({ show: true, message: `Referral linked — status: ${result.status}` });
      setTimeout(() => setToast({ show: false, message: '' }), 2500);
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SELF_REFERRAL_DETECTED') {
        setModal({ open: true, maskedEmail: err.maskedEmail || null });
      } else if (err instanceof ApiError) {
        setFieldError(err.message);
      } else {
        setFieldError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      className={styles.form}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
    >
      <div className={styles.inputWrap}>
        <Gift size={16} className={styles.icon} />
        <input
          type="text"
          placeholder="Have a referral code? Enter it here"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={20}
          disabled={submitting}
          aria-label="Referral code"
        />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={submitting || !code.trim()}>
        {submitting ? <Loader2 size={16} className={styles.spin} /> : 'Apply'}
      </button>

      {fieldError && (
        <p className={styles.error} role="alert">
          {fieldError}
        </p>
      )}

      <Toast show={toast.show} message={toast.message} />

      <SelfReferralModal
        open={modal.open}
        maskedEmail={modal.maskedEmail}
        onClose={() => setModal({ open: false, maskedEmail: null })}
        onLogin={() => setModal({ open: false, maskedEmail: null })}
      />
    </motion.form>
  );
}

export default AttributeReferralForm;
