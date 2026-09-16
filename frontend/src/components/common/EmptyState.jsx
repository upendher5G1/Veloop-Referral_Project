import { UserPlus } from 'lucide-react';
import styles from './EmptyState.module.css';

function EmptyState({ title, description, actionLabel }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconCircle}>
        <UserPlus size={28} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {actionLabel && <button className={styles.action}>{actionLabel}</button>}
    </div>
  );
}

export default EmptyState;