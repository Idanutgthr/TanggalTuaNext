// src/app/dashboard/notifikasi/page.js
"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../context";
import { db } from "@/lib/firebase";
import {
  setDoc,
  doc,
  deleteDoc,
  collection
} from "firebase/firestore";

const expenseCategories = [
  { name: "Makan", icon: "fa-utensils", color: "text-sky-400" },
  { name: "Belanja", icon: "fa-bag-shopping", color: "text-purple-400" },
  { name: "Pajak", icon: "fa-money-bill-wave", color: "text-emerald-400" },
  { name: "Transportasi", icon: "fa-car", color: "text-green-500" },
  { name: "Medis", icon: "fa-kit-medical", color: "text-red-500" },
  { name: "Hiburan", icon: "fa-gamepad", color: "text-amber-500" },
  { name: "Lainnya", icon: "fa-window-maximize", color: "text-yellow-600" }
];

function RuleItem({ rule, onDelete, onEdit, isLocked, getKatTranslation, t }) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX) => { setStartX(clientX); setIsDragging(true); };
  const handleMove = (clientX) => { if (!isDragging) return; setCurrentX(clientX); };
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX - startX;
    if (diff < -50) setSwiped(true);
    else if (diff > 50) setSwiped(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl min-h-[56px] w-full shrink-0">
      {/* Action background: Hapus (left) - Edit (center) - Batal (right) */}
      <div className="absolute inset-0 bg-pink-100 dark:bg-slate-700 flex items-center justify-around px-4 z-0">
        {!isLocked && (
          <button
            type="button"
            onClick={() => { onDelete(rule.kategori); setSwiped(false); }}
            className="bg-[#f87171] text-white font-bold px-4 py-1.5 rounded-full text-[10px] shadow-sm cursor-pointer"
          >
            {t("batal") === "Cancel" ? "Delete" : "Hapus"}
          </button>
        )}
        {!isLocked && (
          <button
            type="button"
            onClick={() => { onEdit(rule); setSwiped(false); }}
            className="bg-[#fbbf24] text-slate-800 font-bold px-4 py-1.5 rounded-full text-[10px] shadow-sm cursor-pointer"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => setSwiped(false)}
          className="bg-[#4ade80] text-white font-bold px-4 py-1.5 rounded-full text-[10px] shadow-sm cursor-pointer"
        >
          {t("batal")}
        </button>
      </div>
      {/* Content layer — solid background */}
      <div
        style={{ transform: swiped ? "translateX(-100%)" : "translateX(0)" }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        className="bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 rounded-xl p-3 flex justify-between items-center text-xs relative z-10 w-full h-full transition-transform duration-300 cursor-grab select-none"
      >
        <div className="pointer-events-none">
          <p className="font-bold text-slate-800 dark:text-white">{getKatTranslation(rule.kategori)}</p>
          <p className="text-[9px] text-slate-400">
            {t("nominalMaksimal")}: {rule.periode === "hari" ? t("perhari") : t("perbulan")}
          </p>
        </div>
        <span className="font-black text-slate-700 dark:text-slate-300 pointer-events-none">
          Rp {rule.limit.toLocaleString("id-ID")}
        </span>
      </div>
    </div>
  );
}

export default function DisiplinPage() {
  const {
    currentUser,
    currentBalance,
    currentSavings,
    disiplinActive,
    setDisiplinActive,
    aturanBatasKategori,
    setAturanBatasKategori,
    tipeMenabungLevel,
    setTipeMenabungLevel,
    alokasiTabunganDisiplin,
    setAlokasiTabunganDisiplin,
    language,
    syncData,
    t
  } = useDashboard();

  const [showRulePicker, setShowRulePicker] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);
  const [inputNilaiTabungan, setInputNilaiTabungan] = useState("");

  // Rule picker states
  const [ruleSelectedKategori, setRuleSelectedKategori] = useState("");
  const [ruleSelectedPeriod, setRuleSelectedPeriod] = useState("hari");
  const [inputNominalMaksimalRule, setInputNominalMaksimalRule] = useState("");

  // Check locking conditions
  const isLocked = disiplinActive && currentBalance > 0;

  // Sync switchOn with database disiplinActive status
  useEffect(() => {
    setSwitchOn(disiplinActive);
  }, [disiplinActive]);

  // Sync local input with database saved value
  useEffect(() => {
    if (alokasiTabunganDisiplin > 0) {
      setInputNilaiTabungan(alokasiTabunganDisiplin.toString());
    } else {
      setInputNilaiTabungan("");
    }
  }, [alokasiTabunganDisiplin]);

  // Sync savings input when tier changes
  useEffect(() => {
    if (isLocked) return;

    let persen = 0;
    if (tipeMenabungLevel === "mudah") persen = 10;
    else if (tipeMenabungLevel === "sedang") persen = 20;
    else if (tipeMenabungLevel === "sulit") persen = 30;

    if (tipeMenabungLevel !== "kustom") {
      setInputNilaiTabungan(Math.round(currentBalance * (persen / 100)).toString());
    } else {
      setInputNilaiTabungan("");
    }
  }, [tipeMenabungLevel, currentBalance, isLocked]);

  // Handle active discipline toggle
  const handleToggleDisiplin = async (e) => {
    if (isLocked) return;
    const checked = e.target.checked;
    setSwitchOn(checked);
    if (!checked) {
      try {
        if (currentUser) {
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              disiplinActive: false,
              tipeMenabungLevel: "kustom",
              alokasiTabunganDisiplin: 0
            },
            { merge: true }
          );
          await syncData(currentUser.uid);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLevelClick = (level) => {
    if (isLocked) return;
    setTipeMenabungLevel(level);
  };

  const handleSaveConfig = async () => {
    if (!currentUser) return;
    const tabunganVal = parseInt(inputNilaiTabungan) || 0;
    if (tabunganVal <= 0) {
      alert(t("harusNilaiValid"));
      return;
    }
    if (tabunganVal > currentBalance) {
      alert(t("danaTabunganMelebihi"));
      return;
    }

    const newBalance = currentBalance - tabunganVal;
    const newSavings = currentSavings + tabunganVal;

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          balance: newBalance,
          savings: newSavings,
          disiplinActive: true,
          tipeMenabungLevel: tipeMenabungLevel,
          alokasiTabunganDisiplin: tabunganVal
        },
        { merge: true }
      );

      // Save category rules to Firestore
      for (const rule of aturanBatasKategori) {
        await setDoc(
          doc(db, "users", currentUser.uid, "rules", rule.kategori),
          rule
        );
      }

      alert(t("modeDisiplinAktifAturanKunci"));
      await syncData(currentUser.uid);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleOpenRulePicker = () => {
    if (isLocked) return;
    setRuleSelectedKategori("");
    setRuleSelectedPeriod("hari");
    setInputNominalMaksimalRule("");
    setShowRulePicker(true);
  };

  const handleEditRule = (rule) => {
    if (isLocked) return;
    setRuleSelectedKategori(rule.kategori);
    setRuleSelectedPeriod(rule.periode);
    setInputNominalMaksimalRule(rule.limit.toString());
    setShowRulePicker(true);
  };

  const handleCancelRule = () => {
    setShowRulePicker(false);
    setRuleSelectedKategori("");
  };

  const handleSaveRule = () => {
    const limit = parseInt(inputNominalMaksimalRule) || 0;
    if (!ruleSelectedKategori || limit <= 0) {
      alert(t("lengkapiDataKriteria"));
      return;
    }

    const updatedRules = aturanBatasKategori.filter(
      (r) => r.kategori !== ruleSelectedKategori
    );
    updatedRules.push({
      kategori: ruleSelectedKategori,
      periode: ruleSelectedPeriod,
      limit: limit
    });

    setAturanBatasKategori(updatedRules);
    handleCancelRule();
  };

  const handleDeleteRule = async (katName) => {
    if (isLocked) return;
    const updatedRules = aturanBatasKategori.filter((r) => r.kategori !== katName);
    setAturanBatasKategori(updatedRules);

    if (currentUser) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "rules", katName));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getPercentageText = () => {
    const labelTabungan = t("tabungan");
    if (tipeMenabungLevel === "mudah") return `${labelTabungan} (10%)`;
    if (tipeMenabungLevel === "sedang") return `${labelTabungan} (20%)`;
    if (tipeMenabungLevel === "sulit") return `${labelTabungan} (30%)`;
    return `${labelTabungan} (${t("kustom")})`;
  };

  const getKatTranslation = (name) => {
    if (name === "Uang Saku") return t("uangSaku");
    return t(name.toLowerCase());
  };

  return (
    <div className="space-y-4 flex-grow flex flex-col min-h-0">
      {/* SUB ATURAN KATEGORI DISIPLIN UTAMA */}
      {!showRulePicker ? (
        <div className="space-y-4 w-full flex flex-col flex-grow min-h-0">
          <div className="bg-[#fbcfe8] bg-opacity-70 dark:bg-slate-800 rounded-3xl p-4 flex justify-between items-center border border-pink-200 dark:border-slate-800 shadow-sm shrink-0">
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {t("modeDisiplin")}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={switchOn}
                onChange={handleToggleDisiplin}
                disabled={isLocked}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          {/* MAIN CONFIGURATION BOX */}
          {switchOn && (
            <div className="space-y-4 flex-grow flex flex-col min-h-0 animate-fadeIn">

              {/* TIER DIFFICULTY SELECTION (HIDDEN ONCE LOCKED) */}
              {!isLocked && (
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                  {["kustom", "sulit", "sedang", "mudah"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleLevelClick(lvl)}
                      className={`py-2 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer ${tipeMenabungLevel === lvl
                        ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-black"
                        : ""
                        }`}
                    >
                      {t(lvl)}
                    </button>
                  ))}
                </div>
              )}

              {/* DANA SAVINGS PERCENTAGE TARGET VALUE INFO BOX */}
              <div className="flex justify-between items-center bg-[#fbcfe8] bg-opacity-30 dark:bg-slate-800/40 p-3 rounded-xl border border-pink-100 dark:border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {getPercentageText()}
                </span>
                <input
                  type="number"
                  value={inputNilaiTabungan}
                  onChange={(e) => setInputNilaiTabungan(e.target.value)}
                  readOnly={isLocked || tipeMenabungLevel !== "kustom"}
                  className="w-1/2 bg-transparent text-right font-black text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="Rp. 0"
                />
              </div>

              {/* RULES LIST TITLE & ADD BUTTON */}
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleOpenRulePicker}
                  className="w-full bg-pink-100 hover:bg-pink-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-full text-xs transition shadow-sm border border-pink-200/50 dark:border-slate-700 shrink-0 cursor-pointer"
                >
                  {t("tambahAturan")}
                </button>
              )}              {/* RULES ROWS SCROLLER */}
              <div className="rules-list-container space-y-2 flex-grow overflow-y-auto custom-scroll max-h-[220px] md:max-h-[320px] lg:max-h-[400px] pr-1 min-h-0">
                {aturanBatasKategori.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-400 py-6 font-medium">
                    {t("batal") === "Cancel"
                      ? "No expense capping rules defined yet."
                      : "Belum ada batas aturan pengeluaran yang didefinisikan."}
                  </p>
                ) : (
                  aturanBatasKategori.map((rule) => (
                    <RuleItem
                      key={rule.kategori}
                      rule={rule}
                      onDelete={handleDeleteRule}
                      onEdit={handleEditRule}
                      isLocked={isLocked}
                      getKatTranslation={getKatTranslation}
                      t={t}
                    />
                  ))
                )}
              </div>

              {/* SAVE / LOCK DISCIPLINE CONFIG BUTTON */}
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full bg-[#fbcfe8] hover:bg-[#f9a8d4] dark:bg-pink-600 dark:hover:bg-pink-500 dark:text-white text-slate-800 font-bold py-3 rounded-full text-sm shadow-md transition mt-auto shrink-0 cursor-pointer"
                >
                  {t("simpan")}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* SUB-LAYAR 2B: PICKER ATURAN KATEGORI */
        <div className="space-y-4 w-full flex flex-col flex-grow min-h-0 animate-fadeIn">
          <div className="bg-[#fbcfe8] bg-opacity-50 dark:bg-slate-800 rounded-full py-2 text-center font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider shrink-0">
            {language === "id" ? "Pilih Kategori Pengeluaran" : "Select Expense Category"}
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 text-center max-h-[220px] md:max-h-[300px] lg:max-h-[360px] overflow-y-auto custom-scroll flex-grow min-h-0">
            {expenseCategories.map((kat) => {
              const isSelected = kat.name === ruleSelectedKategori;
              const bgStyle = isSelected
                ? "bg-pink-100 dark:bg-pink-900/30"
                : "bg-slate-50 dark:bg-slate-900";
              const borderStyle = isSelected
                ? "border-pink-300 dark:border-pink-800"
                : "border-transparent dark:border-slate-850";
              return (
                <div
                  key={kat.name}
                  onClick={() => setRuleSelectedKategori(kat.name)}
                  className={`flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-pink-50 dark:hover:bg-slate-850 border transition ${bgStyle} ${borderStyle}`}
                >
                  <div
                    className={`w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-base ${kat.color}`}
                  >
                    <i className={`fa-solid ${kat.icon}`}></i>
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-slate-700 dark:text-slate-300">
                    {getKatTranslation(kat.name)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TIME DURATION TAB SELECTOR */}
          <div className="bg-[#fbcfe8] bg-opacity-40 dark:bg-slate-800 rounded-full p-1 flex border border-pink-200/20 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setRuleSelectedPeriod("hari")}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-full transition duration-200 cursor-pointer ${ruleSelectedPeriod === "hari"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-bold"
                : "text-slate-500 dark:text-slate-400"
                }`}
            >
              {t("perhari")}
            </button>
            <button
              type="button"
              onClick={() => setRuleSelectedPeriod("bulan")}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-full transition duration-200 cursor-pointer ${ruleSelectedPeriod === "bulan"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-bold"
                : "text-slate-500 dark:text-slate-400"
                }`}
            >
              {t("perbulan")}
            </button>
          </div>

          {/* NOMINAL CAPS VALUE INPUT */}
          <div className="flex justify-between items-center bg-[#fbcfe8] bg-opacity-30 dark:bg-slate-800/40 p-3 rounded-xl border border-pink-100 dark:border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("nominalMaksimal")}
            </span>
            <input
              type="number"
              value={inputNominalMaksimalRule}
              onChange={(e) => setInputNominalMaksimalRule(e.target.value)}
              className="w-1/2 bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-lg px-2 py-1.5 text-center font-bold text-xs text-slate-800 dark:text-white focus:outline-none"
              placeholder="Rp. 50.000"
            />
          </div>

          {/* PICKER FORM ACTIONS */}
          <div className="flex gap-3 mt-auto pt-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelRule}
              className="flex-1 bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-full text-xs cursor-pointer"
            >
              {t("batal")}
            </button>
            <button
              type="button"
              onClick={handleSaveRule}
              className="flex-1 bg-[#fbcfe8] hover:bg-[#f9a8d4] dark:bg-pink-600 dark:hover:bg-pink-500 dark:text-white text-slate-800 font-bold py-2.5 rounded-full text-xs shadow-sm cursor-pointer"
            >
              {t("simpan")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
