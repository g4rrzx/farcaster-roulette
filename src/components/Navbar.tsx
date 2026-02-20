"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path) ?? false;

    // Calculate translation percentage for the active indicator pill
    const getActiveIndex = () => {
        if (pathname?.startsWith('/spin')) return 0;
        if (pathname?.startsWith('/quest')) return 1;
        if (pathname?.startsWith('/profil')) return 2;
        return 0; // Default to Spin
    };

    return (
        <nav className={styles.navbar}>
            <div className={`${styles.navContainer} glass-morphism`}>
                <div
                    className={styles.indicator}
                    style={{ transform: `translateX(calc(${getActiveIndex() * 100}% + ${getActiveIndex() * 0.15}rem + 0.15rem))` }}
                />

                <Link
                    href="/spin"
                    className={`${styles.navItem} ${isActive('/spin') ? styles.active : ''}`}
                >
                    <span className="material-symbols-outlined">poker_chip</span>
                    <span className={styles.navLabel}>Spin</span>
                </Link>

                <Link
                    href="/quest"
                    className={`${styles.navItem} ${isActive('/quest') ? styles.active : ''}`}
                >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span className={styles.navLabel}>Quest</span>
                </Link>

                <Link
                    href="/profil"
                    className={`${styles.navItem} ${isActive('/profil') ? styles.active : ''}`}
                >
                    <span className="material-symbols-outlined">person</span>
                    <span className={styles.navLabel}>Profil</span>
                </Link>
            </div>
        </nav>
    );
}
