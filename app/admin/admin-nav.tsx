"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    isActive: (pathname) => pathname === "/admin/dashboard",
  },
  {
    label: "Classes",
    href: "/admin/classes",
    isActive: (pathname) => pathname.startsWith("/admin/classes"),
  },
  {
    label: "Sessions",
    href: "/admin/sessions",
    isActive: (pathname) =>
      pathname === "/admin/sessions" ||
      (pathname.startsWith("/admin/sessions") &&
        !pathname.includes("/participants")),
  },
  {
    label: "Participants",
    href: "/admin/participants",
    isActive: (pathname) =>
      pathname === "/admin/participants" || pathname.includes("/participants"),
  },
  {
    label: "Terms",
    href: "/admin/terms",
    isActive: (pathname) => pathname.startsWith("/admin/terms"),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin/login")) {
    return null;
  }

  return (
    <nav aria-label="Admin navigation" className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-3">
        {navItems.map((item) => {
          const isActive = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
