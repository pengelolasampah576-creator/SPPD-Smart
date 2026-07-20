import React, { useState, useEffect } from "react";
import { Employee, Travel } from "../types";
import { Printer, Settings, RefreshCw, AlertCircle, Save, Check, Plus, Trash2, Calendar } from "lucide-react";

interface DocumentHonorariumProps {
  travel: Travel;
  employees: Employee[];
}

interface ParticipantHonorState {
  employeeId: string;
  name: string;
  nip: string;
  jabatan: string;
  frequency: number;
  rate: number;
  isActive: boolean;
  monitoringDates: string;
}

// Indonesian Terbilang helper function
function getTerbilang(nominal: number): string {
  if (nominal === 0) return "Nol Rupiah";
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  function konversi(n: number): string {
    if (n < 12) {
      return words[n];
    } else if (n < 20) {
      return konversi(n - 10) + " Belas";
    } else if (n < 100) {
      return konversi(Math.floor(n / 10)) + " Puluh " + konversi(n % 10);
    } else if (n < 200) {
      return "Seratus " + konversi(n - 100);
    } else if (n < 1000) {
      return konversi(Math.floor(n / 100)) + " Ratus " + konversi(n % 100);
    } else if (n < 2000) {
      return "Seribu " + konversi(n - 1000);
    } else if (n < 1000000) {
      return konversi(Math.floor(n / 1000)) + " Ribu " + konversi(n % 1000);
    } else if (n < 1000000000) {
      return konversi(Math.floor(n / 1000000)) + " Juta " + konversi(n % 1000000);
    } else if (n < 1000000000000) {
      return konversi(Math.floor(n / 1000000000)) + " Milyar " + konversi(n % 1000000000);
    }
    return "";
  }
  
  const result = konversi(nominal).replace(/\s+/g, " ").trim();
  return result + " Rupiah";
}

export default function DocumentHonorarium({ travel, employees }: DocumentHonorariumProps) {
  // Helper to format Indonesian dates
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

  const getMonthAndYear = (dateStr: string) => {
    if (!dateStr) return "";
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${months[monthIdx]} ${parts[0]}`;
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // State settings
  const [showConfig, setShowConfig] = useState(false);
  
  // Header details
  const [subActivityText, setSubActivityText] = useState("");
  
  // Participant-specific states
  const [participants, setParticipants] = useState<ParticipantHonorState[]>([]);
  
  // Signature footer states
  const [locationDate, setLocationDate] = useState("");
  const [paName, setPaName] = useState("");
  const [paNip, setPaNip] = useState("");
  const [paTitle, setPaTitle] = useState("Pengguna Anggaran");
  
  const [pptkName, setPptkName] = useState("");
  const [pptkNip, setPptkNip] = useState("");
  const [pptkTitle, setPptkTitle] = useState("PPTK");
  
  // State for adding new employee to the honorarium table
  const [selectedNewEmpId, setSelectedNewEmpId] = useState("");

  const [openCalendarIdx, setOpenCalendarIdx] = useState<number | null>(null);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(6); // July

  const indomonths = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const generateCalendarGrid = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sunday, 1: Monday...
    
    const cells: { dayNum: number | null; isCurrentMonth: boolean }[] = [];
    
    // Empty padding for start of month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, isCurrentMonth: false });
    }
    
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ dayNum: d, isCurrentMonth: true });
    }
    
    return cells;
  };

  const isDateInTravelRange = (year: number, month: number, dayNum: number): boolean => {
    if (!travel.departureDate || !travel.returnDate) return false;
    const dateObj = new Date(year, month, dayNum);
    const startObj = new Date(travel.departureDate);
    dateObj.setHours(0,0,0,0);
    startObj.setHours(0,0,0,0);
    const endObj = new Date(travel.returnDate);
    endObj.setHours(0,0,0,0);
    return dateObj >= startObj && dateObj <= endObj;
  };

  const toggleDayNum = (idx: number, dayNum: number) => {
    const p = participants[idx];
    const currentDays = p.monitoringDates
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number);
      
    let newDays: number[];
    if (currentDays.includes(dayNum)) {
      newDays = currentDays.filter(d => d !== dayNum);
    } else {
      newDays = [...currentDays, dayNum];
    }
    newDays.sort((a, b) => a - b);
    
    const newStr = newDays.join(", ");
    const newFreq = newDays.length;
    
    const updated = [...participants];
    updated[idx] = {
      ...updated[idx],
      monitoringDates: newStr,
      frequency: newFreq
    };
    setParticipants(updated);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  // Helper to extract exact day numbers within the travel date range
  const getTravelDaysList = (): number[] => {
    if (!travel.departureDate || !travel.returnDate) return [];
    const startParts = travel.departureDate.split("-");
    const endParts = travel.returnDate.split("-");
    if (startParts.length !== 3 || endParts.length !== 3) return [];
    
    const startDay = parseInt(startParts[2], 10);
    const endDay = parseInt(endParts[2], 10);
    const startMonth = parseInt(startParts[1], 10);
    const endMonth = parseInt(endParts[1], 10);
    const startYear = parseInt(startParts[0], 10);
    
    // Simple case: same month
    if (startMonth === endMonth) {
      const days: number[] = [];
      for (let d = startDay; d <= endDay; d++) {
        days.push(d);
      }
      return days;
    } else {
      // Multi-month: get end of startMonth, and start of endMonth
      const days: number[] = [];
      const lastDayOfStartMonth = new Date(startYear, startMonth, 0).getDate();
      for (let d = startDay; d <= lastDayOfStartMonth; d++) {
        days.push(d);
      }
      for (let d = 1; d <= endDay; d++) {
        days.push(d);
      }
      return days;
    }
  };

  // Helper to toggle a day number in comma separated list
  const toggleDayInString = (currentString: string, dayNum: number) => {
    let parts = currentString.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number);
    if (parts.includes(dayNum)) {
      parts = parts.filter(p => p !== dayNum);
    } else {
      parts.push(dayNum);
    }
    parts.sort((a, b) => a - b);
    return parts.join(", ");
  };

  // Helper to format monitoring dates into polite Indonesian with "Tanggal" and month name
  const formatMonitoringDatesWithMonth = (datesStr: string): string => {
    if (!datesStr) return "";
    
    // If it already contains letters (e.g. month name or 'Tanggal'), return as-is to preserve manual text
    if (/[a-zA-Z]/.test(datesStr)) {
      return datesStr;
    }
    
    if (!travel.departureDate) return datesStr;
    
    const startParts = travel.departureDate.split("-"); // [YYYY, MM, DD]
    if (startParts.length !== 3) return datesStr;
    
    const startMonth = parseInt(startParts[1], 10) - 1; // 0-indexed
    const startYear = parseInt(startParts[0], 10);
    
    let endMonth = startMonth;
    let endYear = startYear;
    if (travel.returnDate) {
      const endParts = travel.returnDate.split("-");
      if (endParts.length === 3) {
        endMonth = parseInt(endParts[1], 10) - 1;
        endYear = parseInt(endParts[0], 10);
      }
    }
    
    // Parse datesStr into an array of numbers
    const days = datesStr
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => !isNaN(n));
      
    if (days.length === 0) return datesStr;
    
    if (startMonth === endMonth) {
      const monthName = indomonths[startMonth];
      return `Tanggal ${days.join(", ")} ${monthName} ${startYear}`;
    } else {
      const startDayVal = parseInt(startParts[2], 10);
      const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
      
      const startMonthDays: number[] = [];
      const endMonthDays: number[] = [];
      
      days.forEach(d => {
        if (d >= startDayVal && d <= lastDayOfStartMonth) {
          startMonthDays.push(d);
        } else {
          endMonthDays.push(d);
        }
      });
      
      const results: string[] = [];
      if (startMonthDays.length > 0) {
        results.push(`Tanggal ${startMonthDays.join(", ")} ${indomonths[startMonth]} ${startYear}`);
      }
      if (endMonthDays.length > 0) {
        results.push(`Tanggal ${endMonthDays.join(", ")} ${indomonths[endMonth]} ${endYear}`);
      }
      
      return results.join(" dan ");
    }
  };

  // Handler to add custom employee
  const handleAddEmployee = () => {
    if (!selectedNewEmpId) return;
    const emp = employees.find(e => e.id === selectedNewEmpId);
    if (!emp) return;
    
    // Check if already exists in table
    if (participants.some(p => p.employeeId === emp.id)) return;
    
    const defaultDuration = travel.customDates && travel.customDates.length > 0
      ? travel.customDates.length
      : calculateDays(travel.departureDate, travel.returnDate);
      
    const travelDays = getTravelDaysList();
    const defaultDates = travelDays.length > 0 ? travelDays.join(", ") : "1, 2, 4, 8";

    const newParticipant: ParticipantHonorState = {
      employeeId: emp.id,
      name: emp.name,
      nip: emp.nip,
      jabatan: emp.jabatan,
      frequency: defaultDuration,
      rate: 50000,
      isActive: true,
      monitoringDates: defaultDates,
    };
    
    setParticipants([...participants, newParticipant]);
    setSelectedNewEmpId("");
  };

  const [prevTravelId, setPrevTravelId] = useState<string | null>(null);

  // Load defaults based on selected travel
  useEffect(() => {
    if (travel.id !== prevTravelId) {
      setPrevTravelId(travel.id);
      
      // 1. Title / Sub-activity default
      const durationText = travel.customDates && travel.customDates.length > 0
        ? `${travel.customDates.length} HARI`
        : `${calculateDays(travel.departureDate, travel.returnDate)} HARI`;
        
      const formattedDepDate = formatIndoDate(travel.departureDate);
      const formattedRetDate = formatIndoDate(travel.returnDate);
      const dateRange = travel.departureDate === travel.returnDate
        ? formattedDepDate
        : `${formattedDepDate} s.d ${formattedRetDate}`;

      const defaultSubActivity = `HONORARIUM BELANJA PERJALANAN DINAS DALAM KOTA PADA SUB KEGIATAN ${travel.purpose.toUpperCase()} TANGGAL ${dateRange.toUpperCase()}`;
      setSubActivityText(defaultSubActivity);

      // 2. Location Date default
      const defaultDate = getMonthAndYear(travel.departureDate);
      setLocationDate(`Tanjung, ${defaultDate}`);

      // 3. PA details (default is DIYANTO / Inspektur)
      const inspektur = employees.find(e => e.jabatan.toLowerCase() === "inspektur");
      if (inspektur) {
        setPaName(inspektur.name);
        setPaNip(inspektur.nip);
      } else {
        setPaName("Diyanto, SE, MT, FMRP");
        setPaNip("197110132005011005");
      }
      setPaTitle("Pengguna Anggaran,");

      // 4. PPTK details (default to Rini Hayati or any Kasubbag / PPTK)
      const pptkEmp = employees.find(e => e.name.toLowerCase().includes("rini") || e.jabatan.toLowerCase().includes("pptk") || e.jabatan.toLowerCase().includes("perencanaan"));
      if (pptkEmp) {
        setPptkName(pptkEmp.name);
        setPptkNip(pptkEmp.nip);
      } else {
        setPptkName("Rini Hayati, S.Sos, MM");
        setPptkNip("197805032010012009");
      }
      setPptkTitle("PPTK,");

      // 5. Participants map
      const mappedParticipants = travel.employeeIds.map((empId, idx) => {
        const emp = employees.find(e => e.id === empId);
        const defaultDuration = travel.customDates && travel.customDates.length > 0
          ? travel.customDates.length
          : calculateDays(travel.departureDate, travel.returnDate);
        
        // Default some example dates so the user sees them in action immediately
        let defaultDates = "";
        if (idx === 0) {
          defaultDates = "1, 2, 4, 8";
        } else if (idx === 1) {
          defaultDates = "2, 3, 5";
        } else {
          defaultDates = "1, 2, 4, 8";
        }

        return {
          employeeId: empId,
          name: emp?.name || "Pegawai",
          nip: emp?.nip || "-",
          jabatan: emp?.jabatan || "Staff",
          frequency: defaultDuration,
          rate: 50000,
          isActive: true,
          monitoringDates: defaultDates,
        };
      });
      setParticipants(mappedParticipants);

      if (travel.departureDate) {
        const parts = travel.departureDate.split("-");
        if (parts.length === 3) {
          setCalendarYear(parseInt(parts[0], 10));
          setCalendarMonth(parseInt(parts[1], 10) - 1);
        }
      }
    }
  }, [travel, employees, prevTravelId]);

  // Handle participant change
  const handleParticipantChange = (index: number, field: keyof ParticipantHonorState, value: any) => {
    const updated = [...participants];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setParticipants(updated);
  };

  // Calculations
  const activeFrequenciesSum = participants.reduce((sum, p) => p.isActive ? sum + p.frequency : sum, 0);
  const activeRatesSum = participants.reduce((sum, p) => p.isActive ? sum + p.rate : sum, 0);
  const totalReceivedSum = participants.reduce((sum, p) => p.isActive ? sum + (p.frequency * p.rate) : sum, 0);

  // Formatting helpers
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const handlePrint = () => {
    const docContainer = document.getElementById("honorarium-printable");
    if (docContainer) {
      // Clone the element to avoid mutating live screen DOM
      const clone = docContainer.cloneNode(true) as HTMLElement;
      
      // Remove any print-hidden or print:hidden elements
      const hiddenElements = clone.querySelectorAll(".print-hidden, .print\\:hidden, [class*='print-hidden'], [class*='print:hidden']");
      hiddenElements.forEach(el => el.remove());

      const printContent = clone.innerHTML;
      const printWindow = window.open("", "", "height=900,width=1100");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Cetak Lampiran Tanda Terima Honorarium</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                body {
                  font-family: 'Arial', 'Inter', sans-serif;
                  background-color: #fff;
                  color: #000;
                  margin: 20px;
                  padding: 0;
                  font-size: 11.5px;
                  line-height: 1.4;
                }

                #honorarium-printable {
                  width: 100%;
                  max-width: 1000px;
                  margin: 0 auto;
                }

                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .uppercase { text-transform: uppercase; }
                .italic { font-style: italic; }
                .font-mono { font-family: 'Courier New', monospace; }
                .print\\:hidden { display: none !important; }
                .print-hidden { display: none !important; }
                
                .m-0 { margin: 0 !important; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-3 { margin-bottom: 12px; }
                .mb-4 { margin-bottom: 16px; }
                .mt-1 { margin-top: 4px; }
                .mt-2 { margin-top: 8px; }
                .mt-3 { margin-top: 12px; }
                .mt-4 { margin-top: 16px; }
                .mt-5 { margin-top: 20px; }
                
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .justify-between { justify-content: space-between; }
                .justify-end { justify-content: flex-end; }
                .items-center { align-items: center; }
                
                /* Landcape table borders */
                .table-main {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                  margin-bottom: 15px;
                }

                .table-main th, .table-main td {
                  border: 1px solid #000;
                  padding: 6px 8px;
                  font-size: 11.5px;
                  vertical-align: middle;
                }

                .table-main th {
                  font-weight: bold;
                  text-align: center;
                  background-color: #334155 !important;
                  color: #ffffff !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  height: 32px;
                  font-size: 12px;
                }

                .sub-col-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: none !important;
                }

                .sub-col-table td {
                  border: none !important;
                  padding: 0 !important;
                  text-align: center;
                }

                .signature-cell {
                  position: relative;
                  height: 48px;
                  min-width: 130px;
                  font-size: 11px;
                }

                .signature-cell .num {
                  position: absolute;
                  top: 4px;
                }

                .signature-cell .line {
                  position: absolute;
                  bottom: 6px;
                }

                .terbilang-box {
                  border: 1px solid #000;
                  padding: 8px 12px;
                  margin-top: 10px;
                  margin-bottom: 15px;
                  font-size: 11.5px;
                }

                .sign-block {
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  margin-top: 25px;
                }

                .sign-column {
                  width: 40%;
                  text-align: center;
                }

                .sign-space {
                  height: 75px;
                }

                @media print {
                  @page {
                    size: landscape;
                    margin: 1.2cm 1.5cm;
                  }
                  
                  body {
                    margin: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }

                  .table-main th {
                    background-color: #334155 !important;
                    color: #ffffff !important;
                  }
                  
                  /* Avoid page breaks inside table or sign block */
                  .table-main, .sign-block, .terbilang-box {
                    page-break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <div id="honorarium-printable">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 350);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 1. INTERACTION TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">Lampiran Tanda Terima Honorarium</h4>
            <p className="text-xs text-slate-500">Formulir rincian penerimaan terlampir honor belanja perjadin dalam kota.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`text-xs font-bold px-4 py-2 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
              showConfig 
                ? "bg-slate-200 border-slate-300 text-slate-800"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <Settings className="w-4 h-4" />
            {showConfig ? "Tutup Pengaturan" : "Isi Data Honorarium"}
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Lampiran (Landscape)
          </button>
        </div>
      </div>

      {/* 2. CONFIGURATION / INPUT FIELDS PANEL */}
      {showConfig && (
        <div className="bg-slate-50 border-b border-slate-200 p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold">Panduan Pengisian Lampiran:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Form ini memformat Lampiran Tanda Terima Honorarium Perjadin persis seperti gambar cetak SPD.</li>
                <li>Gunakan kolom di bawah ini untuk mengatur judul sub kegiatan, jumlah hari frekuensi, tarif per orang, serta nama pejabat.</li>
                <li>Format nominal rupiah akan otomatis disesuaikan. Kosongkan tarif (set ke 0) jika yang bersangkutan tidak menerima honorarium.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Header Description */}
            <div className="md:col-span-12">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Kegiatan & Sub Kegiatan</label>
              <textarea
                value={subActivityText}
                onChange={(e) => setSubActivityText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                placeholder="TANDA TERIMA HONORARIUM BELANJA PERJALANAN DINAS..."
              />
            </div>

            {/* Date and Place */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tempat & Tanggal Dokumen</label>
              <input
                type="text"
                value={locationDate}
                onChange={(e) => setLocationDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                placeholder="Tanjung, Juni 2026"
              />
            </div>

            {/* Pengguna Anggaran */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pengguna Anggaran (PA)</label>
              <input
                type="text"
                value={paName}
                onChange={(e) => setPaName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder="Nama Pengguna Anggaran"
              />
              <input
                type="text"
                value={paNip}
                onChange={(e) => setPaNip(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                placeholder="NIP Pengguna Anggaran"
              />
            </div>

            {/* PPTK */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pejabat PPTK</label>
              <input
                type="text"
                value={pptkName}
                onChange={(e) => setPptkName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder="Nama PPTK"
              />
              <input
                type="text"
                value={pptkNip}
                onChange={(e) => setPptkNip(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                placeholder="NIP PPTK"
              />
            </div>
          </div>

          {/* ADD EMPLOYEE SECTION */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Tambah Pegawai Penerima Honor</h6>
                <p className="text-[10px] text-slate-500">Pilih dari seluruh daftar pegawai untuk ditambahkan ke tabel honorarium.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <select
                value={selectedNewEmpId}
                onChange={(e) => setSelectedNewEmpId(e.target.value)}
                className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 min-w-[240px] shadow-xs"
              >
                <option value="">-- Pilih Pegawai --</option>
                {employees
                  .filter(emp => !participants.some(p => p.employeeId === emp.id))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jabatan})
                    </option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={handleAddEmployee}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambahkan
              </button>
            </div>
          </div>

          {/* Participant Frequencies & Tariff Editor */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Tabel Pengali Biaya & Tarif Peserta</h5>
              <button
                type="button"
                onClick={() => {
                  const mapped = participants.map(p => ({ ...p, rate: 50000, isActive: true }));
                  setParticipants(mapped);
                }}
                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Semua ke 50.000
              </button>
            </div>
            <div className="divide-y divide-slate-150 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama & Jabatan</th>
                    <th className="px-4 py-3 w-28 text-center">Frekuensi (Hari)</th>
                    <th className="px-4 py-3 w-40">Tarif Satuan (Rp)</th>
                    <th className="px-4 py-3 w-32 text-center">Jumlah Diterima</th>
                    <th className="px-4 py-3 w-36 text-center">Aksi & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {participants.map((p, idx) => (
                    <tr key={p.employeeId} className={p.isActive ? "bg-white" : "bg-slate-50 opacity-60"}>
                      <td className="px-4 py-3.5 text-center font-bold font-mono">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800 leading-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.jabatan} — NIP. {p.nip}</div>
                        <div className="mt-2 max-w-[280px]">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hari/Tanggal Pengawasan</label>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCalendarIdx(openCalendarIdx === idx ? null : idx);
                                if (openCalendarIdx !== idx && travel.departureDate) {
                                  const parts = travel.departureDate.split("-");
                                  if (parts.length === 3) {
                                    setCalendarYear(parseInt(parts[0], 10));
                                    setCalendarMonth(parseInt(parts[1], 10) - 1);
                                  }
                                }
                              }}
                              disabled={!p.isActive}
                              className="text-[9px] text-blue-600 hover:text-blue-700 disabled:opacity-50 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 px-2 py-0.5 rounded transition cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {openCalendarIdx === idx ? "Tutup Kalender" : "Pilih Kalender"}
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={p.monitoringDates}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Update frequency based on how many numbers are parsed
                              const nums = val.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
                              handleParticipantChange(idx, "monitoringDates", val);
                              handleParticipantChange(idx, "frequency", nums.length || 0);
                            }}
                            disabled={!p.isActive}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800 focus:ring-1 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
                            placeholder="Contoh: 1, 2, 4, 8"
                          />

                          {/* CALENDAR POPUP */}
                          {openCalendarIdx === idx && p.isActive && (
                            <div className="mt-2 p-3 bg-white border border-slate-250 rounded-xl shadow-md max-w-[280px] relative z-10">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  type="button"
                                  onClick={handlePrevMonth}
                                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-bold transition cursor-pointer"
                                >
                                  &larr;
                                </button>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {indomonths[calendarMonth]} {calendarYear}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleNextMonth}
                                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-bold transition cursor-pointer"
                                >
                                  &rarr;
                                </button>
                              </div>

                              {/* Weekdays header */}
                              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1">
                                <span className="text-red-500">Min</span>
                                <span>Sen</span>
                                <span>Sel</span>
                                <span>Rab</span>
                                <span>Kam</span>
                                <span>Jum</span>
                                <span>Sab</span>
                              </div>

                              {/* Calendar days grid */}
                              <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
                                {generateCalendarGrid(calendarYear, calendarMonth).map((cell, cIdx) => {
                                  if (cell.dayNum === null) {
                                    return <div key={`empty-${cIdx}`} className="h-6 w-6" />;
                                  }
                                  
                                  const day = cell.dayNum;
                                  const currentDays = p.monitoringDates.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number);
                                  const isSelected = currentDays.includes(day);
                                  const isOfficialTrip = isDateInTravelRange(calendarYear, calendarMonth, day);

                                  return (
                                    <button
                                      type="button"
                                      key={`day-${day}`}
                                      onClick={() => toggleDayNum(idx, day)}
                                      className={`text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                                        isSelected
                                          ? "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
                                          : isOfficialTrip
                                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                          : "text-slate-700 hover:bg-slate-100"
                                      }`}
                                      title={isOfficialTrip ? "Tanggal Perjalanan Dinas Resmi" : "Tanggal Luar Dinas"}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-semibold">
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 bg-blue-50 border border-blue-200 rounded-full inline-block"></span>
                                  <span>Tanggal Dinas</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
                                  <span>Terpilih</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Set to all days in the travel days list
                                    const travelDays = getTravelDaysList();
                                    handleParticipantChange(idx, "monitoringDates", travelDays.join(", "));
                                    handleParticipantChange(idx, "frequency", travelDays.length);
                                  }}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-extrabold py-1 rounded transition text-center cursor-pointer"
                                >
                                  Pilih Semua Hari Dinas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleParticipantChange(idx, "monitoringDates", "");
                                    handleParticipantChange(idx, "frequency", 0);
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-extrabold px-2 py-1 rounded transition text-center cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          value={p.frequency}
                          onChange={(e) => handleParticipantChange(idx, "frequency", parseInt(e.target.value, 10) || 0)}
                          disabled={!p.isActive}
                          className="w-16 bg-white border border-slate-250 text-center rounded-lg px-2 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={p.rate}
                            onChange={(e) => handleParticipantChange(idx, "rate", parseInt(e.target.value, 10) || 0)}
                            disabled={!p.isActive}
                            className="w-28 bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            placeholder="50000"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800 font-mono">
                        {p.isActive ? `Rp ${formatRupiah(p.frequency * p.rate)}` : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isActive}
                              onChange={(e) => handleParticipantChange(idx, "isActive", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{p.isActive ? "Aktif" : "Non"}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setParticipants(participants.filter((_, pIdx) => pIdx !== idx));
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Hapus Pegawai dari Daftar"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCUMENT DISPLAY CANVAS (STYLISH LIVE PREVIEW) */}
      <div className="p-8 bg-slate-100 overflow-x-auto select-text">
        <div 
          className="bg-white p-12 shadow-md rounded-lg max-w-[1000px] mx-auto text-black border border-slate-300 relative select-text"
          style={{ width: "980px" }}
        >
          {/* WATERMARK LABEL */}
          <span className="absolute top-4 right-4 bg-slate-100 border text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider print:hidden select-none flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" /> Pratinjau Layout Dokumen
          </span>

          <div id="honorarium-printable" className="font-sans leading-relaxed text-black">
            {/* DOCUMENT TITLE SECTION */}
            <div className="text-center mb-6">
              <h3 className="m-0 font-bold uppercase tracking-tight text-center text-[14px] leading-tight" style={{ fontSize: "14px", fontWeight: "bold" }}>
                TANDA TERIMA
              </h3>
              <p className="m-0 font-bold uppercase tracking-tight text-center text-[12.5px] mt-2 leading-tight" style={{ fontSize: "12.5px", fontWeight: "bold", textTransform: "uppercase" }}>
                {subActivityText}
              </p>
            </div>

            {/* MAIN DATA TABLE */}
            <table className="table-main" style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px", marginBottom: "15px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "4%" }}>NO</th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "32%" }}>NAMA</th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "25%" }}>JABATAN</th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "18%" }}>JUMLAH</th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "11%" }}>JUMLAH YANG DITERIMA</th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", backgroundColor: "#334155", color: "#fff", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px", textAlign: "center", width: "10%" }}>TANDA TANGAN</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => {
                  const isOdd = (idx + 1) % 2 !== 0;
                  const totalReceived = p.frequency * p.rate;
                  
                  return (
                    <tr key={p.employeeId}>
                      <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px", textAlign: "center", fontWeight: "bold" }}>
                        {idx + 1}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px" }}>
                        <div style={{ fontWeight: "bold" }}>{p.name}</div>
                        <div style={{ fontSize: "10.5px", marginTop: "2px" }}>NIP. {p.nip}</div>
                        {p.monitoringDates && (
                          <div style={{ fontSize: "9.5px", marginTop: "4px", color: "#374151", borderTop: "1px dashed #ccc", paddingTop: "2px" }}>
                            <span style={{ fontWeight: "normal", color: "#6b7280" }}>Hari Pengawasan: </span>
                            <span style={{ fontWeight: "600" }}>{formatMonitoringDatesWithMonth(p.monitoringDates)}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px" }}>
                        {p.jabatan}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px", fontSize: "11.5px" }}>
                        {p.isActive ? (
                          <table className="sub-col-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ width: "25%", textAlign: "center", border: "none" }}>{p.frequency}</td>
                                <td style={{ width: "15%", textAlign: "center", border: "none" }}>x</td>
                                <td style={{ width: "45%", textAlign: "right", paddingRight: "6px", border: "none" }}>{formatRupiah(p.rate)}</td>
                                <td style={{ width: "15%", textAlign: "center", border: "none" }}>=</td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <table className="sub-col-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ width: "25%", textAlign: "center", border: "none" }}>{p.frequency}</td>
                                <td style={{ width: "15%", textAlign: "center", border: "none" }}>x</td>
                                <td style={{ width: "45%", textAlign: "center", border: "none" }}>-</td>
                                <td style={{ width: "15%", textAlign: "center", border: "none" }}>=</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px", textAlign: "right", fontWeight: "bold" }}>
                        {p.isActive ? formatRupiah(totalReceived) : "-"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px", fontSize: "11.5px", verticalAlign: "top", position: "relative" }}>
                        <div className="signature-cell" style={{ position: "relative", minHeight: "44px" }}>
                          {isOdd ? (
                            <>
                              <span className="num" style={{ position: "absolute", left: "4px", top: "4px", fontSize: "10px" }}>{idx + 1}.</span>
                              <span className="line" style={{ position: "absolute", left: "20px", bottom: "4px", fontSize: "10px", color: "#666" }}>........................</span>
                            </>
                          ) : (
                            <>
                              <span className="num" style={{ position: "absolute", left: "55%", top: "4px", fontSize: "10px" }}>{idx + 1}.</span>
                              <span className="line" style={{ position: "absolute", left: "62%", bottom: "4px", fontSize: "10px", color: "#666" }}>........................</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* SUM FOOTER ROW */}
                <tr className="font-bold" style={{ fontWeight: "bold" }}>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "8px", fontSize: "11.5px", textAlign: "center", backgroundColor: "#f8fafc" }}>
                    Jumlah
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", fontSize: "11.5px", backgroundColor: "#f8fafc" }}>
                    <table className="sub-col-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "25%", textAlign: "center", border: "none", fontWeight: "bold" }}></td>
                          <td style={{ width: "15%", textAlign: "center", border: "none" }}></td>
                          <td style={{ width: "45%", textAlign: "right", paddingRight: "6px", border: "none", fontWeight: "bold" }}>
                            {formatRupiah(activeRatesSum)}
                          </td>
                          <td style={{ width: "15%", textAlign: "center", border: "none" }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px", textAlign: "right", fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                    {formatRupiah(totalReceivedSum)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "11.5px", backgroundColor: "#f8fafc" }}></td>
                </tr>
              </tbody>
            </table>

            {/* TERBILANG ALIGNMENT BLOCK */}
            <div className="terbilang-box" style={{ border: "1px solid #000", padding: "8px 12px", marginTop: "10px", marginBottom: "15px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ fontWeight: "bold", minWidth: "100px" }}>Terbilang :</div>
                <div style={{ fontStyle: "italic", fontWeight: "bold" }}>
                  {getTerbilang(totalReceivedSum)}
                </div>
              </div>
            </div>

            {/* LOWER SIGN-OFF BLOCKS */}
            <div className="sign-block" style={{ width: "100%", display: "flex", justifyContent: "space-between", marginTop: "25px" }}>
              {/* Left Signatory (PA) */}
              <div className="sign-column" style={{ width: "40%", textAlign: "center" }}>
                <div style={{ height: "18px" }}>&nbsp;</div>
                <div style={{ fontWeight: "bold" }}>Menyetujui,</div>
                <div style={{ fontWeight: "bold" }}>{paTitle}</div>
                
                <div className="sign-space" style={{ height: "65px" }}></div>
                
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{paName}</div>
                <div>NIP. {paNip}</div>
              </div>

              {/* Middle space filler */}
              <div style={{ width: "20%" }}></div>

              {/* Right Signatory (PPTK) */}
              <div className="sign-column" style={{ width: "40%", textAlign: "center" }}>
                <div style={{ fontWeight: "normal", fontStyle: "normal", marginBottom: "2px" }}>{locationDate}</div>
                <div style={{ fontWeight: "bold" }}>Mengetahui,</div>
                <div style={{ fontWeight: "bold" }}>{pptkTitle}</div>
                
                <div className="sign-space" style={{ height: "65px" }}></div>
                
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{pptkName}</div>
                <div>NIP. {pptkNip}</div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
