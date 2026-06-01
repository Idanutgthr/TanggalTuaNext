// src/app/dashboard/context.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const dict = {
  id: {
    // Categories
    makan: "Makan",
    belanja: "Belanja",
    pajak: "Pajak",
    transportasi: "Transportasi",
    medis: "Medis",
    hiburan: "Hiburan",
    lainnya: "Lainnya",
    gaji: "Gaji",
    investasi: "Investasi",
    bonus: "Bonus",
    uangSaku: "Uang Saku",

    // Common UI and Alerts
    batal: "Batal",
    simpan: "Simpan",
    harusNilaiValid: "Harus memasukkan nilai yang valid!",
    danaTabunganMelebihi: "Dana tabungan melebihi sisa uang Anda!",
    modeDisiplinAktifAturanKunci: "Mode Disiplin Aktif! Aturan keuangan Anda telah dikunci.",
    lengkapiDataKriteria: "Harus melengkapi semua kriteria aturan!",
    tabungan: "Tabungan",
    kustom: "Kustom",
    mudah: "Mudah",
    sedang: "Sedang",
    sulit: "Sulit",
    modeDisiplin: "Mode Disiplin",
    tambahAturan: "Tambah Aturan",
    nominalMaksimal: "Nominal Maksimal",
    perhari: "Per Hari",
    perbulan: "Per Bulan",
    rataRata: "Rata-rata",
    tidakAdaData: "Tidak ada data rincian untuk tipe ini.",
    tidakAdaPengeluaranBulanIni: "Tidak ada pengeluaran yang tercatat pada bulan ini.",
    tanggal: "Tanggal",
    totalPengeluaran: "Total Pengeluaran",
    memprosesDiagram: "Memproses diagram...",
    memuatRincian: "Memuat rincian laporan...",
    namaProfilBaru: "Masukkan nama profil baru:",
    namaBerhasilUbah: "Nama berhasil diubah!",
    fotoProfilBerhasilSimpan: "Foto profil berhasil disimpan!",
    apakahYakinKeluar: "Apakah Anda yakin ingin keluar?",
    modeLayar: "Mode layar",
    terang: "Terang",
    gelap: "Gelap",
    logout: "Keluar",
    bahasa: "Bahasa",
    tabunganSaya: "TABUNGAN SAYA",
    pemasukan: "Pemasukan",
    pengeluaran: "Pengeluaran",
    masukkanNominal: "Masukkan nominal...",
    tidakDapatMelihatBesok: "Tidak dapat melihat transaksi hari esok!",
    hapusCatatanTransaksi: "Hapus catatan transaksi",
    dataFormBelumLengkap: "Data form belum lengkap!",
    saldoTidakCukup: "Sisa saldo tidak mencukupi untuk nominal baru!",
    saldoTidakMencukupi: "Sisa saldo Anda tidak mencukupi!",
    transaksiDisimpan: "Transaksi berhasil disimpan!",
    histori: "Histori",
    memuatHistori: "Memuat histori transaksi...",
    belumAdaTransaksi: "Belum ada transaksi hari ini.",
    transaksi: "Transaksi",
    kosong: "Kosong",
    loadingDashboard: "Memuat data dashboard...",
    myBalance: "Saldo Saya",
    tarik: "Tarik",
    masukkanNominalTarik: "Masukkan nominal tabungan yang ingin ditarik:",
    danaTarikMelebihi: "Nominal penarikan melebihi jumlah tabungan Anda!",
    tarikBerhasil: "Tabungan berhasil ditarik ke saldo!",
  },
  en: {
    // Categories
    makan: "Food",
    belanja: "Shopping",
    pajak: "Tax",
    transportasi: "Transportation",
    medis: "Medical",
    hiburan: "Entertainment",
    lainnya: "Others",
    gaji: "Salary",
    investasi: "Investment",
    bonus: "Bonus",
    uangSaku: "Pocket Money",

    // Common UI and Alerts
    batal: "Cancel",
    simpan: "Save",
    harusNilaiValid: "Must enter a valid amount!",
    danaTabunganMelebihi: "Savings amount exceeds your remaining balance!",
    modeDisiplinAktifAturanKunci: "Discipline Mode Active! Your financial rules are locked.",
    lengkapiDataKriteria: "Must complete all rule criteria!",
    tabungan: "Savings",
    kustom: "Custom",
    mudah: "Easy",
    sedang: "Medium",
    sulit: "Hard",
    modeDisiplin: "Discipline Mode",
    tambahAturan: "Add Rule",
    nominalMaksimal: "Max Amount",
    perhari: "Per Day",
    perbulan: "Per Month",
    rataRata: "Average",
    tidakAdaData: "No detailed data for this type.",
    tidakAdaPengeluaranBulanIni: "No expenses recorded this month.",
    tanggal: "Date",
    totalPengeluaran: "Total Expense",
    memprosesDiagram: "Processing chart...",
    memuatRincian: "Loading report breakdown...",
    namaProfilBaru: "Enter new profile name:",
    namaBerhasilUbah: "Name successfully changed!",
    fotoProfilBerhasilSimpan: "Profile picture saved successfully!",
    apakahYakinKeluar: "Are you sure you want to log out?",
    modeLayar: "Display mode",
    terang: "Light",
    gelap: "Dark",
    logout: "Log Out",
    bahasa: "Language",
    tabunganSaya: "MY SAVINGS",
    pemasukan: "Income",
    pengeluaran: "Expense",
    masukkanNominal: "Enter amount...",
    tidakDapatMelihatBesok: "Cannot view tomorrow's transactions!",
    hapusCatatanTransaksi: "Delete transaction record",
    dataFormBelumLengkap: "Form data is incomplete!",
    saldoTidakCukup: "Remaining balance is insufficient for the new amount!",
    saldoTidakMencukupi: "Your balance is insufficient!",
    transaksiDisimpan: "Transaction saved successfully!",
    histori: "History",
    memuatHistori: "Loading transaction history...",
    belumAdaTransaksi: "No transactions today.",
    transaksi: "Transaction",
    kosong: "Empty",
    loadingDashboard: "Loading dashboard data...",
    myBalance: "My Balance",
    tarik: "Withdraw",
    masukkanNominalTarik: "Enter the amount of savings you want to withdraw:",
    danaTarikMelebihi: "Withdrawal amount exceeds your savings!",
    tarikBerhasil: "Savings successfully withdrawn to balance!",
  }
};

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [disiplinActive, setDisiplinActive] = useState(false);
  const [aturanBatasKategori, setAturanBatasKategori] = useState([]);
  const [tipeMenabungLevel, setTipeMenabungLevel] = useState("kustom");
  const [alokasiTabunganDisiplin, setAlokasiTabunganDisiplin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("id");
  const [themeMode, setThemeMode] = useState("light");

  // Load language and theme preference from localstorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("tanggaltua_language");
      if (savedLang) {
        setLanguage(savedLang);
      }
      const savedTheme = localStorage.getItem("tanggaltua_theme");
      if (savedTheme) {
        setThemeMode(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("tanggaltua_language", lang);
    }
  };

  const changeThemeMode = (theme) => {
    setThemeMode(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("tanggaltua_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const t = (key) => dict[language]?.[key] || key;

  const syncData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      const sekarang = new Date();
      const stringBulanSekarang = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}`;

      let balance = 0;
      let savings = 0;
      let isDisiplin = false;
      let level = "kustom";
      let alokasi = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        balance = data.balance || 0;
        savings = data.savings || 0;
        isDisiplin = data.disiplinActive || false;
        level = data.tipeMenabungLevel || "kustom";
        alokasi = data.alokasiTabunganDisiplin || 0;
        const lastResetMonth = data.lastResetMonth || stringBulanSekarang;

        // Auto rollover at end of month
        if (lastResetMonth !== stringBulanSekarang && balance > 0) {
          savings += balance;
          alert(
            `Periode baru dimulai! Sisa uang bulan lalu sebesar Rp ${balance.toLocaleString(
              "id-ID"
            )} otomatis dimasukkan ke tabungan.`
          );
          balance = 0;
          isDisiplin = false;
          level = "kustom";
          alokasi = 0;

          await setDoc(
            userRef,
            {
              balance: 0,
              savings: savings,
              lastResetMonth: stringBulanSekarang,
              disiplinActive: false,
              tipeMenabungLevel: "kustom",
              alokasiTabunganDisiplin: 0
            },
            { merge: true }
          );
        }
      } else {
        // Create initial user document if it doesn't exist
        await setDoc(userRef, {
          balance: 0,
          savings: 0,
          lastResetMonth: stringBulanSekarang,
          disiplinActive: false,
          tipeMenabungLevel: "kustom",
          alokasiTabunganDisiplin: 0
        });
      }

      setCurrentBalance(balance);
      setCurrentSavings(savings);
      setDisiplinActive(isDisiplin);
      setTipeMenabungLevel(level);
      setAlokasiTabunganDisiplin(alokasi);

      // Load rules
      const rulesSnap = await getDocs(collection(db, "users", uid, "rules"));
      const loadedRules = [];
      rulesSnap.forEach((doc) => {
        loadedRules.push(doc.data());
      });
      setAturanBatasKategori(loadedRules);
    } catch (error) {
      console.error("Error syncing user data: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await syncData(user.uid);
        setLoading(false);
      } else {
        setCurrentUser(null);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <DashboardContext.Provider
      value={{
        currentUser,
        currentBalance,
        setCurrentBalance,
        currentSavings,
        setCurrentSavings,
        disiplinActive,
        setDisiplinActive,
        aturanBatasKategori,
        setAturanBatasKategori,
        tipeMenabungLevel,
        setTipeMenabungLevel,
        alokasiTabunganDisiplin,
        setAlokasiTabunganDisiplin,
        loading,
        syncData,
        language,
        changeLanguage,
        themeMode,
        changeThemeMode,
        t
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
