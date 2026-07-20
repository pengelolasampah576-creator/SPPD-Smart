import React, { useState, useEffect } from "react";
import { Employee, Travel, TravelExpense } from "./types";
import { MASTER_EMPLOYEES } from "./data/employees";
import { MOCK_TRAVELS } from "./data/mockTravels";
import EmployeeDirectory from "./components/EmployeeDirectory";
import TravelForm from "./components/TravelForm";
import KPISection from "./components/KPISection";
import DocumentNotaDinas from "./components/DocumentNotaDinas";
import DocumentSuratTugas from "./components/DocumentSuratTugas";
import DocumentSPD from "./components/DocumentSPD";
import LoginPortal from "./components/LoginPortal";
import DocumentTelaahStaf from "./components/DocumentTelaahStaf";
import DocumentHonorarium from "./components/DocumentHonorarium";
import VortexBridging from "./components/VortexBridging";

import {
  Briefcase,
  Users,
  Settings,
  Plus,
  Compass,
  FileText,
  FileBadge,
  Printer,
  Calendar,
  MapPin,
  Plane,
  Coins,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen,
  Trash2,
  Edit,
  ArrowRightLeft
} from "lucide-react";

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("sppd_authenticated") === "true";
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem("sppd_user_role") || "";
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("sppd_user_name") || "";
  });

  const handleLoginSuccess = (role: string, name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    localStorage.setItem("sppd_authenticated", "true");
    localStorage.setItem("sppd_user_role", role);
    localStorage.setItem("sppd_user_name", name);
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem e-Perjadin?")) {
      setIsAuthenticated(false);
      setUserRole("");
      setUserName("");
      localStorage.removeItem("sppd_authenticated");
      localStorage.removeItem("sppd_user_role");
      localStorage.removeItem("sppd_user_name");
    }
  };

  // --- STATE ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [travels, setTravels] = useState<Travel[]>([]);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "travels" | "employees" | "telaah" | "bridging">("dashboard");
  const [selectedTravelId, setSelectedTravelId] = useState<string | null>(null);
  
  // Document Sub-tab state
  const [activeDocTab, setActiveDocTab] = useState<"nota" | "tugas" | "spd" | "honor">("nota");

  // Form toggles
  const [isCreatingTravel, setIsCreatingTravel] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);

  // Search filter for travels list
  const [travelSearchQuery, setTravelSearchQuery] = useState("");

  // --- LOCAL STORAGE SYNC ---
  useEffect(() => {
    // Load Employees
    const storedEmployees = localStorage.getItem("sppd_employees");
    if (storedEmployees) {
      try {
        setEmployees(JSON.parse(storedEmployees));
      } catch (e) {
        setEmployees(MASTER_EMPLOYEES);
      }
    } else {
      setEmployees(MASTER_EMPLOYEES);
      localStorage.setItem("sppd_employees", JSON.stringify(MASTER_EMPLOYEES));
    }

    // Load Travels
    const storedTravels = localStorage.getItem("sppd_travels");
    if (storedTravels) {
      try {
        setTravels(JSON.parse(storedTravels));
      } catch (e) {
        setTravels(MOCK_TRAVELS);
      }
    } else {
      setTravels(MOCK_TRAVELS);
      localStorage.setItem("sppd_travels", JSON.stringify(MOCK_TRAVELS));
    }
  }, []);

  // Update Employees in storage
  const handleUpdateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem("sppd_employees", JSON.stringify(newEmployees));
  };

  const handleAddEmployee = (emp: Employee) => {
    const updated = [emp, ...employees];
    handleUpdateEmployees(updated);
  };

  const handleEditEmployee = (emp: Employee) => {
    const updated = employees.map(e => e.id === emp.id ? emp : e);
    handleUpdateEmployees(updated);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    handleUpdateEmployees(updated);
  };

  // Update Travels in storage
  const handleUpdateTravels = (newTravels: Travel[]) => {
    setTravels(newTravels);
    localStorage.setItem("sppd_travels", JSON.stringify(newTravels));
  };

  const handleAddTravel = (newTravel: Travel) => {
    const updated = [newTravel, ...travels];
    handleUpdateTravels(updated);
    setIsCreatingTravel(false);
    setSelectedTravelId(newTravel.id); // Open documents automatically
    setActiveDocTab("nota"); // start with nota dinas
  };

  const handleEditTravel = (updatedTravel: Travel) => {
    const updated = travels.map(t => t.id === updatedTravel.id ? updatedTravel : t);
    handleUpdateTravels(updated);
    setEditingTravel(null);
  };

  const handleDeleteTravel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus data dan seluruh dokumen perjalanan dinas ini?")) {
      const updated = travels.filter(t => t.id !== id);
      handleUpdateTravels(updated);
      if (selectedTravelId === id) {
        setSelectedTravelId(null);
      }
    }
  };

  const handleUpdateExpenses = (updatedExpenses: TravelExpense[]) => {
    if (!selectedTravelId) return;
    const updated = travels.map(t => {
      if (t.id === selectedTravelId) {
        return { ...t, expenses: updatedExpenses };
      }
      return t;
    });
    handleUpdateTravels(updated);
  };

  // Helper date parsing
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

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Filter travels based on search
  const filteredTravels = travels.filter(t => {
    const searchLower = travelSearchQuery.toLowerCase();
    const matchesPurpose = t.purpose.toLowerCase().includes(searchLower);
    const matchesDestination = t.destination.toLowerCase().includes(searchLower);
    const matchesCodes = t.budgetCode.includes(searchLower) || t.notaNumber.toLowerCase().includes(searchLower) || t.taskLetterNumber.toLowerCase().includes(searchLower);
    
    // Search participants
    const matchesParticipant = t.employeeIds.some(empId => {
      const emp = employees.find(e => e.id === empId);
      return emp?.name.toLowerCase().includes(searchLower);
    });

    return matchesPurpose || matchesDestination || matchesCodes || matchesParticipant;
  });

  const selectedTravelObj = travels.find(t => t.id === selectedTravelId);

  if (!isAuthenticated) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* --- CLEAN MINIMALISM HEADER --- */}
      <header className="bg-white border-b border-slate-200 text-slate-800 relative shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Logo box */}
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white shadow-xs text-lg">
              PD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-[10px] text-blue-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-100">
                  Kabupaten Tabalong
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  Inspektorat Daerah
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold mt-0.5 tracking-tight text-slate-800 flex items-center gap-2">
                e-Perjadin & Kedinasan
                <span className="font-light text-slate-400 text-sm">v1.2</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Sistem Penomoran & Otomatisasi Dokumen Nota Dinas, Surat Tugas, dan SPD Pegawai.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline text-xs text-right text-slate-500 font-mono leading-relaxed">
              Lokasi: <b className="text-slate-700">Tabalong, Kalsel</b><br/>
              Waktu: {new Date().toLocaleDateString("id-ID", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
            
            {/* User Session Profile Widget */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-tight">{userName}</p>
                <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider">{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[10px] sm:text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-100 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                title="Keluar dari sistem"
              >
                Keluar
              </button>
            </div>
            
            <button
              id="quick-travel-btn"
              onClick={() => {
                setSelectedTravelId(null);
                setIsCreatingTravel(true);
                setEditingTravel(null);
                setActiveTab("travels");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-150 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat SPT Dinas
            </button>
          </div>
        </div>
      </header>


      {/* --- DASHBOARD PORTAL --- */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- NAVIGATION COLUMN SIDEBAR --- */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">Navigasi Utama</p>
            
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedTravelId(null);
                setIsCreatingTravel(false);
                setEditingTravel(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-150 flex items-center gap-3 cursor-pointer ${
                activeTab === "dashboard" && !selectedTravelId && !isCreatingTravel
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Compass className="w-5 h-5 opacity-80" />
              Beranda Statistik
            </button>

            <button
              onClick={() => {
                setActiveTab("travels");
                setIsCreatingTravel(false);
                setEditingTravel(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-150 flex items-center gap-3 cursor-pointer ${
                activeTab === "travels" || selectedTravelId || isCreatingTravel
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Briefcase className="w-5 h-5 opacity-80" />
              Kelola Perjalanan Dinas
            </button>

            <button
              onClick={() => {
                setActiveTab("employees");
                setSelectedTravelId(null);
                setIsCreatingTravel(false);
                setEditingTravel(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-150 flex items-center gap-3 cursor-pointer ${
                activeTab === "employees"
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Users className="w-5 h-5 opacity-80" />
              Database Pegawai
            </button>

            <button
              onClick={() => {
                setActiveTab("telaah");
                setSelectedTravelId(null);
                setIsCreatingTravel(false);
                setEditingTravel(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-150 flex items-center gap-3 cursor-pointer ${
                activeTab === "telaah"
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <FileText className="w-5 h-5 opacity-80 text-blue-600" />
              Telaahan Staf (AI)
            </button>

            <button
              id="sidebar-vortex-btn"
              onClick={() => {
                setActiveTab("bridging");
                setSelectedTravelId(null);
                setIsCreatingTravel(false);
                setEditingTravel(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-150 flex items-center gap-3 cursor-pointer ${
                activeTab === "bridging"
                  ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <ArrowRightLeft className="w-5 h-5 opacity-80 text-indigo-600" />
              Integrasi Vortex
            </button>
          </div>

          {/* Quick Guide card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Alur Penerbitan SPPD
            </h4>
            <div className="text-xs space-y-3 pt-1 text-slate-600">
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 font-bold flex items-center justify-center text-[10px] text-blue-600 shrink-0 border border-blue-25">1</span>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">1. Entry Kegiatan</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Pilih tanggal, rute, anggaran, beserta anggota tugas.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 font-bold flex items-center justify-center text-[10px] text-blue-600 shrink-0 border border-blue-25">2</span>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">2. Nota Dinas</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Cetak pengajuan Nota Dinas untuk mendapat persetujuan Bupati/Sekda.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 font-bold flex items-center justify-center text-[10px] text-blue-600 shrink-0 border border-blue-25">3</span>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">3. Surat Tugas & SPD</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Unduh Mandat Tugas serta lembaran SPD individual per pegawai.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 font-bold flex items-center justify-center text-[10px] text-blue-600 shrink-0 border border-blue-25">4</span>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">4. Rapor Biaya Belanja</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Update rincian pengeluaran riil tiket hotel untuk pencairan keuangan.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- VIEWPORT PANEL --- */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* A. BERANDA TAB */}
          {activeTab === "dashboard" && !selectedTravelId && !isCreatingTravel && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Selamat Datang di Portal E-SPPD Inspektorat</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Kelola administrasi perjalanan dinas secara tertib, cepat, presisi, dan terintegrasi dengan database kepegawaian.
                  </p>
                </div>
                <div className="bg-blue-50 px-3.5 py-2 rounded-xl text-blue-600 text-xs font-semibold border border-blue-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Basis Data: {employees.length} Pegawai Aktif
                </div>
              </div>

              {/* KPI metrics row */}
              <KPISection travels={travels} employees={employees} />

              {/* Recent Travels and Quick launch */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-xs">
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Daftar SPT Terbaru</h3>
                    <p className="text-xs text-slate-500">Mampu melihat rekapitulasi surat tugas yang baru saja diterbitkan.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("travels")}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1"
                  >
                    Lihat Selengkapnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {travels.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTravelId(t.id);
                        setActiveTab("travels");
                        setActiveDocTab("nota");
                      }}
                      className="py-4 hover:bg-slate-50 rounded-xl px-2 transition duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{t.notaNumber}</span>
                          <span className="text-xs font-bold text-blue-600 font-serif flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t.destination}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.purpose}</p>
                        <p className="text-xs text-slate-500">
                          Keberangkatan: {formatIndoDate(t.departureDate)} s.d {formatIndoDate(t.returnDate)} ({calculateDays(t.departureDate, t.returnDate)} Hari kerja)
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {/* Avatars */}
                        <div className="flex -space-x-2 overflow-hidden">
                          {t.employeeIds.slice(0, 3).map((empId) => {
                            const emp = employees.find(e => e.id === empId);
                            const initials = emp ? emp.name.substring(0, 2).toUpperCase() : "ST";
                            return (
                              <div
                                key={empId}
                                title={emp?.name}
                                className="inline-block h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-mono text-[10px] font-bold border-2 border-white flex items-center justify-center uppercase"
                              >
                                {initials}
                              </div>
                            );
                          })}
                          {t.employeeIds.length > 3 && (
                            <div className="inline-block h-7 w-7 rounded-full bg-slate-200 text-slate-705 font-mono text-[9px] font-bold border-2 border-white flex items-center justify-center">
                              +{t.employeeIds.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
                          Lihat Dokumen
                        </span>
                      </div>
                    </div>
                  ))}

                  {travels.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      Belum ada dokumen perjalanan dinas terekam.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* B. LIST TRANSMISSION TAB */}
          {activeTab === "travels" && !selectedTravelId && !isCreatingTravel && !editingTravel && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-150">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Manajemen Perjalanan Dinas
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Cari surat perintah kumpulkan tanda tangan dan rincian pembebanan kas perjalanan secara terpusat.
                  </p>
                </div>
                <button
                  id="btn-create-travel-main"
                  onClick={() => setIsCreatingTravel(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Buat Surat Dinas Baru
                </button>
              </div>


              {/* Travel Search and stats count */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="travel-search"
                  type="text"
                  placeholder="Saring berdasarkan tujuan, pejabat penandatangan, kode anggaran, dokumen..."
                  value={travelSearchQuery}
                  onChange={(e) => setTravelSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Grid or list of Travels */}
              <div className="space-y-4">
                {filteredTravels.map((travel) => {
                  const duration = calculateDays(travel.departureDate, travel.returnDate);
                  const leader = employees.find(e => e.id === travel.signatoryId);
                  const costTotal = travel.expenses.reduce((sum, ex) => {
                    return sum + ex.transportCost + (ex.dailyAllowance * duration) + (ex.lodgingCost * (duration > 1 ? duration - 1 : 0)) + ex.otherCost;
                  }, 0);

                  return (
                    <div
                      key={travel.id}
                      onClick={() => {
                        setSelectedTravelId(travel.id);
                        setActiveDocTab("nota"); // Default to nota dinas inside details
                      }}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm hover:border-blue-400 transition duration-150 cursor-pointer flex flex-col md:flex-row justify-between gap-4 group"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-50 text-blue-600 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-blue-100">
                            ST: {travel.taskLetterNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 select-all font-mono">
                            ND: {travel.notaNumber}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                          {travel.purpose}
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Tujuan</span>
                            <span className="text-xs text-slate-700 font-semibold flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {travel.destination}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Waktu & Durasi</span>
                            <span className="text-xs text-slate-700 font-semibold mt-0.5 block">
                              {formatIndoDate(travel.departureDate)} ({duration} Hari)
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold font-mono">Kode Rekening</span>
                            <span className="text-xs text-slate-600 font-mono font-medium mt-0.5 block">{travel.budgetCode}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Jumlah Anggaran</span>
                            <span className="text-xs text-blue-600 font-bold mt-0.5 block">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(costTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Roster of participants */}
                        <div className="pt-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">Anggota Tugas ({travel.employeeIds.length}):</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {travel.employeeIds.map(empId => {
                              const emp = employees.find(e => e.id === empId);
                              if (!emp) return null;
                              return (
                                <span key={empId} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                  {emp.name.split(',')[0]}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Side tools */}
                      <div className="flex flex-row md:flex-col justify-between items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                        <button
                          onClick={(e) => handleDeleteTravel(travel.id, e)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTravel(travel);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          Edit No/Rute
                        </button>
                        <span className="bg-blue-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl group-hover:bg-blue-700 transition shadow-sm cursor-pointer flex items-center gap-1">
                          Proses Dokumen
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredTravels.length === 0 && (
                  <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Kegiatan tidak ditemukan</p>
                    <p className="text-slate-400 text-xs mt-1">Saring kata kunci di atas atau klik buat baru.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. CREATING TRAVEL COMPONENT */}
          {activeTab === "travels" && isCreatingTravel && (
            <TravelForm
              employees={employees}
              onSubmit={handleAddTravel}
              onCancel={() => setIsCreatingTravel(false)}
            />
          )}

          {/* D. EDITING TRAVEL SPECIFICS */}
          {activeTab === "travels" && editingTravel && (
            <TravelForm
              employees={employees}
              onSubmit={handleEditTravel}
              onCancel={() => setEditingTravel(null)}
              initialTravel={editingTravel}
            />
          )}

          {/* E. INDIVIDUAL TRAVEL DETAILED DOCUMENTS WORKSPACE */}
          {activeTab === "travels" && selectedTravelId && selectedTravelObj && !isCreatingTravel && !editingTravel && (
            <div className="space-y-6">
              
              {/* BACK BAR INFO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedTravelId(null)}
                    className="text-blue-600 hover:text-blue-750 text-xs font-bold flex items-center gap-1 cursor-pointer mb-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                  >
                    ← Kembali ke Daftar Perjalanan Dinas
                  </button>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {selectedTravelObj.purpose}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    Destinasi: <span className="text-blue-600 font-bold">{selectedTravelObj.destination}</span> | Durasi: <span className="font-bold text-slate-700">{calculateDays(selectedTravelObj.departureDate, selectedTravelObj.returnDate)} Hari</span>
                  </p>
                </div>
              </div>

              {/* DOCUMENT TABS SELECTORS */}
              <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200 gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveDocTab("nota")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-w-[120px] ${
                    activeDocTab === "nota"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white/40"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  1. Nota Dinas Memo
                </button>
                <button
                  onClick={() => setActiveDocTab("tugas")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-w-[120px] ${
                    activeDocTab === "tugas"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white/40"
                  }`}
                >
                  <FileBadge className="w-4 h-4" />
                  2. Surat Tugas (SPT)
                </button>
                <button
                  onClick={() => setActiveDocTab("spd")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-w-[120px] ${
                    activeDocTab === "spd"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white/40"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  3. Format SPD Lembaran
                </button>
                <button
                  onClick={() => setActiveDocTab("honor")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-w-[120px] ${
                    activeDocTab === "honor"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white/40"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  4. Tanda Terima (Terlampir)
                </button>
              </div>

              {/* RENDERING DOCUMENTS */}
              <div>
                {activeDocTab === "nota" && (
                  <DocumentNotaDinas travel={selectedTravelObj} employees={employees} />
                )}
                {activeDocTab === "tugas" && (
                  <DocumentSuratTugas travel={selectedTravelObj} employees={employees} />
                )}
                {activeDocTab === "spd" && (
                  <DocumentSPD travel={selectedTravelObj} employees={employees} />
                )}
                {activeDocTab === "honor" && (
                  <DocumentHonorarium travel={selectedTravelObj} employees={employees} />
                )}
              </div>
            </div>
          )}

          {/* F. EMPLOYEES DIRECTORY MANAGER TAB */}
          {activeTab === "employees" && (
            <EmployeeDirectory
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onUpdateEmployees={handleUpdateEmployees}
            />
          )}

          {/* G. TELAAHAN STAF (STAFF STUDY) TAB */}
          {activeTab === "telaah" && (
            <DocumentTelaahStaf employees={employees} />
          )}

          {/* H. VORTEX PERDIN INTEGRATION HUB */}
          {activeTab === "bridging" && (
            <VortexBridging travels={travels} employees={employees} onUpdateTravels={handleUpdateTravels} />
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white py-8 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-800">
            © {new Date().getFullYear()} Pemerintah Kabupaten Tabalong — Inspektorat Daerah
          </p>
          <p className="text-slate-400">
            Tabalong, Kalimantan Selatan, Indonesia. All document layouts comply with Permendagri No. 113 / PPKD Standard Kalsel.
          </p>
        </div>
      </footer>
    </div>
  );
}
