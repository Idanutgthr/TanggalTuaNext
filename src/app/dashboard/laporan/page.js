// src/app/dashboard/laporan/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useDashboard } from "../context";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "firebase/firestore";
import Chart from "chart.js/auto";

const reportTypes = ["pemasukan", "pengeluaran", "rata-rata"];
const warnaWarni = [
  "#60a5fa",
  "#c084fc",
  "#34d399",
  "#4ade80",
  "#f87171",
  "#fbbf24",
  "#d97706",
  "#2dd4bf"
];

export default function LaporanPage() {
  const { currentUser, currentSavings, language, t } = useDashboard();
  const [reportDate, setReportDate] = useState(new Date());
  const [currentTypeIndex, setCurrentTypeIndex] = useState(1); // Default to "pengeluaran" (index 1)

  // Calculated states
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalSaving, setTotalSaving] = useState(0);
  const [kategoriSums, setKategoriSums] = useState({});
  const [harianSums, setHarianSums] = useState({});
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const formatBulanTahun = (date) => {
    return date.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      month: "long",
      year: "numeric"
    });
  };

  const getTipeAktifText = () => {
    const tKey = reportTypes[currentTypeIndex];
    if (tKey === "rata-rata") return t("rataRata");
    return t(tKey);
  };

  const loadLaporanData = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, "transactions"),
        where("uid", "==", currentUser.uid)
      );
      const snap = await getDocs(q);

      let totalIncomeValue = 0;
      let totalExpenseValue = 0;
      const kategoriKalkulator = {};
      const harianKalkulator = {};

      const stringTahunBulan = `${reportDate.getFullYear()}-${String(
        reportDate.getMonth() + 1
      ).padStart(2, "0")}`;

      // Initialize all days in month to 0 for the harian line chart
      const jumlahHari = new Date(
        reportDate.getFullYear(),
        reportDate.getMonth() + 1,
        0
      ).getDate();
      for (let d = 1; d <= jumlahHari; d++) {
        harianKalkulator[
          `${stringTahunBulan}-${String(d).padStart(2, "0")}`
        ] = 0;
      }

      const tipeAktif = reportTypes[currentTypeIndex];

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.dateStr && data.dateStr.startsWith(stringTahunBulan)) {
          if (data.type === "income") totalIncomeValue += data.amount;
          if (data.type === "expense") totalExpenseValue += data.amount;

          // Category classification map for donut chart
          const targetType = tipeAktif === "pemasukan" ? "income" : "expense";
          if (data.type === targetType) {
            kategoriKalkulator[data.kategori] =
              (kategoriKalkulator[data.kategori] || 0) + data.amount;
          }

          // Daily expense map for line chart
          if (data.type === "expense") {
            harianKalkulator[data.dateStr] =
              (harianKalkulator[data.dateStr] || 0) + data.amount;
          }
        }
      });

      // Get current savings from user snap
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const totalSavingsValue = userSnap.exists()
        ? userSnap.data().savings || 0
        : currentSavings;

      setTotalIncome(totalIncomeValue);
      setTotalExpense(totalExpenseValue);
      setTotalSaving(totalSavingsValue);
      setKategoriSums(kategoriKalkulator);
      setHarianSums(harianKalkulator);
    } catch (e) {
      console.error("Error loading reports data: ", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaporanData();
  }, [reportDate, currentTypeIndex, currentUser, currentSavings]);

  // Handle Chart instance rendering
  useEffect(() => {
    if (loading) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const tipeAktif = reportTypes[currentTypeIndex];

    if (tipeAktif === "pemasukan" || tipeAktif === "pengeluaran") {
      const labels = Object.keys(kategoriSums);
      const values = Object.values(kategoriSums);

      if (labels.length === 0) {
        // Render dummy grey chart
        chartInstanceRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: [t("batal") === "Cancel" ? "Empty" : "Kosong"],
            datasets: [
              {
                data: [1],
                backgroundColor: ["#e2e8f0"]
              }
            ]
          },
          options: {
            plugins: {
              legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } else {
        // Translate labels for dynamic doughnut display
        const translatedLabels = labels.map(label => {
          if (label === "Uang Saku") return t("uangSaku");
          return t(label.toLowerCase());
        });

        // Render doughnut chart
        chartInstanceRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: translatedLabels,
            datasets: [
              {
                data: values,
                backgroundColor: warnaWarni.slice(0, labels.length),
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            cutout: "60%"
          }
        });
      }
    } else if (tipeAktif === "rata-rata") {
      // Render line chart
      const arrayTanggalKeys = Object.keys(harianSums);
      const arrayNilaiValues = Object.values(harianSums);
      const labelHariSaja = arrayTanggalKeys.map((k) => parseInt(k.split("-")[2]));

      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: labelHariSaja,
          datasets: [
            {
              data: arrayNilaiValues,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 1,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: "#f3f4f6" } }
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [loading, currentTypeIndex, kategoriSums, harianSums]);

  const handlePrevMonth = () => {
    const prev = new Date(reportDate.getTime());
    prev.setMonth(prev.getMonth() - 1);
    setReportDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(reportDate.getTime());
    next.setMonth(next.getMonth() + 1);
    setReportDate(next);
  };

  const handlePrevType = () => {
    setCurrentTypeIndex((prev) =>
      prev === 0 ? reportTypes.length - 1 : prev - 1
    );
  };

  const handleNextType = () => {
    setCurrentTypeIndex((prev) =>
      prev === reportTypes.length - 1 ? 0 : prev + 1
    );
  };

  const getKatTranslation = (name) => {
    if (name === "Uang Saku") return t("uangSaku");
    return t(name.toLowerCase());
  };

  const renderDataRows = () => {
    const tipeAktif = reportTypes[currentTypeIndex];

    if (tipeAktif === "pemasukan" || tipeAktif === "pengeluaran") {
      const labels = Object.keys(kategoriSums);
      const values = Object.values(kategoriSums);
      const totalUang = tipeAktif === "pemasukan" ? totalIncome : totalExpense;

      if (labels.length === 0) {
        return (
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            {t("tidakAdaData")}
          </p>
        );
      }

      return labels.map((label, index) => {
        const nominal = values[index];
        const persentase = totalUang > 0 ? Math.round((nominal / totalUang) * 100) : 0;
        return (
          <div
            key={label}
            className="flex justify-between items-center bg-white dark:bg-slate-900 border border-pink-50 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-sm text-xs shrink-0"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: warnaWarni[index] }}
              ></div>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {getKatTranslation(label)}
              </span>
            </div>
            <div className="flex gap-4 text-slate-600 dark:text-slate-400">
              <span className="font-medium">{persentase}%</span>
              <span className="font-bold text-slate-800 dark:text-white">
                Rp {nominal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        );
      });
    } else {
      // Rata Rata Line Chart Lists
      const arrayTanggalKeys = Object.keys(harianSums);
      const arrayNilaiValues = Object.values(harianSums);
      const activeRows = [];

      arrayTanggalKeys.forEach((tglFull, index) => {
        const pengeluaranHariIni = arrayNilaiValues[index];
        if (pengeluaranHariIni > 0) {
          const formatTglIndo = new Date(tglFull).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
          activeRows.push(
            <div
              key={tglFull}
              className="flex justify-between items-center bg-white dark:bg-slate-900 border border-pink-50 dark:border-slate-800 rounded-xl px-4 py-2 shadow-sm text-xs shrink-0"
            >
              <span className="dark:text-slate-300">{formatTglIndo}</span>
              <span className="font-bold text-slate-800 dark:text-white">
                Rp {pengeluaranHariIni.toLocaleString("id-ID")}
              </span>
            </div>
          );
        }
      });

      if (activeRows.length === 0) {
        return (
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            {t("tidakAdaPengeluaranBulanIni")}
          </p>
        );
      }

      return (
        <>
          <div className="flex justify-between px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 shrink-0">
            <span>{t("tanggal")}</span>
            <span>{t("totalPengeluaran")}</span>
          </div>
          {activeRows}
        </>
      );
    }
  };

  return (
    <div className="space-y-4 flex-grow flex flex-col min-h-0">
      {/* MONTH DATE PICKER NAVIGATION */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-full px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
        <button
          onClick={handlePrevMonth}
          className="text-pink-400 cursor-pointer"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <span className="font-bold">{formatBulanTahun(reportDate)}</span>
        <button
          onClick={handleNextMonth}
          className="text-pink-400 cursor-pointer"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* THREE SUMMARY BLOCKS GRID */}
      <div className="bg-[#fbcfe8] bg-opacity-40 rounded-2xl p-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px] border border-pink-200/30 dark:border-slate-800 shadow-inner shrink-0">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2 shadow-sm flex flex-col justify-center min-h-[50px]">
          <p className="text-slate-400 font-bold uppercase text-[9px]">
            {t("pemasukan")}
          </p>
          <p className="font-bold text-green-600 mt-0.5 truncate">
            Rp {totalIncome.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2 shadow-sm border border-pink-300 dark:border-pink-850 flex flex-col justify-center min-h-[50px]">
          <p className="text-slate-400 font-bold uppercase text-[9px]">
            {t("tabungan")}
          </p>
          <p className="font-bold text-pink-500 mt-0.5 truncate">
            Rp {totalSaving.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2 shadow-sm flex flex-col justify-center min-h-[50px]">
          <p className="text-slate-400 font-bold uppercase text-[9px]">
            {t("pengeluaran")}
          </p>
          <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
            Rp {totalExpense.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR CHANGER */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
        <button onClick={handlePrevType} className="text-pink-400 cursor-pointer">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <span className="uppercase tracking-widest text-slate-800 dark:text-white text-[11px]">
          {getTipeAktifText()}
        </span>
        <button onClick={handleNextType} className="text-pink-400 cursor-pointer">
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* CHART CANVAS BOARD */}
      <div className="bg-[#fbcfe8] bg-opacity-20 rounded-[32px] p-4 flex items-center justify-center min-h-[210px] max-h-[210px] relative border border-pink-100/40 dark:border-slate-800/40 shadow-inner shrink-0">
        {loading ? (
          <div className="text-xs text-slate-400">{t("memprosesDiagram")}</div>
        ) : (
          <canvas
            ref={canvasRef}
            id="financialChart"
            className="max-w-full max-h-[190px]"
          ></canvas>
        )}
      </div>

      {/* DATA BREAKDOWN LIST ROWS */}
      <div className="rep-data-list space-y-2 flex-grow overflow-y-auto custom-scroll max-h-[170px] pr-1 min-h-0">
        {loading ? (
          <div className="text-center text-xs text-slate-400 mt-6">
            {t("memuatRincian")}
          </div>
        ) : (
          renderDataRows()
        )}
      </div>
    </div>
  );
}
