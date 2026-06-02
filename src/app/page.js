"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";

const dict = {
  id: {
    welcome: "Selamat Datang di",
    kelola: "kelola keuangan dengan mudah dan lebih hemat",
    createAcc: "buat akun baru untuk mulai berhemat",
    signupTitle: "Daftar Akun",
    email: "Email",
    password: "kata Sandi",
    name: "Nama Lengkap",
    confirmPassword: "Konfirmasi Kata Sandi",
    login: "Masuk",
    register: "Daftar",
    haveAcc: "Sudah punya akun?",
    noAcc: "Belum punya akun?",
    loginHere: "Masuk di sini",
    signupHere: "Daftar di sini",
    orLoginWith: "ATAU MASUK DENGAN",
    passMismatch: "Kata sandi konfirmasi tidak cocok.",
    signupSuccess: "Pendaftaran berhasil!",
    loginFailed: "Gagal Masuk: ",
    memuat: "Memuat..."
  },
  en: {
    welcome: "Welcome to",
    kelola: "manage finances easily and save more",
    createAcc: "create a new account to start saving",
    signupTitle: "Register Account",
    email: "Email",
    password: "Password",
    name: "Full Name",
    confirmPassword: "Confirm Password",
    login: "Login",
    register: "Register",
    haveAcc: "Already have an account?",
    noAcc: "Don't have an account?",
    loginHere: "Login here",
    signupHere: "Register here",
    orLoginWith: "OR SIGN IN WITH",
    passMismatch: "Confirm password does not match.",
    signupSuccess: "Registration successful!",
    loginFailed: "Login failed: ",
    memuat: "Loading..."
  }
};

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState("id");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // Sync language and theme selection on mount
  useEffect(() => {
    const localLanguage = localStorage.getItem("tanggaltua_language");
    if (localLanguage) {
      setLanguage(localLanguage);
    }
    const localTheme = localStorage.getItem("tanggaltua_theme");
    if (localTheme) {
      if (localTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("tanggaltua_language", lang);
  };

  const t = (key) => dict[language]?.[key] || key;

  // Redirect if logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleToggleMode = () => {
    setIsSignUpMode((prev) => !prev);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUpMode) {
      if (password !== confirmPassword) {
        alert(t("passMismatch"));
        return;
      }
      createUserWithEmailAndPassword(auth, email, password)
        .then((res) => updateProfile(res.user, { displayName: name }))
        .then(() => {
          alert(t("signupSuccess"));
          setIsSignUpMode(false);
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        })
        .catch((err) => alert(err.message));
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch((err) => alert(t("loginFailed") + err.message));
    }
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider).catch((err) => alert(err.message));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center font-semibold text-slate-800 dark:text-white text-lg">
          {t("memuat")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-xl p-8 max-w-sm sm:max-w-md w-full min-h-[750px] flex flex-col items-center justify-between border border-pink-100 dark:border-slate-800 relative">
        
        {/* SLEEK GLOBE LANGUAGE TOGGLER BUTTON */}
        <div className="absolute top-6 right-6 z-10">
          <button
            type="button"
            onClick={() => changeLanguage(language === "id" ? "en" : "id")}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
          >
            <i className="fa-solid fa-globe"></i>
            {language === "id" ? "ID" : "EN"}
          </button>
        </div>

        <div className="w-full flex flex-col items-center flex-grow justify-center space-y-6">
          <div className="w-40 h-40 rounded-full bg-[#fbcfe8] bg-opacity-60 dark:bg-pink-950/20 flex items-center justify-center overflow-hidden relative mb-2">
            <i className="fa-solid fa-wallet text-6xl text-slate-700 dark:text-slate-350"></i>
          </div>

          <div className="text-center space-y-2">
            {isSignUpMode ? (
              <>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white leading-tight">
                  {t("signupTitle")}<br />
                  <span className="font-bold">Tanggal Tua</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[250px] mx-auto leading-relaxed">
                  {t("createAcc")}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white leading-tight">
                  {t("welcome")}<br />
                  <span className="font-bold">Tanggal Tua</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[250px] mx-auto leading-relaxed">
                  {t("kelola")}
                </p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
            {isSignUpMode && (
              <div className="relative animate-fadeIn">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-6 py-3 bg-[#fbcfe8] bg-opacity-60 dark:bg-slate-850/50 text-slate-700 dark:text-slate-200 placeholder-slate-650 dark:placeholder-slate-400 text-center rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-900"
                  placeholder={t("name")}
                />
              </div>
            )}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-3 bg-[#fbcfe8] bg-opacity-60 dark:bg-slate-850/50 text-slate-700 dark:text-slate-200 placeholder-slate-650 dark:placeholder-slate-400 text-center rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-900"
                placeholder={t("email")}
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-3 bg-[#fbcfe8] bg-opacity-60 dark:bg-slate-850/50 text-slate-700 dark:text-slate-200 placeholder-slate-650 dark:placeholder-slate-400 text-center rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-900"
                placeholder={t("password")}
              />
            </div>
            {isSignUpMode && (
              <div className="animate-fadeIn">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-6 py-3 bg-[#fbcfe8] bg-opacity-60 dark:bg-slate-850/50 text-slate-700 dark:text-slate-200 placeholder-slate-650 dark:placeholder-slate-400 text-center rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-900"
                  placeholder={t("confirmPassword")}
                />
              </div>
            )}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-[#fbcfe8] hover:bg-[#f9a8d4] dark:bg-pink-400 dark:hover:bg-pink-300 text-slate-800 font-semibold rounded-full text-base shadow-sm transition cursor-pointer"
              >
                {isSignUpMode ? t("register") : t("login")}
              </button>
            </div>
          </form>

          <div className="text-center text-xs font-medium text-slate-700 dark:text-slate-350 pt-1">
            <span>{isSignUpMode ? t("haveAcc") : t("noAcc")}</span>
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-pink-500 dark:text-pink-400 font-bold hover:underline ml-1 cursor-pointer"
            >
              {isSignUpMode ? t("loginHere") : t("signupHere")}
            </button>
          </div>

          <div className="pt-2 w-full flex flex-col items-center space-y-3">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider">
              {t("orLoginWith")}
            </span>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 hover:scale-105 transition cursor-pointer"
            >
              <i className="fa-brands fa-google text-red-500 text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
