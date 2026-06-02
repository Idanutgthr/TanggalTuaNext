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

  const language = typeof window !== 'undefined' ? localStorage.getItem("tanggaltua_language") || "id" : "id";

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* 
        Responsive dashboard card container:
        Mobile: Full viewport, no border, no rounded corners (or rounded mobile frame on tablet)
        Tablet/Desktop: md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full h-[85vh] max-h-[820px] rounded-[40px] shadow-2xl grid grid-cols-12 gap-6
      */}
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-screen sm:h-[780px] md:h-[700px] lg:h-[780px] flex flex-col md:grid md:grid-cols-12 md:gap-6 border-0 sm:border border-pink-100 dark:border-slate-800 relative overflow-hidden sm:rounded-[40px] shadow-none sm:shadow-2xl p-4 sm:p-6 transition-all duration-300">
        
        {/* LEFT SIDEBAR (Tablet/Desktop only) */}
        <div className="hidden md:flex md:col-span-4 flex-col justify-between h-full border-r border-pink-100/40 dark:border-slate-800/80 pr-6">
          <div className="space-y-6">
            {/* Logo/Brand with beautiful gradient and animation */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-300 to-pink-100 dark:from-pink-900/60 dark:to-pink-950/20 flex items-center justify-center shadow-inner">
                <i className="fa-solid fa-wallet text-slate-700 dark:text-pink-300"></i>
              </div>
              <div>
                <h1 className="font-bold text-slate-800 dark:text-white text-base lg:text-lg tracking-tight">Tanggal Tua</h1>
                <p className="text-[10px] text-pink-500 dark:text-pink-400 font-bold uppercase tracking-wider">Smart Finance</p>
              </div>
            </div>

            {/* Desktop Balance Card */}
            <div className="bg-gradient-to-br from-[#fbcfe8] to-[#f9a8d4] dark:from-pink-950/30 dark:to-pink-900/10 bg-opacity-70 rounded-3xl p-5 text-center border border-pink-200/50 dark:border-pink-900/20 relative overflow-hidden shadow-sm">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold tracking-wide uppercase">
                {t("myBalance")}
              </p>
              <h3 className="text-xl lg:text-2xl font-black text-slate-850 dark:text-white mt-1 tracking-tight">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0
                }).format(currentBalance)}
              </h3>
              <i className="fa-solid fa-wallet text-5xl absolute -right-2 -bottom-2 opacity-10 text-slate-900 dark:text-white rotate-12"></i>
            </div>

            {/* Vertical Nav Bar */}
            <div className="space-y-2 pt-2">
              <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition duration-200 cursor-pointer ${
                isTabActive("/dashboard")
                  ? "bg-pink-100/60 dark:bg-pink-950/40 text-pink-650 dark:text-pink-400 font-bold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-pink-500"
              }`}>
                <i className="fa-solid fa-pencil text-base"></i>
                <span className="text-xs font-bold">{t("transaksi")}</span>
              </Link>
              <Link href="/dashboard/notifikasi" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition duration-200 cursor-pointer ${
                isTabActive("/dashboard/notifikasi")
                  ? "bg-pink-100/60 dark:bg-pink-950/40 text-pink-650 dark:text-pink-400 font-bold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-pink-500"
              }`}>
                <i className="fa-solid fa-bell text-base"></i>
                <span className="text-xs font-bold">{t("modeDisiplin")}</span>
              </Link>
              <Link href="/dashboard/laporan" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition duration-200 cursor-pointer ${
                isTabActive("/dashboard/laporan")
                  ? "bg-pink-100/60 dark:bg-pink-950/40 text-pink-650 dark:text-pink-400 font-bold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-pink-500"
              }`}>
                <i className="fa-solid fa-chart-simple text-base"></i>
                <span className="text-xs font-bold">{language === "id" ? "Laporan Keuangan" : "Financial Report"}</span>
              </Link>
              <Link href="/dashboard/akun" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition duration-200 cursor-pointer ${
                isTabActive("/dashboard/akun")
                  ? "bg-pink-100/60 dark:bg-pink-950/40 text-pink-650 dark:text-pink-400 font-bold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-pink-500"
              }`}>
                <i className="fa-solid fa-circle-user text-base"></i>
                <span className="text-xs font-bold">{language === "id" ? "Profil Akun" : "User Profile"}</span>
              </Link>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 font-semibold pb-2">
            TanggalTua Next © 2026
          </div>
        </div>

        {/* RIGHT CONTENT COLUMN */}
        <div className="flex flex-col flex-grow md:col-span-8 h-full justify-between min-h-0">
          
          {/* MOBILE BALANCE BOX (Hidden on Tablet/Desktop) */}
          <div className="md:hidden bg-gradient-to-r from-[#fbcfe8] to-[#f9a8d4] dark:from-pink-950/30 dark:to-pink-900/10 rounded-2xl p-4 mb-4 text-center border border-pink-200/50 dark:border-slate-800/40 relative overflow-hidden shrink-0 shadow-sm">
            <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold tracking-wide uppercase">
              {t("myBalance")}
            </p>
            <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-0.5 tracking-tight">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
              }).format(currentBalance)}
            </h3>
            <i className="fa-solid fa-wallet text-5xl absolute -right-2 -bottom-2 opacity-10 text-slate-900 dark:text-white rotate-12"></i>
          </div>

          {/* ACTIVE ROUTE CONTAINER (Guarantees single mount) */}
          <div className="flex-grow flex flex-col overflow-y-auto custom-scroll pb-4 min-h-0 pr-1">
            {children}
          </div>

          {/* BOTTOM NAVIGATION TABS (Hidden on Tablet/Desktop) */}
          <div className="md:hidden border-t border-pink-100/60 dark:border-slate-800/80 pt-3 mt-auto flex justify-around items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
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
