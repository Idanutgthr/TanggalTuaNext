// src/app/dashboard/akun/page.js
"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../context";
import { auth, db } from "@/lib/firebase";
import { updateProfile, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AkunPage() {
  const {
    currentUser,
    currentBalance,
    currentSavings,
    language,
    changeLanguage,
    themeMode,
    changeThemeMode,
    syncData,
    t
  } = useDashboard();

  const [displayName, setDisplayName] = useState("...");
  const [avatarBase64, setAvatarBase64] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const fetchProfileData = async () => {
    if (!currentUser) return;
    try {
      setDisplayName(currentUser.displayName || "Pengguna TanggalTua");

      const docSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.avatarBase64) {
          setAvatarBase64(data.avatarBase64);
        }
      }
    } catch (e) {
      console.error("Error loading account data: ", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [currentUser]);

  const handleEditName = async () => {
    if (!currentUser) return;
    const newName = prompt(t("namaProfilBaru"), displayName);
    if (newName && newName.trim() !== "") {
      try {
        await updateProfile(currentUser, { displayName: newName });
        setDisplayName(newName);
        alert(t("namaBerhasilUbah"));
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleAvatarChange = (e) => {
    if (!currentUser) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result;
        setAvatarBase64(result);
        try {
          await updateDoc(doc(db, "users", currentUser.uid), {
            avatarBase64: result
          });
          alert(t("fotoProfilBerhasilSimpan"));
        } catch (error) {
          alert(error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    if (confirm(t("apakahYakinKeluar"))) {
      try {
        await signOut(auth);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleWithdrawSavings = async () => {
    if (!currentUser) return;
    if (currentSavings <= 0) {
      alert(language === "id" ? "Tabungan Anda kosong!" : "Your savings is empty!");
      return;
    }
    const amountStr = prompt(t("masukkanNominalTarik"), currentSavings.toString());
    if (amountStr === null) return; // User cancelled
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(t("harusNilaiValid"));
      return;
    }
    if (amount > currentSavings) {
      alert(t("danaTarikMelebihi"));
      return;
    }

    try {
      const newSavings = currentSavings - amount;
      const newBalance = currentBalance + amount;
      
      // Update in Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        savings: newSavings,
        balance: newBalance
      });

      alert(t("tarikBerhasil"));
      await syncData(currentUser.uid);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4 flex-grow flex flex-col items-center pt-4 text-center min-h-0 animate-fadeIn relative">
      
      {/* LANGUAGE SELECTOR POPUP MODAL */}
      {showLanguageModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn rounded-[40px]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 w-full max-w-[280px] shadow-2xl border border-pink-100 dark:border-slate-700 text-left space-y-4">
            <h5 className="font-bold text-slate-800 dark:text-white text-xs tracking-tight">
              {language === "id" ? "Pilih Bahasa" : "Select Language"}
            </h5>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  changeLanguage("id");
                  setShowLanguageModal(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex justify-between items-center transition cursor-pointer ${
                  language === "id"
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-pink-50"
                }`}
              >
                <span>Bahasa Indonesia</span>
                {language === "id" && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
              <button
                type="button"
                onClick={() => {
                  changeLanguage("en");
                  setShowLanguageModal(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex justify-between items-center transition cursor-pointer ${
                  language === "en"
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-pink-50"
                }`}
              >
                <span>English</span>
                {language === "en" && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[10px] text-center cursor-pointer"
            >
              {language === "id" ? "Batal" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* THEME SELECTOR POPUP MODAL */}
      {showThemeModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn rounded-[40px]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 w-full max-w-[280px] shadow-2xl border border-pink-100 dark:border-slate-700 text-left space-y-4">
            <h5 className="font-bold text-slate-800 dark:text-white text-xs tracking-tight">
              {language === "id" ? "Pilih Mode Layar" : "Select Display Mode"}
            </h5>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  changeThemeMode("light");
                  setShowThemeModal(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex justify-between items-center transition cursor-pointer ${
                  themeMode === "light"
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-pink-50"
                }`}
              >
                <span>{t("terang")}</span>
                {themeMode === "light" && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
              <button
                type="button"
                onClick={() => {
                  changeThemeMode("dark");
                  setShowThemeModal(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex justify-between items-center transition cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-pink-50"
                }`}
              >
                <span>{t("gelap")}</span>
                {themeMode === "dark" && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowThemeModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[10px] text-center cursor-pointer"
            >
              {t("batal")}
            </button>
          </div>
        </div>
      )}

      {/* AVATAR BOARD FRAME */}
      <div className="relative w-24 h-24 mx-auto shrink-0">
        <div className="w-24 h-24 rounded-full bg-[#fbcfe8] bg-opacity-60 dark:bg-pink-950/30 flex items-center justify-center shadow-md overflow-hidden border-2 border-white dark:border-slate-800">
          {avatarBase64 ? (
            <img
              className="w-full h-full object-cover"
              src={avatarBase64}
              alt="Avatar Pengguna"
            />
          ) : currentUser?.photoURL ? (
            <img
              className="w-full h-full object-cover"
              src={currentUser.photoURL}
              alt="Avatar Pengguna"
            />
          ) : (
            <i className="fa-solid fa-user text-4xl text-slate-700 dark:text-slate-300"></i>
          )}
        </div>
        <label
          htmlFor="input-file-avatar"
          className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition"
        >
          <i className="fa-solid fa-camera text-xs text-slate-600 dark:text-slate-400"></i>
          <input
            type="file"
            id="input-file-avatar"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </label>
      </div>

      {/* PROFILE DETAILS CARD */}
      <div className="flex flex-col items-center w-full shrink-0">
        <div className="flex items-center gap-2 justify-center">
          <h4 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">
            {displayName}
          </h4>
          <button
            onClick={handleEditName}
            className="text-slate-400 hover:text-pink-500 text-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-pencil"></i>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {currentUser?.email}
        </p>
      </div>

      {/* SAVINGS DISPLAY BLOCK */}
      <div className="w-full bg-slate-50/80 dark:bg-slate-950/40 border border-pink-100 dark:border-slate-800 rounded-2xl p-4 text-left shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-pink-500 mb-1">
            <i className="fa-solid fa-piggy-bank text-sm"></i>
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {t("tabunganSaya")}
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0
            }).format(currentSavings)}
          </h3>
        </div>
        <button
          onClick={handleWithdrawSavings}
          type="button"
          className="px-3.5 py-2 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-400 font-bold rounded-xl text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
        >
          <i className="fa-solid fa-money-bill-transfer"></i>
          {t("tarik")}
        </button>
      </div>

      {/* PRE-BUILT OPTIONS (ACTIVE TRANSLATION & THEME CONTROLS) */}
      <div className="w-full space-y-2 flex-grow overflow-y-auto custom-scroll pr-1 max-h-[170px] min-h-0">
        <div className="w-full">
          <button
            onClick={() => setShowLanguageModal(true)}
            type="button"
            className="w-full bg-pink-50/60 dark:bg-pink-950/10 border border-pink-100 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center shadow-sm cursor-pointer"
          >
            <span>{t("bahasa")}</span>
            <span className="text-pink-400 font-normal text-[11px] flex items-center gap-1">
              {language === "id" ? "Bahasa Indonesia" : "English"}{" "}
              <i className="fa-solid fa-check text-[10px]"></i>
            </span>
          </button>
        </div>
        <div className="w-full">
          <button
            onClick={() => setShowThemeModal(true)}
            type="button"
            className="w-full bg-pink-50/60 dark:bg-pink-950/10 border border-pink-100 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center shadow-sm cursor-pointer"
          >
            <span>{t("modeLayar")}</span>
            <span className="text-pink-400 font-normal text-[11px] flex items-center gap-1">
              {themeMode === "light" ? t("terang") : t("gelap")}{" "}
              <i className="fa-solid fa-check text-[10px]"></i>
            </span>
          </button>
        </div>
      </div>

      {/* LOGOUT CONTROL BUTTON */}
      <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 text-rose-500 font-bold py-3 rounded-full text-xs hover:bg-rose-100/50 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fa-solid fa-right-from-bracket"></i> {t("logout")}
        </button>
      </div>
    </div>
  );
}
