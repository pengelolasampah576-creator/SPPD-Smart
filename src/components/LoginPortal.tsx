import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

interface LoginPortalProps {
  onLoginSuccess: (role: string, userName: string) => void;
}

export default function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate database/API check
    setTimeout(() => {
      const cleanUsername = username.trim().toLowerCase();
      
      if (!cleanUsername || !password.trim()) {
        setError("Nama pengguna dan kata sandi wajib diisi.");
        setIsLoading(false);
        return;
      }

      // Check default admin credentials
      if (cleanUsername === "admin" && password === "inspektorat123") {
        onLoginSuccess("Administrator", "Admin Inspektorat");
        setIsLoading(false);
      } else if (cleanUsername === "inspektur" && password === "tabalong123") {
        onLoginSuccess("Pimpinan", "Diyarto, SE, MT");
        setIsLoading(false);
      } else {
        setError("Kredensial salah. Silakan periksa kembali nama pengguna dan kata sandi Anda.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Visual Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 p-8 shadow-2xl relative z-10 transition-all">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-2xl mb-4 relative group">
            <Lock className="w-6 h-6 text-white group-hover:scale-110 transitionduration-150" />
            <div className="absolute -inset-0.5 bg-blue-600 rounded-xl blur-sm opacity-30 -z-10 animate-pulse"></div>
          </div>
          <span className="bg-blue-500/10 text-[10px] text-blue-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20 inline-block">
            Portal Keamanan Dokumen
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-3">
            e-Perjadin & Kedinasan
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sistem Informasi Penomoran & Administrasi Surat Perjalanan Dinas Inspektorat Kabupaten Tabalong
          </p>
        </div>

        {/* Warning/Info credentials helper box */}
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-3.5 mb-6 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Akses Masuk Default (Secured):
          </div>
          <div className="text-slate-300 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span>NIP / Username:</span>
              <span className="text-white font-semibold selection:bg-blue-600">admin</span>
            </div>
            <div className="flex justify-between">
              <span>Kata Sandi:</span>
              <span className="text-white font-semibold selection:bg-blue-600">inspektorat123</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs p-3 rounded-xl flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Nama Pengguna / NIP
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                <User className="w-4.5 h-4.5 text-slate-500" />
              </span>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan nama pengguna..."
                className="w-full bg-slate-900/60 border border-slate-75 *::placeholder-slate-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Kata Sandi / PIN
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-slate-900/60 border border-slate-75 *::placeholder-slate-500 text-white rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-150 shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Masuk ke Portal Aplikasi"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center text-[10px] text-slate-500">
          <p className="flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Sertifikasi Keamanan Internal Inspektorat Daerah
          </p>
        </div>
      </div>
    </div>
  );
}
