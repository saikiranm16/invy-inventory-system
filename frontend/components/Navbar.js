"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { AppPreferencesContext } from "../context/AppPreferencesContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isHydrated, logout } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);
  const links = useMemo(
    () =>
      user
        ? [
            { href: "/dashboard", label: t("nav.dashboard", "Dashboard") },
            { href: "/inventory", label: t("nav.inventory", "Inventory") },
          ]
        : [],
    [t, user]
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-[var(--header-bg)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/login"} className="flex items-center">
          <div className="mr-3 grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-1 shadow-lg shadow-sky-100">
            <Image
              src="/logo.png"
              alt="Invy logo"
              width={128}
              height={128}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Invy
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              {t("nav.brandSubtitle", "Smart inventory")}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const isActive = pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border border-white/80 bg-white text-[var(--foreground)] shadow-sm"
                    : "text-[var(--foreground)] hover:bg-white hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isHydrated ? (
            user ? (
              <>
                <span className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm">
                  {user?.role === "admin" ? "Admin" : "User"}
                </span>
                <button type="button" onClick={handleLogout} className="logout-btn">
                  {t("nav.logout", "Logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
                >
                  {t("nav.login", "Login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  {t("nav.register", "Register")}
                </Link>
              </>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
}
