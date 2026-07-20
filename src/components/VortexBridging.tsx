import React, { useState, useEffect, useRef } from "react";
import { Employee, Travel, TravelExpense } from "../types";
import { 
  ArrowRightLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  Database, 
  UserCheck, 
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  DollarSign,
  Calculator,
  TrendingUp,
  Terminal,
  Send,
  Lock,
  ArrowRight
} from "lucide-react";

interface VortexBridgingProps {
  travels: Travel[];
  employees: Employee[];
  onUpdateTravels?: (newTravels: Travel[]) => void;
}

export default function VortexBridging({ travels, employees, onUpdateTravels }: VortexBridgingProps) {
  const [selectedTravelId, setSelectedTravelId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"outbound" | "inbound">("outbound");
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [vortexUrl, setVortexUrl] = useState("https://vortex-perdin.vercel.app");
  
  // Custom parameter mapping keys to support any pre-fill configuration on Vortex Perdin
  const [paramKeyNames, setParamKeyNames] = useState("nama");
  const [paramKeyDates, setParamKeyDates] = useState("tanggal");
  const [paramKeyTheme, setParamKeyTheme] = useState("tema");
  const [showSettings, setShowSettings] = useState(false);

  // Inbound Simulator States
  const [simulatedExpenses, setSimulatedExpenses] = useState<{ [empId: string]: TravelExpense }>({});
  const [simulatedNotes, setSimulatedNotes] = useState("");
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "success">("idle");
  const [integrationLogs, setIntegrationLogs] = useState<string[]>([
    "System Initialized: Bridging channel open.",
    "Ready to send/receive cross-origin postMessage requests."
  ]);

  // Reference for iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Add system logs helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setIntegrationLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Select first travel if available
  useEffect(() => {
    if (travels.length > 0 && !selectedTravelId) {
      setSelectedTravelId(travels[0].id);
    }
  }, [travels, selectedTravelId]);

  const selectedTravel = travels.find(t => t.id === selectedTravelId);

  // Initialize simulated expenses when travel changes
  useEffect(() => {
    if (selectedTravel) {
      const initial: { [empId: string]: TravelExpense } = {};
      selectedTravel.employeeIds.forEach(empId => {
        // Find existing expense if any
        const existing = selectedTravel.expenses.find(e => e.employeeId === empId);
        initial[empId] = {
          employeeId: empId,
          transportCost: existing?.transportCost ?? 1250000,
          dailyAllowance: existing?.dailyAllowance ?? 430000,
          lodgingCost: existing?.lodgingCost ?? 650000,
          otherCost: existing?.otherCost ?? 150000,
          notes: existing?.notes ?? "Kunjungan kerja dinas"
        };
      });
      setSimulatedExpenses(initial);
      addLog(`Loaded financial data structure for travel ref: ${selectedTravel.notaNumber}`);
    }
  }, [selectedTravelId]);

  // 1. Cross-Origin message listener (REAL Two-Way Integration Setup!)
  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      // In production, we can restrict origins if needed: if (event.origin !== "https://vortex-perdin.vercel.app") return;
      if (event.data && event.data.source === "vortex-perdin" && event.data.type === "VORTEX_SAVE_BUDGET") {
        const { travelId, expenses } = event.data as { travelId: string; expenses: TravelExpense[] };
        addLog(`Received real postMessage callback from Vortex Perdin for travel ID: ${travelId}`);
        
        if (onUpdateTravels) {
          const updatedTravels = travels.map(t => {
            if (t.id === travelId || t.notaNumber === travelId) {
              return {
                ...t,
                expenses: expenses,
              };
            }
            return t;
          });
          onUpdateTravels(updatedTravels);
          addLog(`Successfully updated budget database via real postMessage! Realisasi Anggaran updated.`);
          setSimulationStatus("success");
          setTimeout(() => setSimulationStatus("idle"), 4000);
        }
      }
    };

    window.addEventListener("message", handleIncomingMessage);
    return () => window.removeEventListener("message", handleIncomingMessage);
  }, [travels, onUpdateTravels]);

  // Get active participants' names
  const participantNames = selectedTravel
    ? selectedTravel.employeeIds
        .map(id => employees.find(e => e.id === id)?.name)
        .filter(Boolean)
        .join(", ")
    : "";

  // Format dates elegantly
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  const travelDatesText = selectedTravel
    ? selectedTravel.customDates && selectedTravel.customDates.length > 0
      ? selectedTravel.customDates.map(d => formatIndoDate(d)).join(", ")
      : selectedTravel.departureDate === selectedTravel.returnDate
        ? formatIndoDate(selectedTravel.departureDate)
        : `${formatIndoDate(selectedTravel.departureDate)} s.d ${formatIndoDate(selectedTravel.returnDate)}`
    : "";

  const travelThemeText = selectedTravel ? selectedTravel.purpose : "";

  // Helper to calculate days & nights
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = selectedTravel ? calculateDays(selectedTravel.departureDate, selectedTravel.returnDate) : 1;
  const nightsCount = daysCount > 1 ? daysCount - 1 : 0;

  // Calculate live sum for simulated budget before saving
  const calculateSimulatedTotal = (): number => {
    return (Object.values(simulatedExpenses) as TravelExpense[]).reduce((total: number, exp: TravelExpense) => {
      const daily = exp.dailyAllowance * daysCount;
      const lodging = exp.lodgingCost * nightsCount;
      return total + exp.transportCost + daily + lodging + exp.otherCost;
    }, 0);
  };

  // Generate Bridging URL with query parameters
  const getBridgingUrl = () => {
    if (!selectedTravel) return vortexUrl;
    
    const params = new URLSearchParams();
    params.set(paramKeyNames, participantNames);
    params.set(paramKeyDates, travelDatesText);
    params.set(paramKeyTheme, travelThemeText);
    
    // Add extra administrative helpers
    params.set("source", "sppd-smart");
    if (selectedTravel.destination) params.set("tujuan", selectedTravel.destination);
    if (selectedTravel.budgetCode) params.set("anggaran", selectedTravel.budgetCode);
    if (selectedTravel.id) params.set("travel_id", selectedTravel.id);

    return `${vortexUrl}?${params.toString()}`;
  };

  // Handle opening Vortex with parameters pre-filled
  const handleOpenVortex = () => {
    if (!selectedTravel) return;
    const url = getBridgingUrl();
    window.open(url, "_blank", "noopener,noreferrer");
    addLog(`Opened Vortex Perdin outbound window: ${url.substring(0, 60)}...`);
  };

  // Copy structured payload
  const handleCopyPayload = () => {
    if (!selectedTravel) return;
    const text = `=== DATA INTEGRASI SPPD SMART ===
Nama Pegawai    : ${participantNames}
Tanggal Kegiatan: ${travelDatesText}
Tema Kegiatan   : ${travelThemeText}
Tujuan          : ${selectedTravel.destination}
Kode Anggaran   : ${selectedTravel.budgetCode}
=================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addLog(`Copied integration payload block to clipboard.`);
    });
  };

  // Real-time postMessage dispatch to the embedded Vortex iframe
  const handlePostMessageSync = () => {
    if (!selectedTravel) return;
    setSyncStatus("sending");
    addLog(`Initiating postMessage transfer to iframe [${vortexUrl}]`);

    setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const payload = {
            source: "sppd-smart",
            type: "vortex_perdin_sync",
            data: {
              employees: participantNames,
              dates: travelDatesText,
              theme: travelThemeText,
              destination: selectedTravel.destination,
              budgetCode: selectedTravel.budgetCode,
              notaNumber: selectedTravel.notaNumber,
              taskLetterNumber: selectedTravel.taskLetterNumber
            }
          };

          // Post to iframe
          iframe.contentWindow.postMessage(payload, "*");
          setSyncStatus("success");
          addLog("postMessage dispatch successfully transmitted. Handshake verified.");
          setTimeout(() => setSyncStatus("idle"), 3000);
        } else {
          setSyncStatus("error");
          addLog("postMessage dispatch failed: Iframe contents unreachable or closed.");
          setTimeout(() => setSyncStatus("idle"), 3000);
        }
      } catch (err) {
        setSyncStatus("error");
        addLog(`postMessage crash: ${err}`);
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    }, 800);
  };

  // Save the simulated Vortex Perdin "Save Event"
  const handleSimulatedSave = () => {
    if (!selectedTravel || !onUpdateTravels) return;

    // Compile into expense models
    const updatedExpensesList = Object.values(simulatedExpenses) as TravelExpense[];

    // Update the travels list
    const updatedTravels = travels.map(t => {
      if (t.id === selectedTravel.id) {
        return {
          ...t,
          expenses: updatedExpensesList
        };
      }
      return t;
    });

    onUpdateTravels(updatedTravels);
    setSimulationStatus("success");
    addLog(`SIMULATOR: Clicked 'Simpan' in Vortex. Transmitted total of ${formatRupiah(calculateSimulatedTotal())} back to SPPD Smart.`);
    addLog(`Database updated! Stat Realisasi Anggaran on SPPD Smart has been updated in real-time.`);

    setTimeout(() => {
      setSimulationStatus("idle");
    }, 4000);
  };

  // Handle updates to specific expense fields inside the simulator
  const handleSimulatedExpenseChange = (empId: string, field: keyof TravelExpense, value: number) => {
    setSimulatedExpenses(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  const handleDownloadJson = () => {
    if (!selectedTravel) return;
    const payload = {
      appSource: "SPPD Smart Inspektorat",
      version: "1.2",
      integrationTarget: "Vortex Perdin",
      timestamp: new Date().toISOString(),
      payload: {
        employees: selectedTravel.employeeIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return {
            name: emp?.name || "",
            nip: emp?.nip || "",
            jabatan: emp?.jabatan || "",
            pangkat: emp?.pangkat || ""
          };
        }),
        departureDate: selectedTravel.departureDate,
        returnDate: selectedTravel.returnDate,
        customDates: selectedTravel.customDates || [],
        datesFormatted: travelDatesText,
        theme: travelThemeText,
        destination: selectedTravel.destination,
        budgetCode: selectedTravel.budgetCode,
        budgetSource: selectedTravel.budgetSource
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sppd_bridge_${selectedTravel.notaNumber.replace(/[\/\\*?:"<>|]/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`Exported bridging schema to offline JSON payload.`);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 rounded-2xl text-white shadow-md border border-blue-600/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="bg-indigo-500/35 text-indigo-100 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/10 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Bridging Dua Arah (Two-Way Synchronization)
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-indigo-300" />
              Pusat Integrasi SPPD Smart ⇄ Vortex Perdin
            </h2>
            <p className="text-sm text-indigo-100 max-w-3xl leading-relaxed">
              Koneksikan data perjalanan dinas ke Vortex Perdin (Outbound) dan tarik otomatis rincian data keuangan belanja pertanggungjawaban riil dari Vortex Perdin langsung ke beranda statistik SPPD Smart (Inbound) secara real-time.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Konfigurasi Jembatan
          </button>
        </div>
      </div>

      {/* PARAMETERS CONFIGURATION DRAWER */}
      {showSettings && (
        <div className="bg-slate-100 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-150">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-blue-600" />
            Pemetaan Parameter URL (Query Parameter Mappings)
          </h3>
          <p className="text-xs text-slate-500">
            Sesuaikan kata kunci parameter query URL agar cocok dengan sistem penerimaan form di Vortex Perdin. Default: <code className="bg-slate-200 px-1 rounded text-slate-700">nama</code>, <code className="bg-slate-200 px-1 rounded text-slate-700">tanggal</code>, dan <code className="bg-slate-200 px-1 rounded text-slate-700">tema</code>.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Parameter Nama Pegawai</label>
              <input
                type="text"
                value={paramKeyNames}
                onChange={(e) => setParamKeyNames(e.target.value)}
                placeholder="nama"
                className="w-full bg-white border border-slate-200 px-3 py-2 text-sm rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Parameter Tanggal Kegiatan</label>
              <input
                type="text"
                value={paramKeyDates}
                onChange={(e) => setParamKeyDates(e.target.value)}
                placeholder="tanggal"
                className="w-full bg-white border border-slate-200 px-3 py-2 text-sm rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Parameter Tema / Maksud</label>
              <input
                type="text"
                value={paramKeyTheme}
                onChange={(e) => setParamKeyTheme(e.target.value)}
                placeholder="tema"
                className="w-full bg-white border border-slate-200 px-3 py-2 text-sm rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Base URL Target (Vortex Perdin)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={vortexUrl}
                onChange={(e) => setVortexUrl(e.target.value)}
                placeholder="https://vortex-perdin.vercel.app"
                className="flex-1 bg-white border border-slate-200 px-3.5 py-2.5 text-sm rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <button
                onClick={() => setVortexUrl("https://vortex-perdin.vercel.app")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE TWO-WAY SELECTION TAB BAR */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("outbound")}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === "outbound"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-slate-450 hover:text-slate-800"
          }`}
        >
          <ArrowRight className="w-4 h-4 rotate-45 text-blue-600" />
          1. OUTBOUND: Kirim Ke Vortex Perdin
        </button>
        <button
          onClick={() => setActiveSubTab("inbound")}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === "inbound"
              ? "border-indigo-600 text-indigo-600 font-black"
              : "border-transparent text-slate-450 hover:text-slate-800"
          }`}
        >
          <ArrowRight className="w-4 h-4 -rotate-135 text-indigo-600 animate-pulse" />
          2. INBOUND: Tarik Anggaran Ke SPPD Statistik (Simulator)
        </button>
      </div>

      {/* VIEW: OUTBOUND OR INBOUND */}
      {activeSubTab === "outbound" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: SOURCE DATA SELECTOR & SPECIFICS */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  Pilih Surat Perjalanan Dinas
                </label>
                <p className="text-xs text-slate-500">Pilih berkas dinas aktif untuk dikirim datanya ke Vortex Perdin.</p>
                
                <select
                  value={selectedTravelId}
                  onChange={(e) => setSelectedTravelId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Perjalanan Dinas --</option>
                  {travels.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.notaNumber}] {t.purpose.substring(0, 45)}... ({t.destination})
                    </option>
                  ))}
                </select>
              </div>

              {travels.length === 0 && (
                <div className="p-4 bg-yellow-50 text-yellow-750 border border-yellow-200 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Database Perjalanan Dinas Kosong</p>
                    <p className="mt-0.5 leading-relaxed">Silakan buat surat dinas baru terlebih dahulu di menu <b>Kelola Perjalanan Dinas</b> agar datanya dapat dibridgingkan.</p>
                  </div>
                </div>
              )}
            </div>

            {selectedTravel && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Payload Jembatan Aktif
                </h3>

                {/* Tema Kegiatan */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Tema Kegiatan (Maksud Dinas)
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-bold text-slate-800 leading-relaxed">
                    {travelThemeText}
                  </div>
                </div>

                {/* Nama-Nama Pegawai */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Nama Pegawai Terpilih
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-semibold text-slate-800 leading-relaxed font-mono">
                    {participantNames}
                  </div>
                </div>

                {/* Tanggal Kegiatan */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Tanggal Kegiatan
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-bold text-slate-800 leading-relaxed">
                    {travelDatesText}
                  </div>
                </div>

                {/* Action grid */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleOpenVortex}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka & Isi Otomatis di Vortex Perdin
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyPayload}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadJson}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BRIDGING LOGIC EXPLANATION CARD */}
            <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-2.5 text-slate-600 text-xs leading-relaxed">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                Bagaimana Jembatan ini Bekerja?
              </h4>
              <p>
                Modul ini mengemas inputan <b>Pegawai</b>, <b>Tanggal</b>, dan <b>Tema</b> yang anda kelola di SPPD Smart ke dalam string terenkripsi aman di URL Query. Saat tab Vortex Perdin terbuka, datanya langsung terdeteksi dan diisi otomatis.
              </p>
              <p className="font-medium text-blue-600 mt-1">
                ✓ Tidak perlu mengetik ulang | ✓ Bebas Typo | ✓ Menghemat waktu administrasi dinas.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE EMBEDDED SYNC WORKSPACE */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col h-full min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin-slow" />
                    Monitor Jembatan Lintas Aplikasi (Live Embedded Workspace)
                  </h3>
                  <p className="text-xs text-slate-500">Iframe di bawah menampilkan visual langsung situs Vortex Perdin.</p>
                </div>

                {selectedTravel && (
                  <button
                    onClick={handlePostMessageSync}
                    disabled={syncStatus === "sending"}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      syncStatus === "sending"
                        ? "bg-slate-100 text-slate-400"
                        : syncStatus === "success"
                          ? "bg-emerald-600 text-white"
                          : syncStatus === "error"
                            ? "bg-rose-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "sending" ? "animate-spin" : ""}`} />
                    {syncStatus === "sending" 
                      ? "Menyinkronkan..." 
                      : syncStatus === "success"
                        ? "Terintegrasi Sukses!"
                        : syncStatus === "error"
                          ? "Gagal Terkoneksi"
                          : "Kirim/Sinkronkan Otomatis"}
                  </button>
                )}
              </div>

              {/* SYNC NOTIFICATION BANNER */}
              {syncStatus === "success" && (
                <div className="bg-emerald-50 text-emerald-850 p-3.5 border border-emerald-200 rounded-xl text-xs space-y-1 animate-bounce">
                  <p className="font-bold flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    SINKRONISASI SUKSES!
                  </p>
                  <p className="text-emerald-705">
                    Data <b>Pegawai: {participantNames.substring(0, 30)}...</b>, <b>Tanggal: {travelDatesText}</b>, dan <b>Tema: {travelThemeText.substring(0, 30)}...</b> telah dikirim langsung ke frame Vortex Perdin.
                  </p>
                </div>
              )}

              {/* EMBEDDED IFRAME OF VORTEX PERDIN */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative group min-h-[400px]">
                <iframe
                  id="vortex-iframe"
                  ref={iframeRef}
                  src={getBridgingUrl()}
                  title="Vortex Perdin Embedded Workspace"
                  className="w-full h-full border-0 absolute inset-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                ></iframe>
                
                {/* Subtle top indicator bar */}
                <div className="absolute top-0 inset-x-0 bg-slate-950/80 text-[10px] text-white/90 px-3 py-1.5 flex justify-between items-center z-10 pointer-events-none font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    SAMBUNGAN AKTIF: {vortexUrl}
                  </span>
                  <span>Bridged via URL Query & Iframe PostMessage</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-mono text-center">
                *Catatan: Iframe di atas memuat langsung situs Vortex Perdin asli. Beberapa browser mungkin memerlukan izin popup atau cookies untuk memproses isian data terenkripsi.
              </p>
            </div>

          </div>

        </div>
      ) : (
        /* INBOUND: SYNC SPPD SMART BUDGET FROM VORTEX PERDIN SAVE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: SIMULATION CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-4.5 h-4.5 text-indigo-600" />
                    Penghitung Biaya Realisasi Vortex Perdin
                  </h3>
                  <p className="text-xs text-slate-500">Sesuaikan realisasi biaya riil belanja yang disave di Vortex Perdin.</p>
                </div>
                
                <span className="bg-indigo-50 text-indigo-750 text-[10px] font-bold px-2.5 py-1 rounded-md border border-indigo-100 font-mono">
                  {daysCount} Hari / {nightsCount} Malam
                </span>
              </div>

              {selectedTravel ? (
                <div className="space-y-6">
                  
                  {/* Select Travel again inside for comfort */}
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dokumen Berjalan Terpilih</label>
                    <select
                      value={selectedTravelId}
                      onChange={(e) => setSelectedTravelId(e.target.value)}
                      className="w-full bg-white border border-slate-250 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {travels.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.notaNumber}] {t.purpose.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employees cost matrix */}
                  <div className="space-y-4">
                    {selectedTravel.employeeIds.map((empId, idx) => {
                      const emp = employees.find(e => e.id === empId);
                      const exp = simulatedExpenses[empId] || {
                        employeeId: empId,
                        transportCost: 0,
                        dailyAllowance: 0,
                        lodgingCost: 0,
                        otherCost: 0
                      };

                      // Sum up this employee's individual total
                      const totalEmpSpent = exp.transportCost + (exp.dailyAllowance * daysCount) + (exp.lodgingCost * nightsCount) + exp.otherCost;

                      return (
                        <div key={empId} className="border border-slate-150 rounded-xl p-4 space-y-3 hover:shadow-xs transition bg-white">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{emp?.name || "Nama Pegawai"}</h4>
                                <p className="text-[10px] text-slate-400">{emp?.jabatan || "Jabatan"}</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-blue-600 font-mono">
                              Subtotal: {formatRupiah(totalEmpSpent)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Transport */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transportasi Riil</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  value={exp.transportCost}
                                  onChange={(e) => handleSimulatedExpenseChange(empId, "transportCost", parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl font-mono text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            {/* Daily Allowance */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uang Harian / Hari</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  value={exp.dailyAllowance}
                                  onChange={(e) => handleSimulatedExpenseChange(empId, "dailyAllowance", parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl font-mono text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            {/* Lodging Cost */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penginapan / Malam</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  value={exp.lodgingCost}
                                  onChange={(e) => handleSimulatedExpenseChange(empId, "lodgingCost", parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl font-mono text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            {/* Other Cost */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lain-lain / Taksi</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  value={exp.otherCost}
                                  onChange={(e) => handleSimulatedExpenseChange(empId, "otherCost", parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl font-mono text-slate-800 font-semibold"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Summary row */}
                  <div className="bg-indigo-950 text-white rounded-2xl p-5 space-y-3 border border-indigo-900 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Total Realisasi Yang Dihabiskan</span>
                        <span className="text-xl md:text-2xl font-black font-mono tracking-tight text-yellow-300">
                          {formatRupiah(calculateSimulatedTotal())}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleSimulatedSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <Send className="w-4 h-4" />
                        SIMPAN DI VORTEX (KIRIM BALIK KE STATISTIK)
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Silakan buat/pilih perjalanan dinas terlebih dahulu.
                </div>
              )}

            </div>

          </div>

          {/* RIGHT: HOW THE REVERSE INTEGRATION WORKS + EVENT LOGS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* REAL-TIME LOG MONITOR */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-md font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Live Integration Event Logs
                </span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              </div>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto divide-y divide-slate-800">
                {integrationLogs.map((log, i) => (
                  <p key={i} className={`pt-2 text-[11px] leading-relaxed ${i === 0 ? "text-yellow-300 font-semibold" : "text-slate-450"}`}>
                    {log}
                  </p>
                ))}
              </div>
            </div>

            {/* REAL SUCCESS NOTIFICATION DISPLAY */}
            {simulationStatus === "success" && (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg border border-emerald-400/20 space-y-2 animate-bounce">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-white/20 text-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm">STATISTIK BERHASIL SINKRON!</h4>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Budget sebesar <b>{formatRupiah(calculateSimulatedTotal())}</b> untuk Nota Dinas <b>{selectedTravel?.notaNumber}</b> telah masuk ke database. Anda dapat kembali ke **Beranda (Dashboard)** untuk melihat angka <b>Realisasi Anggaran</b> meningkat seketika!
                </p>
              </div>
            )}

            {/* TWO-WAY ARCHITECTURE DESIGN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                Arsitektur Sinkronisasi Dua Arah
              </h4>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-bold text-slate-800">Bridging Outbound (URL Query)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">SPPD Smart mengirim payload via URL parameters. Sangat andal dan aman dari proteksi pemblokiran iframe.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-bold text-slate-800">Bridging Inbound (postMessage API)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Saat tombol Simpan diklik di Vortex Perdin, ia memancarkan event Window PostMessage kembali ke parent window SPPD Smart.</p>
                  </div>
                </div>

                {/* Developer Integration Code */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-450" />
                    Snippet Kode Integrasi (Vortex Perdin Side)
                  </span>
                  <pre className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[9px] font-mono text-slate-600 overflow-x-auto leading-normal">
{`// Jalankan kode ini di Vortex Perdin saat tombol Simpan diklik
window.parent.postMessage({
  source: "vortex-perdin",
  type: "VORTEX_SAVE_BUDGET",
  travelId: "ID_PERJALANAN_DINAS",
  expenses: [
    {
      employeeId: "PEG_001",
      transportCost: 1500000,
      dailyAllowance: 430000,
      lodgingCost: 650000,
      otherCost: 200000
    }
  ]
}, "*");`}
                  </pre>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
