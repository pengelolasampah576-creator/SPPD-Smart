import React, { useState, useEffect } from "react";
import { Employee, Travel, TravelExpense } from "../types";
import { X, Plus, Search, Calendar, MapPin, BadgeDollarSign, User, Award, ArrowLeft, Fuel, ArrowRightLeft, AlertTriangle } from "lucide-react";

interface TravelFormProps {
  employees: Employee[];
  travels?: Travel[];
  onSubmit: (travel: Travel) => void;
  onCancel: () => void;
  initialTravel?: Travel | null;
}

export default function TravelForm({
  employees,
  travels = [],
  onSubmit,
  onCancel,
  initialTravel,
}: TravelFormProps) {
  // Document Refs
  const [notaNumber, setNotaNumber] = useState("");
  const [notaDate, setNotaDate] = useState("");
  const [taskLetterNumber, setTaskLetterNumber] = useState("");
  const [taskLetterDate, setTaskLetterDate] = useState("");
  const [spdNumberPrefix, setSpdNumberPrefix] = useState("");

  // Details
  const [purpose, setPurpose] = useState("");
  const [departurePlace, setDeparturePlace] = useState("Tabalong");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [transportMode, setTransportMode] = useState("Transportasi Darat");
  
  // Finance
  const [budgetSource, setBudgetSource] = useState("DPA-SKPD Inspektorat Daerah Kabupaten Tabalong Tahun Anggaran 2026");
  const [budgetCode, setBudgetCode] = useState("5.1.02.04.001.00001");

  // Signatories
  const [signatoryId, setSignatoryId] = useState("");
  const [ppkId, setPPKId] = useState("");

  // Participants
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Date modes state
  const [isNonConsecutive, setIsNonConsecutive] = useState(false);
  const [customDatesList, setCustomDatesList] = useState<string[]>([]);

  // Add a discrete date input
  const handleAddCustomDate = () => {
    setCustomDatesList([...customDatesList, ""]);
  };

  // Remove a discrete date input
  const handleRemoveCustomDate = (index: number) => {
    setCustomDatesList(customDatesList.filter((_, idx) => idx !== index));
  };

  // Update a discrete date input
  const handleUpdateCustomDate = (index: number, val: string) => {
    const updated = [...customDatesList];
    updated[index] = val;
    setCustomDatesList(updated);
  };

  // Detect date conflicts with other activities for selected participants
  const conflicts = React.useMemo(() => {
    if (!travels || travels.length === 0) return [];
    
    // Get current travel's dates
    let currentDates: string[] = [];
    if (isNonConsecutive) {
      currentDates = customDatesList.filter(Boolean);
    } else {
      if (departureDate && returnDate) {
        const start = new Date(departureDate);
        const end = new Date(returnDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const temp = new Date(start);
          while (temp <= end) {
            currentDates.push(temp.toISOString().split('T')[0]);
            temp.setDate(temp.getDate() + 1);
          }
        }
      }
    }

    if (currentDates.length === 0 || selectedEmployeeIds.length === 0) return [];

    const foundConflicts: {
      employeeId: string;
      employeeName: string;
      travelId: string;
      travelPurpose: string;
      overlappingDates: string[];
    }[] = [];

    const currentDatesSet = new Set(currentDates);

    // Loop through existing travels
    travels.forEach(t => {
      // If editing, skip self
      if (initialTravel && t.id === initialTravel.id) return;

      // Find overlapping dates
      let otherDates: string[] = [];
      if (t.customDates && t.customDates.length > 0) {
        otherDates = t.customDates;
      } else if (t.departureDate && t.returnDate) {
        const start = new Date(t.departureDate);
        const end = new Date(t.returnDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const temp = new Date(start);
          while (temp <= end) {
            otherDates.push(temp.toISOString().split('T')[0]);
            temp.setDate(temp.getDate() + 1);
          }
        }
      }

      const overlaps = otherDates.filter(d => currentDatesSet.has(d));
      if (overlaps.length > 0) {
        // There is date overlap! Now check if any selected employee is in this travel
        const overlappingEmployees = selectedEmployeeIds.filter(empId => t.employeeIds.includes(empId));
        overlappingEmployees.forEach(empId => {
          const empObj = employees.find(e => e.id === empId);
          foundConflicts.push({
            employeeId: empId,
            employeeName: empObj ? empObj.name : "Pegawai",
            travelId: t.id,
            travelPurpose: t.purpose,
            overlappingDates: overlaps.sort()
          });
        });
      }
    });

    return foundConflicts;
  }, [travels, isNonConsecutive, customDatesList, departureDate, returnDate, selectedEmployeeIds, initialTravel, employees]);

  const formatIndoDateCompact = (dateStr: string) => {
    if (!dateStr) return "-";
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0].slice(-2);
    return `${day} ${month} '${year}`;
  };

  // Initialize with values
  useEffect(() => {
    // Select default signatory: DIYANTO (Inspektur)
    const defaultSignatory = employees.find(e => e.jabatan.toLowerCase() === "inspektur")?.id || employees[0]?.id || "";
    // Select default PPK: HAIRUL FAHMI (Kasubbag Keuangan)
    const defaultPPK = employees.find(e => e.name.includes("HAIRUL FAHMI"))?.id || employees[4]?.id || "";

    if (initialTravel) {
      setNotaNumber(initialTravel.notaNumber);
      setNotaDate(initialTravel.notaDate);
      setTaskLetterNumber(initialTravel.taskLetterNumber);
      setTaskLetterDate(initialTravel.taskLetterDate);
      setSpdNumberPrefix(initialTravel.spdNumberPrefix);
      setPurpose(initialTravel.purpose);
      setDeparturePlace(initialTravel.departurePlace);
      setDestination(initialTravel.destination);
      setDepartureDate(initialTravel.departureDate);
      setReturnDate(initialTravel.returnDate);
      if (initialTravel.customDates && initialTravel.customDates.length > 0) {
        setIsNonConsecutive(true);
        setCustomDatesList(initialTravel.customDates);
      } else {
        setIsNonConsecutive(false);
        setCustomDatesList([]);
      }
      let mappedMode = "Transportasi Darat";
      if (initialTravel.transportMode) {
        const lowerMode = initialTravel.transportMode.toLowerCase();
        if (lowerMode.includes("udara") || lowerMode.includes("pesawat")) {
          mappedMode = "Transportasi Udara";
        } else if (lowerMode.includes("laut") || lowerMode.includes("feri") || lowerMode.includes("kapal")) {
          mappedMode = "Transportasi Laut";
        } else {
          mappedMode = "Transportasi Darat";
        }
      }
      setTransportMode(mappedMode);
      setBudgetSource(initialTravel.budgetSource);
      setBudgetCode(initialTravel.budgetCode);
      setSignatoryId(initialTravel.signatoryId);
      setPPKId(initialTravel.ppkId);
      setSelectedEmployeeIds(initialTravel.employeeIds);
    } else {
      // Pre-fill numbers with current year/formats
      const year = new Date().getFullYear();
      const rand1 = Math.floor(Math.random() * 80) + 10;
      const rand2 = Math.floor(Math.random() * 120) + 10;

      setNotaNumber(`090/${rand1}/ND-INSP/${year}`);
      setNotaDate(new Date().toISOString().split('T')[0]);
      setTaskLetterNumber(`094/${rand2}/ST-INSP/${year}`);
      setTaskLetterDate(new Date().toISOString().split('T')[0]);
      setSpdNumberPrefix(`090/${rand2}-SPD/INSP/${year}`);
      setPurpose("");
      setDeparturePlace("Tabalong");
      setDestination("");
      setDepartureDate("");
      setReturnDate("");
      setIsNonConsecutive(false);
      setCustomDatesList([]);
      setTransportMode("Pesawat Udara (Komersil)");
      setBudgetSource("DPA-SKPD Inspektorat Daerah Kabupaten Tabalong Tahun Anggaran 2026");
      setBudgetCode("5.1.02.04.001.00001");
      setSignatoryId(defaultSignatory);
      setPPKId(defaultPPK);
      setSelectedEmployeeIds([]);
    }
  }, [initialTravel, employees]);

  // Handle employee selection
  const handleSelectEmployee = (empId: string) => {
    if (!selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
    setEmployeeSearch("");
    setShowDropdown(false);
  };

  const handleRemoveEmployee = (empId: string) => {
    setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
  };

  const filteredEmployeesForDropdown = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          emp.jabatan.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                          emp.nip.includes(employeeSearch);
    
    const notAlreadySelected = !selectedEmployeeIds.includes(emp.id);
    return matchesSearch && notAlreadySelected;
  });

  // A clear, beautiful warning panel listing conflicts
  const renderConflictWarning = () => {
    if (conflicts.length === 0) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 animate-fadeIn my-4">
        <div className="flex items-start gap-2.5 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Peringatan: Jadwal Bentrok Terdeteksi!
            </h4>
            <p className="text-xs text-amber-700 font-medium">
              Ada pegawai terpilih yang sudah ditugaskan pada tanggal yang sama di kegiatan dinas lain. Mohon periksa kembali jadwal keberangkatan atau susunan peserta Anda:
            </p>
          </div>
        </div>

        <div className="divide-y divide-amber-150 border-t border-amber-200/50 pt-2 max-h-48 overflow-y-auto pr-1">
          {conflicts.map((conflict, i) => (
            <div key={`conflict-${i}`} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800">
              <div className="space-y-1">
                <span className="font-bold text-amber-950 block">{conflict.employeeName}</span>
                <span className="text-[10px] text-amber-600 font-bold inline-flex bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 rounded-md">
                  Tanggal bentrok: {conflict.overlappingDates.map(d => formatIndoDateCompact(d)).join(", ")}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 max-w-xs text-left sm:text-right">
                Bentrok kegiatan: <span className="font-semibold text-slate-700 line-clamp-1" title={conflict.travelPurpose}>{conflict.travelPurpose}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) {
      alert("Awas: Harap pilih minimal satu orang pegawai sebagai peserta perjalanan dinas.");
      return;
    }

    if (conflicts.length > 0) {
      const confirmSave = window.confirm(
        `Perhatian!\n\nAda ${conflicts.length} konflik jadwal perjalanan dinas terdeteksi untuk peserta terpilih.\nApakah Anda yakin ingin tetap menyimpan data perjalanan dinas ini?`
      );
      if (!confirmSave) return;
    }

    // Prepare default expenses for newly selected employees
    const expenses: TravelExpense[] = selectedEmployeeIds.map(empId => {
      // If editing, try to keep the old expense details, otherwise preset defaults
      const existingExpense = initialTravel?.expenses.find(ex => ex.employeeId === empId);
      if (existingExpense) return existingExpense;

      // Default allowance values based on standard pangkat/ranks
      const employee = employees.find(emp => emp.id === empId);
      const isAuditor = employee?.jabatan.toLowerCase().includes("auditor");
      const isEchelon = employee?.jabatan.toLowerCase().includes("inspektur") || 
                        employee?.jabatan.toLowerCase().includes("sekretaris") ||
                        employee?.jabatan.toLowerCase().includes("kepala");

      let daily = 430000; // Standar uang harian dalam daerah/luar daerah kalsel
      let lodging = 500000;
      let transport = 1200000;

      if (isEchelon) {
        daily = 530000;
        lodging = 850000;
        transport = 3850000; // Pesawat + akomodasi lebih tinggi
      } else if (isAuditor) {
        daily = 430000;
        lodging = 650000;
        transport = 3850000;
      } else if (employee?.jabatan.toLowerCase().includes("pramubakti")) {
        daily = 350000;
        lodging = 400000;
        transport = 500000;
      }

      return {
        employeeId: empId,
        transportCost: transport,
        dailyAllowance: daily,
        lodgingCost: lodging,
        otherCost: 150000,
        notes: "Uang representatif draf awal"
      };
    });

    let finalDepartureDate = departureDate;
    let finalReturnDate = returnDate;
    let finalCustomDates: string[] | undefined = undefined;

    if (isNonConsecutive) {
      const validDates = customDatesList.filter(Boolean);
      if (validDates.length === 0) {
        alert("Awas: Harap masukkan minimal satu tanggal untuk penugasan cabutan/tidak berurutan.");
        return;
      }
      // Sort chronologically
      const sorted = [...validDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      finalDepartureDate = sorted[0];
      finalReturnDate = sorted[sorted.length - 1];
      finalCustomDates = sorted;
    }

    const newTravel: Travel = {
      id: initialTravel ? initialTravel.id : `travel-${Date.now()}`,
      notaNumber,
      notaDate,
      taskLetterNumber,
      taskLetterDate,
      spdNumberPrefix,
      purpose,
      departurePlace,
      destination,
      departureDate: finalDepartureDate,
      returnDate: finalReturnDate,
      customDates: finalCustomDates,
      transportMode,
      budgetSource,
      budgetCode,
      signatoryId,
      ppkId,
      employeeIds: selectedEmployeeIds,
      expenses,
      createdAt: initialTravel ? initialTravel.createdAt : new Date().toISOString()
    };

    onSubmit(newTravel);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {initialTravel ? "Edit Perjalanan Dinas" : "Buat Perjalanan Dinas Baru"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Formulir ini otomatis menggenerasikan Nota Dinas, Surat Tugas, dan SPD secara simultan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ROW 1: Dokumen Administrasi / Nomor Surat */}
        <div className="bg-slate-50/75 p-5 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <Award className="w-4 h-4" />
            1. Registrasi Dokumen Dinas (Penomoran)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">NOMOR NOTA DINAS</label>
              <input
                type="text"
                required
                value={notaNumber}
                onChange={(e) => setNotaNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">NOMOR SURAT TUGAS</label>
              <input
                type="text"
                required
                value={taskLetterNumber}
                onChange={(e) => setTaskLetterNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PREFIX NOMOR SPD (INDIVIDU)</label>
              <input
                type="text"
                required
                placeholder="090/SPD/INSP/2026"
                value={spdNumberPrefix}
                onChange={(e) => setSpdNumberPrefix(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Misal: SPD individual akan digenerasi otomatis akhiran /01, /02, dll.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">TANGGAL NOTA DINAS</label>
              <input
                type="date"
                required
                value={notaDate}
                onChange={(e) => setNotaDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">TANGGAL SURAT TUGAS</label>
              <input
                type="date"
                required
                value={taskLetterDate}
                onChange={(e) => setTaskLetterDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ROW 2: Detail Kegiatan */}
        <div className="bg-slate-50/75 p-5 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            2. Maksud & Destinasi Perjalanan Dinas
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">MAKSUD PERJALANAN DINAS</label>
            <textarea
              required
              rows={3}
              placeholder="Sebutkan kegiatan kedinasan dengan jelas, formal, dan lengkap..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">TEMPAT BERANGKAT</label>
              <input
                type="text"
                required
                value={departurePlace}
                onChange={(e) => setDeparturePlace(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">TEMPAT TUJUAN</label>
              <input
                type="text"
                required
                placeholder="e.g. Jakarta Pusat, DKI Jakarta atau Cianjur, Jawa Barat"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* TANGGAL SELECTION PATTERN */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-150">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Pola Hari Perjalanan Dinas</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsNonConsecutive(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                  !isNonConsecutive
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                Rentang Berurutan (Standard)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNonConsecutive(true);
                  if (customDatesList.length === 0) {
                    setCustomDatesList([departureDate || new Date().toISOString().split('T')[0]]);
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                  isNonConsecutive
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                Tanggal Cabutan (Loncat-loncat)
              </button>
            </div>
          </div>

          {!isNonConsecutive ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">TANGGAL BERANGKAT</label>
                <input
                  type="date"
                  required={!isNonConsecutive}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">TANGGAL KEMBALI</label>
                <input
                  type="date"
                  required={!isNonConsecutive}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ALAT ANGKUTAN / TRANSPORTASI</label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="Transportasi Darat">Transportasi Darat</option>
                  <option value="Transportasi Udara">Transportasi Udara</option>
                  <option value="Transportasi Laut">Transportasi Laut</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-150 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-600">Daftar Hari Penugasan Cabutan ({customDatesList.length} hari):</span>
                <button
                  type="button"
                  onClick={handleAddCustomDate}
                  className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Tanggal Tugas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto p-1">
                {customDatesList.map((dt, idx) => (
                  <div key={`custom-dt-${idx}`} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}.</span>
                    <input
                      type="date"
                      required={isNonConsecutive}
                      value={dt}
                      onChange={(e) => handleUpdateCustomDate(idx, e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={customDatesList.length <= 1}
                      onClick={() => handleRemoveCustomDate(idx)}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1 hover:bg-red-50 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                <div className="md:col-start-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ALAT ANGKUTAN / TRANSPORTASI</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Transportasi Darat">Transportasi Darat</option>
                    <option value="Transportasi Udara">Transportasi Udara</option>
                    <option value="Transportasi Laut">Transportasi Laut</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RENDER CONFLICT WARNING IF ANY */}
        {renderConflictWarning()}

        {/* ROW 3: Anggaran & Struktur Kepemimpinan */}
        <div className="bg-slate-50/75 p-5 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4" />
            3. Anggaran Belanja & Pejabat Penandatangan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SUMBER ANGGARAN (PEMBAYAR)</label>
              <input
                type="text"
                required
                value={budgetSource}
                onChange={(e) => setBudgetSource(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">KODE REKENING / ANGGARAN</label>
              <input
                type="text"
                required
                value={budgetCode}
                onChange={(e) => setBudgetCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setBudgetCode("5.1.02.04.001.00001")}
                  className="text-[10px] px-2 py-1 rounded bg-slate-150 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
                >
                  Luar Daerah (5.1.02.04.001.00001)
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetCode("5.1.02.04.001.00003")}
                  className="text-[10px] px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition-colors"
                >
                  Dalam Kota (5.1.02.04.001.00003)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PEJABAT PEMBERI PERINTAH (TANDA TANGAN SURAT TUGAS)</label>
              <select
                required
                value={signatoryId}
                onChange={(e) => setSignatoryId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
              >
                <option value="">-- Pilih Pejabat Penandatangan --</option>
                {employees
                  .filter(e => e.jabatan.toLowerCase().includes("inspektur") || e.jabatan.toLowerCase().includes("sekretaris"))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jabatan})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PEJABAT PEMBUAT KOMITMEN (PPK - TANDA TANGAN SPD)</label>
              <select
                required
                value={ppkId}
                onChange={(e) => setPPKId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
              >
                <option value="">-- Pilih PPK --</option>
                {employees
                  .filter(e => e.jabatan.toLowerCase().includes("kepala subbag") || e.jabatan.toLowerCase().includes("sekretaris") || e.jabatan.toLowerCase().includes("pejabat"))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jabatan})
                    </option>
                ))}
                {/* Fallback to show all employees in case they are not in filter */}
                <option disabled>--------- SEMUA PEGAWAI ---------</option>
                {employees.map(emp => (
                  <option key={`ppk-all-${emp.id}`} value={emp.id}>
                    {emp.name} ({emp.jabatan})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ROW 4: Seleksi Peserta Tugas */}
        <div className="bg-slate-50/75 p-5 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <User className="w-4 h-4" />
            4. Peserta Perjalanan Dinas (Pilih dari Database Pegawai)
          </h3>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cari & Tambah Peserta</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama pegawai, NIP, atau jabatannya untuk menyaring..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              {employeeSearch && (
                <button
                  type="button"
                  onClick={() => setEmployeeSearch("")}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Float Dropdown for matches */}
            {showDropdown && employeeSearch && (
              <div className="absolute z-10 w-full bg-white mt-1 border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-50">
                {filteredEmployeesForDropdown.length > 0 ? (
                  filteredEmployeesForDropdown.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp.id)}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between text-sm transition cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.jabatan} | NIP: {emp.nip}</p>
                      </div>
                      <Plus className="w-4 h-4 text-blue-600" />
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-xs text-slate-400 text-center">Tidak ada pegawai yang cocok atau sudah terpilih semua.</p>
                )}
              </div>
            )}
          </div>

          {/* Render selected employees */}
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-bold text-slate-600">Daftar Peserta Perjalanan Dinas ({selectedEmployeeIds.length} orang terpilih):</h4>
            {selectedEmployeeIds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedEmployeeIds.map((empId, index) => {
                  const emp = employees.find(e => e.id === empId);
                  if (!emp) return null;
                  const employeeConflicts = conflicts.filter(c => c.employeeId === empId);
                  const hasConflict = employeeConflicts.length > 0;
                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border shadow-xs transition-all duration-200 ${
                        hasConflict
                          ? "bg-amber-50/30 border-amber-300 ring-1 ring-amber-200/30"
                          : "bg-white border-slate-150"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                          hasConflict
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-600 border-blue-100/60"
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{emp.jabatan}</p>
                          {hasConflict && (
                            <div className="text-[9px] text-amber-700 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Bentrok ({employeeConflicts.length} kegiatan)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className={`p-1 rounded-lg transition ${
                          hasConflict
                            ? "text-amber-500 hover:text-red-600 hover:bg-amber-100/50"
                            : "text-slate-450 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title="Hapus dari daftar tugas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <User className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada peserta yang dipilih. Silakan cari pegawai di atas.</p>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS SUMMARY */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-3 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
          >
            {initialTravel ? "Simpan Perubahan" : "Simpan Perjalanan & Buat Dokumen"}
          </button>
        </div>
      </form>
    </div>
  );
}
