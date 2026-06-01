// src/app/dashboard/layout.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./context";

function DashboardContent({ children }) {
  const pathname = usePathname();
  const { currentBalance, loading, t } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center font-semibold text-slate-800 dark:text-slate-200 text-lg">
          {t("loadingDashboard")}
        </div>
      </div>
    );
  }

  const isTabActive = (path) => pathname === path;

  const navItemClass = (path) =>
    isTabActive(path)
      ? "w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border border-pink-100 dark:border-slate-700 text-pink-500 dark:text-pink-400 text-base transition transform scale-110 cursor-pointer"
      : "w-10 h-10 text-slate-400 dark:text-slate-550 hover:text-pink-400 dark:hover:text-pink-400 text-base transition flex items-center justify-center cursor-pointer";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-6 max-w-sm w-full h-[780px] flex flex-col justify-between border border-pink-100 dark:border-slate-800 relative overflow-hidden">

        {/* KARTU SALDO UTAMA */}
        <div className="bg-[#fbcfe8] bg-opacity-70 dark:bg-pink-950/20 rounded-3xl p-4 mb-4 text-center border border-pink-200/50 dark:border-slate-800/40 relative overflow-hidden shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            {t("myBalance")}
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5 tracking-tight">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0
            }).format(currentBalance)}
          </h3>
          <i className="fa-solid fa-wallet text-5xl absolute -right-2 -bottom-2 opacity-10 text-slate-900 dark:text-white rotate-12"></i>
        </div>

        {/* CONTAINER KONTEN AKTIF */}
        <div className="flex-grow flex flex-col overflow-y-auto custom-scroll pb-4 min-h-0">
          {children}
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="border-t border-pink-100/60 dark:border-slate-800/80 pt-3 mt-auto flex justify-around items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
          <Link href="/dashboard" className={navItemClass("/dashboard")}>
            <i className="fa-solid fa-pencil"></i>
          </Link>
          <Link href="/dashboard/notifikasi" className={navItemClass("/dashboard/notifikasi")}>
            <i className="fa-solid fa-bell"></i>
          </Link>
          <Link href="/dashboard/laporan" className={navItemClass("/dashboard/laporan")}>
            <i className="fa-solid fa-chart-simple"></i>
          </Link>
          <Link href="/dashboard/akun" className={navItemClass("/dashboard/akun")}>
            <i className="fa-solid fa-circle-user"></i>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
