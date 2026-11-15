import Link from "next/link";
import { VeltralLogo } from "./veltral-logo";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo} aria-label="Veltral, home">
            <VeltralLogo />
          </Link>
          <p>Rehearse the hardest minute of parenting before it happens.</p>
        </div>
        <nav aria-label="Rehearse" className={styles.col}>
          <p>Rehearse</p>
          <Link href="/play">Today&apos;s scene</Link>
          <Link href="/scenes">Scenes</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/playbook">Your lines</Link>
        </nav>
        <nav aria-label="Learn" className={styles.col}>
          <p>Learn</p>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Season pass</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/jury">Jury guide</Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p className="disclaimer">
          Veltral is a practice tool. It is not therapy, medical advice or a
          diagnosis. The child is simulated and the scoring is a simplified
          model.
        </p>
        <p>© {year} Veltral</p>
      </div>
    </footer>
  );
}
