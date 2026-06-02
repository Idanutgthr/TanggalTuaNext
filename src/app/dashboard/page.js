// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "./context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";

const kategoriData = {
  expense: [
    { name: "Makan", icon: "fa-utensils", color: "text-sky-400" },
    { name: "Belanja", icon: "fa-bag-shopping", color: "text-purple-400" },
    { name: "Pajak", icon: "fa-money-bill-wave", color: "text-emerald-400" },
    { name: "Transportasi", icon: "fa-car", color: "text-green-500" },
    { name: "Medis", icon: "fa-kit-medical", color: "text-red-500" },
    { name: "Hiburan", icon: "fa-gamepad", color: "text-amber-500" },
    { name: "Lainnya", icon: "fa-window-maximize", color: "text-yellow-600" }
  ],
  income: [
    { name: "Gaji", icon: "fa-wallet", color: "text-blue-500" },
    { name: "Investasi", icon: "fa-chart-line", color: "text-emerald-500" },
    { name: "Bonus", icon: "fa-gift", color: "text-amber-500" },
    { name: "Uang Saku", icon: "fa-coins", color: "text-teal-400" }
  ]
};

function TransactionItem({ transaction, onEdit, onDelete, t }) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const kf = [...kategoriData.expense, ...kategoriData.income].find(
    (k) => k.name === transaction.kategori
  );

  const getKatTranslation = (name) => {
    if (name === "Uang Saku") return t("uangSaku");
    return t(name.toLowerCase());
  };

  const handleStart = (clientX) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX - startX;
    if (diff < -50) {
      setSwiped(true);
    } else if (diff > 50) {
      setSwiped(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[66px] w-full border border-pink-50 dark:border-slate-800 shadow-sm shrink-0">
      {/* Action background layer: Hapus (left) - Edit (center) - Batal (right) */}
      <div className="absolute inset-0 bg-pink-100 dark:bg-pink-950/20 flex items-center justify-around px-4 z-0">
        <button
          onClick={() => {
            onDelete(transaction);
            setSwiped(false);
          }}
          className="bg-[#f87171] text-white font-bold px-4 py-1.5 rounded-full text-xs shadow-sm cursor-pointer"
        >
          {t("batal") === "Cancel" ? "Delete" : "Hapus"}
        </button>
        <button
          onClick={() => {
            onEdit(transaction);
            setSwiped(false);
          }}
          className="bg-[#fbbf24] text-slate-800 font-bold px-5 py-1.5 rounded-full text-xs shadow-sm cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={() => setSwiped(false)}
          className="bg-[#4ade80] text-white font-bold px-4 py-1.5 rounded-full text-xs shadow-sm cursor-pointer"
        >
          {t("batal")}
        </button>
      </div>

      {/* Content Layer */}
      <div
        style={{
          transform: swiped ? "translateX(-100%)" : "translateX(0)"
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        className="layer-konten flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-3 relative z-10 w-full h-full transition-transform duration-300 transform cursor-grab select-none"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="w-10 h-10 bg-[#fbcfe8] bg-opacity-40 dark:bg-pink-950/40 rounded-xl flex items-center justify-center text-slate-700 dark:text-pink-350">
            <i className={`fa-solid ${kf ? kf.icon : "fa-tags"}`}></i>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {getKatTranslation(transaction.kategori)}
            </p>
            <p className="text-[10px] text-slate-400">{transaction.timeStr}</p>
          </div>
        </div>
        <span
          className={`text-xs font-bold pointer-events-none ${transaction.type === "income" ? "text-green-600 animate-pulse" : "text-slate-700 dark:text-slate-200"
            }`}
        >
          {transaction.type === "income" ? "+" : "-"} Rp.{" "}
          {transaction.amount.toLocaleString("id-ID")}
        </span>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  const {
    currentUser,
    currentBalance,
    setCurrentBalance,
    disiplinActive,
    aturanBatasKategori,
    syncData,
    language,
    t
  } = useDashboard();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loadingHistori, setLoadingHistori] = useState(true);
  const [showInputPanel, setShowInputPanel] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState("expense");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  const formatTanggalString = (date) => {
    return date.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTanggalDatabase = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const loadHistoriHariIni = async () => {
    if (!currentUser) return;
    setLoadingHistori(true);
    const dateStr = formatTanggalDatabase(currentDate);
    try {
      const q = query(
        collection(db, "transactions"),
        where("uid", "==", currentUser.uid),
        where("dateStr", "==", dateStr)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort in-memory to prevent requiring a composite index in Firestore
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setTransactions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistori(false);
    }
  };

  useEffect(() => {
    loadHistoriHariIni();
  }, [currentDate, currentUser]);

  const handlePrevDate = () => {
    const prev = new Date(currentDate.getTime());
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDate = () => {
    const today = new Date();
    const next = new Date(currentDate.getTime());
    next.setDate(next.getDate() + 1);

    next.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (next > today) {
      alert(t("tidakDapatMelihatBesok"));
      return;
    }
    setCurrentDate(next);
  };

  const handleOpenInput = () => {
    setEditingTransactionId(null);
    setTransactionAmount("");
    setSelectedKategori("");
    setSelectedType("expense");
    setShowInputPanel(true);
  };

  const handleCancelInput = () => {
    setShowInputPanel(false);
    setEditingTransactionId(null);
    setTransactionAmount("");
    setSelectedKategori("");
  };

  const handleEdit = (transaction) => {
    setEditingTransactionId(transaction.id);
    setTransactionAmount(transaction.amount.toString());
    setSelectedType(transaction.type);
    setSelectedKategori(transaction.kategori);
    setShowInputPanel(true);
  };

  const handleDelete = async (transaction) => {
    if (!currentUser) return;
    if (confirm(`${t("hapusCatatanTransaksi")} ${transaction.kategori}?`)) {
      try {
        let newBalance = currentBalance;
        if (transaction.type === "income") {
          newBalance -= transaction.amount;
        } else {
          newBalance += transaction.amount;
        }

        await deleteDoc(doc(db, "transactions", transaction.id));
        await updateDoc(doc(db, "users", currentUser.uid), {
          balance: newBalance
        });

        setCurrentBalance(newBalance);
        loadHistoriHariIni();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseInt(transactionAmount);
    if (!amount || amount <= 0 || !selectedKategori || !currentUser) {
      alert(t("dataFormBelumLengkap"));
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      let newBalance = currentBalance;

      if (editingTransactionId) {
        // Revert old transaction balance impact
        const oldSnap = await getDoc(
          doc(db, "transactions", editingTransactionId)
        );
        if (oldSnap.exists()) {
          const old = oldSnap.data();
          if (old.type === "income") {
            newBalance -= old.amount;
          } else {
            newBalance += old.amount;
          }
        }

        if (selectedType === "expense" && amount > newBalance) {
          alert(t("saldoTidakCukup"));
          return;
        }

        if (selectedType === "income") {
          newBalance += amount;
        } else {
          newBalance -= amount;
        }

        await updateDoc(doc(db, "transactions", editingTransactionId), {
          amount: amount,
          type: selectedType,
          kategori: selectedKategori
        });
        alert(t("namaBerhasilUbah"));
      } else {
        // Create Mode
        if (selectedType === "expense") {
          if (amount > newBalance) {
            alert(t("saldoTidakMencukupi"));
            return;
          }

          // DISCIPLINE MODE THRESHOLD CHECKING
          if (disiplinActive) {
            const rule = aturanBatasKategori.find(
              (r) => r.kategori === selectedKategori
            );
            if (rule) {
              let totalPengeluaranTercatat = 0;
              const tglFormatLokal = formatTanggalDatabase(currentDate);
              const bulanFormatLokal = tglFormatLokal.substring(0, 7);

              const qCek = query(
                collection(db, "transactions"),
                where("uid", "==", currentUser.uid),
                where("kategori", "==", selectedKategori)
              );
              const snapCek = await getDocs(qCek);

              snapCek.forEach((d) => {
                const tData = d.data();
                if (
                  rule.periode === "hari" &&
                  tData.dateStr === tglFormatLokal
                ) {
                  totalPengeluaranTercatat += tData.amount;
                } else if (
                  rule.periode === "bulan" &&
                  tData.dateStr &&
                  tData.dateStr.startsWith(bulanFormatLokal)
                ) {
                  totalPengeluaranTercatat += tData.amount;
                }
              });

              if (totalPengeluaranTercatat + amount > rule.limit) {
                const textPeriode =
                  rule.periode === "hari" ? t("perhari") : t("perbulan");
                const warningMsg = language === "id"
                  ? `[PERINGATAN DISIPLIN TANGGALTUA]\n\nAkumulasi pengeluaran Anda untuk Kategori "${selectedKategori}" pada ${textPeriode} akan melebihi batasan maksimal!\n\n• Pengeluaran Lalu: Rp ${totalPengeluaranTercatat.toLocaleString(
                    "id-ID"
                  )}\n• Input Baru: Rp ${amount.toLocaleString(
                    "id-ID"
                  )}\n• Total Gabungan: Rp ${(
                    totalPengeluaranTercatat + amount
                  ).toLocaleString("id-ID")}\n• Batas Maksimal: Rp ${rule.limit.toLocaleString(
                    "id-ID"
                  )}\n\nTetap ingin melanjutkan transaksi ini?`
                  : `[TANGGALTUA DISCIPLINE WARNING]\n\nYour accumulated expense for Category "${selectedKategori}" in this ${textPeriode} will exceed the maximum limit!\n\n• Past Expense: Rp ${totalPengeluaranTercatat.toLocaleString(
                    "id-ID"
                  )}\n• New Input: Rp ${amount.toLocaleString(
                    "id-ID"
                  )}\n• Total Combined: Rp ${(
                    totalPengeluaranTercatat + amount
                  ).toLocaleString("id-ID")}\n• Max Limit: Rp ${rule.limit.toLocaleString(
                    "id-ID"
                  )}\n\nDo you still want to proceed with this transaction?`;
                const lanjut = confirm(warningMsg);
                if (!lanjut) return;
              }
            }
          }
          newBalance -= amount;
        } else {
          newBalance += amount;
        }

        const skrg = new Date();
        const waktu = skrg
          .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          .replace(".", ":");

        await addDoc(collection(db, "transactions"), {
          uid: currentUser.uid,
          amount: amount,
          type: selectedType,
          kategori: selectedKategori,
          dateStr: formatTanggalDatabase(currentDate),
          timeStr: waktu,
          timestamp: Date.now()
        });
        alert(t("transaksiDisimpan"));
      }

      await updateDoc(userRef, { balance: newBalance });
      setCurrentBalance(newBalance);
      handleCancelInput();
      loadHistoriHariIni();
    } catch (e) {
      alert(e.message);
    }
  };

  const getKatTranslation = (name) => {
    if (name === "Uang Saku") return t("uangSaku");
    return t(name.toLowerCase());
  };

  return (
    <div className="space-y-4 flex-grow flex flex-col min-h-0">
      {/* HISTORI LISTING PANEL */}
      {!showInputPanel ? (
        <div className="space-y-4 flex-grow flex flex-col min-h-0">
          <div className="bg-[#fbcfe8] bg-opacity-50 dark:bg-slate-800 rounded-full py-2 text-center font-bold text-sm text-slate-700 dark:text-slate-300 shadow-sm uppercase tracking-widest shrink-0">
            {t("histori")}
          </div>

          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-full px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
            <button
              onClick={handlePrevDate}
              className="text-pink-400 hover:scale-120 transition cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="font-bold tracking-tight">
              {formatTanggalString(currentDate)}
            </span>
            <button
              onClick={handleNextDate}
              className="text-pink-400 hover:scale-120 transition cursor-pointer"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className="histori-list space-y-2 flex-grow overflow-y-auto custom-scroll max-h-[340px] md:max-h-[420px] lg:max-h-[500px] pr-1 min-h-0">
            {loadingHistori ? (
              <p className="text-center text-xs text-slate-400 mt-16 font-medium">
                {t("memuatHistori")}
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-xs text-slate-400 mt-16 font-medium">
                {t("belumAdaTransaksi")}
              </p>
            ) : (
              transactions.map((tItem) => (
                <TransactionItem
                  key={tItem.id}
                  transaction={tItem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  t={t}
                />
              ))
            )}
          </div>

          <button
            onClick={handleOpenInput}
            className="w-full bg-[#fbcfe8] hover:bg-[#f9a8d4] dark:bg-pink-600 dark:hover:bg-pink-500 dark:text-white text-slate-800 font-bold py-3.5 rounded-full text-sm tracking-wide shadow-md transition mt-auto shrink-0 cursor-pointer"
          >
            {t("transaksi")}
          </button>
        </div>
      ) : (
        /* TRANSACTION INPUT FORM PANEL */
        <div className="space-y-4 flex-grow flex flex-col min-h-0 animate-fadeIn">
          {/* INCOME VS EXPENSE TABS */}
          <div className="bg-[#fbcfe8] bg-opacity-40 dark:bg-slate-800 rounded-full p-1 flex border border-pink-200/30 dark:border-slate-750 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedType("income");
                setSelectedKategori("");
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition duration-200 cursor-pointer ${selectedType === "income"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400"
                }`}
            >
              {t("pemasukan")}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("expense");
                setSelectedKategori("");
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition duration-200 cursor-pointer ${selectedType === "expense"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400"
                }`}
            >
              {t("pengeluaran")}
            </button>
          </div>

          {/* NOMINAL INPUT */}
          <div className="relative shrink-0">
            <input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder={t("masukkanNominal")}
              required
              className="w-full px-6 py-3.5 border-2 border-[#fbcfe8] dark:border-slate-800 rounded-full text-base font-bold text-center focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
            />
          </div>

          {/* CATEGORY GRID */}
          <div className="kategori-grid grid grid-cols-3 gap-y-4 gap-x-2 py-2 text-center overflow-y-auto custom-scroll max-h-[260px] md:max-h-[340px] lg:max-h-[420px] flex-grow min-h-0">
            {kategoriData[selectedType].map((kat) => {
              const activeStyle =
                kat.name === selectedKategori
                  ? "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-800"
                  : "border-transparent";
              return (
                <div
                  key={kat.name}
                  onClick={() => setSelectedKategori(kat.name)}
                  className={`flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-pink-50 dark:hover:bg-slate-800 transition border ${activeStyle}`}
                >
                  <div
                    className={`w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-inner mb-1 text-xl ${kat.color}`}
                  >
                    <i className={`fa-solid ${kat.icon}`}></i>
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    {getKatTranslation(kat.name)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* FORM ACTIONS */}
          <div className="flex gap-3 mt-auto pt-2 shrink-0">
            <button
              onClick={handleCancelInput}
              type="button"
              className="flex-1 bg-white dark:bg-slate-800 border-2 border-pink-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-full text-sm cursor-pointer"
            >
              {t("batal")}
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="flex-1 bg-[#fbcfe8] hover:bg-[#f9a8d4] dark:bg-pink-600 dark:hover:bg-pink-500 dark:text-white text-slate-800 font-bold py-3 rounded-full text-sm shadow-md transition cursor-pointer"
            >
              {editingTransactionId ? t("simpan") : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
