"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const MAIN: { href: string; label: string }[] = [
  { href: "/scenes", label: "Scenes" },
  { href: "/progress", label: "Progress" },
  { href: "/playbook", label: "Your lines" },
  { href: "/pricing", label: "Season pass" },
];

const BOTTOM: { href: string; label: string; icon: IconName }[] = [
  { href: "/play", label: "Today", icon: "sun" },
  { href: "/scenes", label: "Scenes", icon: "stage" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/playbook", label: "Lines", icon: "script" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="site-nav" aria-label="Main navigation">
      {MAIN.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomBar() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="bottom-bar" aria-label="Quick navigation">
      {BOTTOM.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
