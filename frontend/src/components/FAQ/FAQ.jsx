import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqData } from '../../utils/dummyData';
import FloatingOrbs from '../common/FloatingOrbs';
import styles from './FAQ.module.css';
import CoinScatterBackground from '../common/CoinScatterBackground';

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={styles.item}>
      <button
        className={styles.question}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <motion.span
          className={styles.chevron}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={styles.answerWrap}
          >
            <p className={styles.answer}>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQ() {
  const [openId, setOpenId] = useState(faqData[0]?.id ?? null);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

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
        <div className={styles.headerIcon}>
          <HelpCircle size={22} />
        </div>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <p className={styles.subtitle}>Everything you need to know about the referral program</p>
      </motion.div>

      <div className={styles.list}>
        {faqData.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default FAQ;