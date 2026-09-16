import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import styles from './Toast.module.css';

function Toast({ message, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;