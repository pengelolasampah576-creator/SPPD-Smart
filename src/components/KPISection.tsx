import React, { useState } from "react";
import { Travel, Employee } from "../types";
import { 
  Plane, 
  Users2, 
  Banknote, 
  CalendarDays, 
  Search, 
  X, 
  ChevronRight, 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Layers, 
  Check, 
  ArrowRight,
  Info
} from "lucide-react";

interface KPISectionProps {
  travels: Travel[];
  employees?: Employee[];
}

export default function KPISection({ travels, employees = [] }: KPISectionProps) {
  const [activeMetric, setActiveMetric] = useState<"trips" | "employees" | "budget" | "duration" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const totalTrips = travels.length;

  // Duration Helper
  const getDurationDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate unique employees assigned
  const uniqueAttendees = Array.from(
    new Set(travels.flatMap((t) => t.employeeIds))
  ).length;

  // Calculate total budget consumed
  const totalBudget = travels.reduce((total, t) => {
    const travelTotal = t.expenses.reduce((sum, ex) => {
      const days = getDurationDays(t.departureDate, t.returnDate);
      const nights = days > 1 ? days - 1 : 0;

      const daily = ex.dailyAllowance * days;
      const lodging = ex.lodgingCost * nights;
      return sum + ex.transportCost + daily + lodging + ex.otherCost;
    }, 0);
    return total + travelTotal;
  }, 0);

  // Average duration
  const averageDays = travels.length > 0 
    ? (travels.reduce((sum, t) => {
        return sum + getDurationDays(t.departureDate, t.returnDate);
      }, 0) / travels.length).toFixed(1)
    : "0";

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  // 1. Data Calculation: Unique Employee Details
  const getUniqueEmployeeData = () => {
    const data: { 
      employee: Employee; 
      tripsCount: number; 
      destinations: string[];
      totalSpent: number;
    }[] = [];
    
    employees.forEach(emp => {
      const empTravels = travels.filter(t => t.employeeIds.includes(emp.id));
      if (empTravels.length > 0) {
        // Calculate budget spent on this employee
        let empSpent = 0;
        empTravels.forEach(t => {
          const exp = t.expenses.find(e => e.employeeId === emp.id);
          if (exp) {
            const days = getDurationDays(t.departureDate, t.returnDate);
            const nights = days > 1 ? days - 1 : 0;
            empSpent += exp.transportCost + (exp.dailyAllowance * days) + (exp.lodgingCost * nights) + exp.otherCost;
          }
        });

        data.push({
          employee: emp,
          tripsCount: empTravels.length,
          destinations: Array.from(new Set(empTravels.map(t => t.destination))),
          totalSpent: empSpent
        });
      }
    });

    return data.sort((a, b) => b.tripsCount - a.tripsCount);
  };

  // 2. Data Calculation: Travel Budget Breakdowns
  const getTravelBudgetBreakdown = (travel: Travel) => {
    let transportTotal = 0;
    let dailyTotal = 0;
    let lodgingTotal = 0;
    let otherTotal = 0;

    const days = getDurationDays(travel.departureDate, travel.returnDate);
    const nights = days > 1 ? days - 1 : 0;

    travel.expenses.forEach(ex => {
      transportTotal += ex.transportCost;
      dailyTotal += ex.dailyAllowance * days;
      lodgingTotal += ex.lodgingCost * nights;
      otherTotal += ex.otherCost;
    });

    const total = transportTotal + dailyTotal + lodgingTotal + otherTotal;

    return {
      transportTotal,
      dailyTotal,
      lodgingTotal,
      otherTotal,
      total
    };
  };

  const handleMetricClick = (metric: "trips" | "employees" | "budget" | "duration") => {
    if (activeMetric === metric) {
      setActiveMetric(null);
    } else {
      setActiveMetric(metric);
      setSearchQuery(""); // Reset search on tab switch
    }
  };

  // Filter lists based on search
  const filteredTrips = travels.filter(t => 
    t.notaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = getUniqueEmployeeData().filter(item => 
    item.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.nip.includes(searchQuery) ||
    item.employee.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBudgetTrips = travels.filter(t => 
    t.notaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.budgetCode.includes(searchQuery) ||
    t.budgetSource.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(t => ({
    travel: t,
    breakdown: getTravelBudgetBreakdown(t)
  }));

  const filteredDurationTrips = [...travels].map(t => ({
    travel: t,
    days: getDurationDays(t.departureDate, t.returnDate)
  })).filter(item => 
    item.travel.notaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.travel.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.travel.destination.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.days - a.days);

  // Budget category totals for bento block
  const getBudgetCategoryTotals = () => {
    let transport = 0;
    let daily = 0;
    let lodging = 0;
    let other = 0;

    travels.forEach(t => {
      const days = getDurationDays(t.departureDate, t.returnDate);
      const nights = days > 1 ? days - 1 : 0;
      t.expenses.forEach(ex => {
        transport += ex.transportCost;
        daily += ex.dailyAllowance * days;
        lodging += ex.lodgingCost * nights;
        other += ex.otherCost;
      });
    });

    return { transport, daily, lodging, other };
  };

  const categoryTotals = getBudgetCategoryTotals();

  return (
    <div className="space-y-6">
      
      {/* 4 STATS CARDS */}
      <div id="kpi-statistics-rack" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL PERJALANAN */}
        <button
          id="kpi-card-trips"
          onClick={() => handleMetricClick("trips")}
          className={`bg-white p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer w-full group relative overflow-hidden ${
            activeMetric === "trips"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 shadow-md"
              : "border-slate-200 hover:border-blue-400 hover:shadow-xs"
          }`}
        >
          <div className={`p-3.5 rounded-xl transition ${
            activeMetric === "trips" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
          }`}>
            <Plane className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Perjalanan</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{totalTrips}</span>
            <span className="text-[10px] text-slate-550 block mt-1 font-medium flex items-center gap-1">
              Surat Perintah Aktif
              <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition" />
            </span>
          </div>
          {activeMetric === "trips" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </button>

        {/* CARD 2: PEGAWAI TERLIBAT */}
        <button
          id="kpi-card-employees"
          onClick={() => handleMetricClick("employees")}
          className={`bg-white p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer w-full group relative overflow-hidden ${
            activeMetric === "employees"
              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 shadow-md"
              : "border-slate-200 hover:border-indigo-400 hover:shadow-xs"
          }`}
        >
          <div className={`p-3.5 rounded-xl transition ${
            activeMetric === "employees" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
          }`}>
            <Users2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pegawai Terlibat</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{uniqueAttendees}</span>
            <span className="text-[10px] text-slate-550 block mt-1 font-medium flex items-center gap-1">
              Mobilisasi Sumber Daya
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition" />
            </span>
          </div>
          {activeMetric === "employees" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full"></div>
          )}
        </button>

        {/* CARD 3: REALISASI ANGGARAN */}
        <button
          id="kpi-card-budget"
          onClick={() => handleMetricClick("budget")}
          className={`bg-white p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer w-full group relative overflow-hidden ${
            activeMetric === "budget"
              ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10 shadow-md"
              : "border-slate-200 hover:border-purple-400 hover:shadow-xs"
          }`}
        >
          <div className={`p-3.5 rounded-xl transition ${
            activeMetric === "budget" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
          }`}>
            <Banknote className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Realisasi Anggaran</span>
            <span className="text-base font-extrabold text-slate-800 block mt-1 truncate" title={formatRupiah(totalBudget)}>
              {formatRupiah(totalBudget)}
            </span>
            <span className="text-[10px] text-slate-550 block mt-1 font-medium flex items-center gap-1">
              Pertanggungjawaban RIIL
              <ChevronRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-1 transition" />
            </span>
          </div>
          {activeMetric === "budget" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-600 rounded-full"></div>
          )}
        </button>

        {/* CARD 4: RATA-RATA DURASI */}
        <button
          id="kpi-card-duration"
          onClick={() => handleMetricClick("duration")}
          className={`bg-white p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer w-full group relative overflow-hidden ${
            activeMetric === "duration"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 shadow-md"
              : "border-slate-200 hover:border-emerald-400 hover:shadow-xs"
          }`}
        >
          <div className={`p-3.5 rounded-xl transition ${
            activeMetric === "duration" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
          }`}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Rata-rata Durasi</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">
              {averageDays} <span className="text-xs text-slate-500 font-bold">Hari</span>
            </span>
            <span className="text-[10px] text-slate-550 block mt-1 font-medium flex items-center gap-1">
              Waktu penugasan lapangan
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition" />
            </span>
          </div>
          {activeMetric === "duration" && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>
          )}
        </button>

      </div>

      {/* EXPANDED INTERACTIVE DETAILS WORKSPACE */}
      {activeMetric && (
        <div 
          id="kpi-details-workspace" 
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-3 duration-150 relative"
        >
          
          {/* HEADER SECTOR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl text-white ${
                activeMetric === "trips" ? "bg-blue-600" :
                activeMetric === "employees" ? "bg-indigo-600" :
                activeMetric === "budget" ? "bg-purple-600" : "bg-emerald-600"
              }`}>
                {activeMetric === "trips" && <Plane className="w-5 h-5" />}
                {activeMetric === "employees" && <Users2 className="w-5 h-5" />}
                {activeMetric === "budget" && <Banknote className="w-5 h-5" />}
                {activeMetric === "duration" && <CalendarDays className="w-5 h-5" />}
              </div>
              
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  {activeMetric === "trips" && "Rincian Basis Data Perjalanan Dinas"}
                  {activeMetric === "employees" && "Profil & Distribusi Pegawai Terlibat"}
                  {activeMetric === "budget" && "Laporan Keuangan & Penyerapan Anggaran"}
                  {activeMetric === "duration" && "Analisis Durasi Tugas Lapangan"}
                  
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase border ${
                    activeMetric === "trips" ? "bg-blue-50 text-blue-700 border-blue-100" :
                    activeMetric === "employees" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    activeMetric === "budget" ? "bg-purple-50 text-purple-700 border-purple-100" :
                    "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    {activeMetric === "trips" && `${filteredTrips.length} Dokumen`}
                    {activeMetric === "employees" && `${filteredEmployees.length} Pegawai`}
                    {activeMetric === "budget" && `${filteredBudgetTrips.length} Berkas`}
                    {activeMetric === "duration" && `${filteredDurationTrips.length} Perjalanan`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeMetric === "trips" && "Menampilkan data rute, nota dinas, tanggal keberangkatan, serta jumlah delegasi."}
                  {activeMetric === "employees" && "Pegawai aktif yang dimobilisasi dalam perjalanan dinas beserta histori tujuannya."}
                  {activeMetric === "budget" && "Analisis pengeluaran riil tiket transportasi, harian, hotel, dan biaya lain per perjalanan."}
                  {activeMetric === "duration" && "Menganalisis rentang hari dinas lapangan untuk koordinasi kerja."}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setActiveMetric(null)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 p-2 rounded-xl transition shrink-0 cursor-pointer"
              title="Tutup Detil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEARCH BAR & INFO ROW */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeMetric === "trips" ? "Cari nomor nota, tujuan, maksud..." :
                  activeMetric === "employees" ? "Cari nama, NIP, jabatan..." :
                  activeMetric === "budget" ? "Cari nota, kode anggaran, instansi..." :
                  "Cari nomor nota, tujuan dinas..."
                }
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none font-medium text-slate-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Klik salah satu kolom atau menu perjalanan untuk mengelola data secara dinamis.
            </span>
          </div>

          {/* DYNAMIC METRIC TABLE PRESENTATION */}

          {/* 1. TRIPS DETAILED TABLE */}
          {activeMetric === "trips" && (
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Nomor Nota & Tanggal</th>
                    <th className="py-3.5 px-4">Maksud Perjalanan Dinas (Tema)</th>
                    <th className="py-3.5 px-4">Tempat Tujuan</th>
                    <th className="py-3.5 px-4">Waktu Pelaksanaan</th>
                    <th className="py-3.5 px-4 text-center">Durasi</th>
                    <th className="py-3.5 px-4">Delegasi Terlibat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((t, idx) => {
                      const days = getDurationDays(t.departureDate, t.returnDate);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/55 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-850 font-mono">{t.notaNumber}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatIndoDate(t.notaDate)}</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 leading-relaxed max-w-xs">{t.purpose}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-750 px-2.5 py-1 rounded-md font-bold text-[11px] border border-blue-100">
                              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              {t.destination}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <p className="text-slate-700">{formatIndoDate(t.departureDate)}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">s.d {formatIndoDate(t.returnDate)}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-md font-mono text-[11px]">
                              {days} Hari
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {t.employeeIds.map(empId => {
                                const name = employees.find(e => e.id === empId)?.name || "Pegawai";
                                return (
                                  <span key={empId} className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-150">
                                    {name.split(",")[0]}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        Tidak ada perjalanan dinas yang cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. EMPLOYEES DETAILED TABLE */}
          {activeMetric === "employees" && (
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Nama Lengkap & NIP</th>
                    <th className="py-3.5 px-4">Pangkat / Golongan</th>
                    <th className="py-3.5 px-4">Jabatan Struktural/Fungsional</th>
                    <th className="py-3.5 px-4 text-center">Frekuensi Tugas</th>
                    <th className="py-3.5 px-4 text-right">Serapan Anggaran</th>
                    <th className="py-3.5 px-4">Destinasi Sering Dikunjungi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((item, idx) => (
                      <tr key={item.employee.id} className="hover:bg-slate-50/55 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-slate-850">{item.employee.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">NIP: {item.employee.nip || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-650">{item.employee.pangkat}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs leading-relaxed">{item.employee.jabatan}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-3 py-1 rounded-full text-[11px] font-mono">
                            {item.tripsCount} x Dinas
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                          {formatRupiah(item.totalSpent)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.destinations.map((d, i) => (
                              <span key={i} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150 text-[10px] font-medium">
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        Tidak ada data pegawai yang cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. BUDGET DETAILED WORKSPACE & BENTO */}
          {activeMetric === "budget" && (
            <div className="space-y-6">
              
              {/* Bento Grid breakdown category */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Akumulasi Transportasi</span>
                  <span className="text-base font-extrabold text-slate-850 font-mono block">{formatRupiah(categoryTotals.transport)}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Tiket pesawat & taksi riil</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Akumulasi Uang Harian</span>
                  <span className="text-base font-extrabold text-slate-850 font-mono block">{formatRupiah(categoryTotals.daily)}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Uang makan & representasi</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Akumulasi Hotel / Penginapan</span>
                  <span className="text-base font-extrabold text-slate-850 font-mono block">{formatRupiah(categoryTotals.lodging)}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Akomodasi bermalam petugas</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Akumulasi Biaya Lainnya</span>
                  <span className="text-base font-extrabold text-slate-850 font-mono block">{formatRupiah(categoryTotals.other)}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Pengeluaran tak terduga dinas</span>
                </div>

              </div>

              {/* Budget Table */}
              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4">No. Nota & Sub-Kegiatan</th>
                      <th className="py-3.5 px-4">Sumber Anggaran & Rekening</th>
                      <th className="py-3.5 px-4 text-right">Transport Riil</th>
                      <th className="py-3.5 px-4 text-right">Uang Harian</th>
                      <th className="py-3.5 px-4 text-right">Hotel & Lodging</th>
                      <th className="py-3.5 px-4 text-right">Lainnya</th>
                      <th className="py-3.5 px-4 text-right font-extrabold text-slate-800 bg-slate-50/60">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBudgetTrips.length > 0 ? (
                      filteredBudgetTrips.map((item, idx) => (
                        <tr key={item.travel.id} className="hover:bg-slate-50/55 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-850 font-mono">{item.travel.notaNumber}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed max-w-xs truncate">{item.travel.purpose}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-700 text-[11px] font-mono">{item.travel.budgetCode}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-medium mt-0.5">{item.travel.budgetSource.replace("DPA-SKPD", "").trim()}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-650">{formatRupiah(item.breakdown.transportTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-650">{formatRupiah(item.breakdown.dailyTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-650">{formatRupiah(item.breakdown.lodgingTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-650">{formatRupiah(item.breakdown.otherTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-purple-700 bg-purple-50/10 font-bold text-[13px]">
                            {formatRupiah(item.breakdown.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                          Tidak ada pertanggungjawaban anggaran yang cocok dengan pencarian "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. DURATION DETAILED TABLE */}
          {activeMetric === "duration" && (
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Nota Dinas / Surat Tugas</th>
                    <th className="py-3.5 px-4">Maksud Dinas (Tema) & Rute</th>
                    <th className="py-3.5 px-4">Metode Angkutan</th>
                    <th className="py-3.5 px-4">Tanggal Keberangkatan</th>
                    <th className="py-3.5 px-4">Tanggal Kepulangan</th>
                    <th className="py-3.5 px-4 text-center">Jumlah Hari</th>
                    <th className="py-3.5 px-4">Skala Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDurationTrips.length > 0 ? (
                    filteredDurationTrips.map((item, idx) => {
                      let tagColor = "bg-slate-100 text-slate-700 border-slate-200";
                      let tagLabel = "Tugas Ringkas";
                      if (item.days > 5) {
                        tagColor = "bg-rose-50 text-rose-700 border-rose-100";
                        tagLabel = "Tugas Panjang";
                      } else if (item.days >= 3) {
                        tagColor = "bg-amber-50 text-amber-700 border-amber-100";
                        tagLabel = "Tugas Sedang";
                      }

                      return (
                        <tr key={item.travel.id} className="hover:bg-slate-50/55 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-850 font-mono">{item.travel.notaNumber}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Surat Tugas: {item.travel.taskLetterNumber || "-"}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 leading-relaxed max-w-xs">{item.travel.purpose}</p>
                            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Rute: {item.travel.departurePlace || "Tanjung"} → {item.travel.destination}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold text-slate-600">
                              {item.travel.transportMode || "Transportasi Darat"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium">{formatIndoDate(item.travel.departureDate)}</td>
                          <td className="py-3.5 px-4 font-medium">{formatIndoDate(item.travel.returnDate)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-3 py-1 rounded-xl text-[12px] font-mono">
                              {item.days} Hari
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${tagColor}`}>
                              {tagLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                        Tidak ada durasi tugas yang cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BOTTOM QUICK FOOTER */}
          <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
            <span className="text-[11px] text-slate-400 font-medium font-mono">
              Database: sppd_smart_tabalong_v1.2 // Real-time sync channel
            </span>
            <button
              onClick={() => setActiveMetric(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              Tutup Panel Detil
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
