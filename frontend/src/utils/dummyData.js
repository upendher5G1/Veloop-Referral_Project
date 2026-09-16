// ============================================
// Static UI copy for the VELoop Referral Page.
//
// This file used to hold ALL page data, including user-specific referral
// stats, balances, and progress - those now come from the backend (see
// src/context/ReferralDataContext.jsx and src/utils/apiClient.js). What
// remains here is genuinely static marketing/help copy that isn't
// per-user and isn't security-sensitive.
// ============================================

export const referralRules = [
  'Rewards are unlocked only after the referred user completes the required number of Ad Watch tasks.',
  'Each referral reward is milestone-based and can only be claimed after the respective condition is met.',
  'Multiple successful referrals can unlock multiple rewards.',
  'Self-referrals are not allowed.',
  'Fraudulent or fake referrals will result in reward cancellation.',
  'Referral progress should be tracked clearly through the UI.',
];

export const faqData = [
  {
    id: 'faq1',
    question: 'How do I earn rewards from referrals?',
    answer:
      'Share your referral code or link with friends. Once they sign up and complete the required Ad Watch tasks, you unlock the corresponding milestone rewards.',
  },
  {
    id: 'faq2',
    question: 'When do I receive my reward?',
    answer:
      'Rewards are credited automatically once your referred friend completes the task threshold for that milestone.',
  },
  {
    id: 'faq3',
    question: 'Is there a limit to how many friends I can refer?',
    answer:
      'No limit. Every successful referral earns you XP, and each one can unlock multiple milestone rewards.',
  },
];
