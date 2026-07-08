import React, { useState, useEffect } from "react";
import { Employee, Travel } from "../types";
import { Printer, Settings, RefreshCw, FileText, Layers } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";
import { getFormattedPangkatGolongan } from "../utils/pangkat";

interface DocumentSPDProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentSPD({ travel, employees }: DocumentSPDProps) {
  const participants = travel.employeeIds
    .map(id => employees.find(e => e.id === id))
    .filter(Boolean) as Employee[];

  // Select active employee to generate individual SPD sheet
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(travel.employeeIds[0] || "");
  const activeEmployee = employees.find(e => e.id === activeEmployeeId) || participants[0];

  const activeIndex = travel.employeeIds.indexOf(activeEmployeeId);
  const serialNo = activeIndex !== -1 ? `${activeIndex + 1}`.padStart(2, '0') : "01";

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

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays;
  };

  const durationDays = travel.customDates && travel.customDates.length > 0
    ? travel.customDates.length
    : calculateDays(travel.departureDate, travel.returnDate);

  const durationDaysToWords = (num: number) => {
    const words = [
      "nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", 
      "delapan", "sembilan", "sepuluh", "sebelas", "dua belas", "tiga belas", 
      "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", 
      "sembilan belas", "dua puluh"
    ];
    if (num < words.length) return words[num];
    return num.toString();
  };

  // Determine Level of Cost ("Tingkat Biaya Perjalanan Dinas")
  const getTingkatBiaya = (destination: string) => {
    if (!destination) return "Perjalanan Dinas Luar Daerah Dalam Provinsi";
    const lowerDest = destination.toLowerCase();
    const outsideKeywords = ["jakarta", "jawa", "yogyakarta", "jogja", "surabaya", "bali", "bogor", "bandung", "sulawesi", "sumatera", "balikpapan", "samarinda", "kaltim", "kalteng", "kalbar", "luar provinsi", "kepri", "banten", "medan", "makassar", "ntb", "ntt", "papua"];
    const isOutside = outsideKeywords.some(keyword => lowerDest.includes(keyword));
    if (isOutside) {
      return "Perjalanan Dinas Luar Daerah Luar Provinsi";
    }
    return "Perjalanan Dinas Luar Daerah Dalam Provinsi";
  };

  // --- INTERACTIVE CONFIGURATION PANEL STATES ---
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "depan" | "belakang">("all");

  // Header State
  const [kopPemkab, setKopPemkab] = useState("PEMERINTAH KABUPATEN TABALONG");
  const [kopInstansi, setKopInstansi] = useState("INSPEKTORAT DAERAH");
  const [kopAlamat, setKopAlamat] = useState("Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513");
  const [kopLaman, setKopLaman] = useState("Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id");

  // Metadata block (Top Right Page 1)
  const [lembarKe, setLembarKe] = useState("");
  const [kodeNo, setKodeNo] = useState("");
  const [numSpd, setNumSpd] = useState("");

  // Table Page 1 Redaction overrides
  const [paName, setPaName] = useState("Diyanto, SE, MT, FRMP");
  const [paNip, setPaNip] = useState("197110132005011005");
  const [paPangkat, setPaPangkat] = useState("Pembina Utama Muda (IV/c)");
  const [pangkatTraveler, setPangkatTraveler] = useState("");
  const [jabatanTraveler, setJabatanTraveler] = useState("");
  const [tingkatBiaya, setTingkatBiaya] = useState("");
  const [maksudDinas, setMaksudDinas] = useState("");
  const [alatTransport, setAlatTransport] = useState("");
  const [tempatBerangkat, setTempatBerangkat] = useState("");
  const [tempatTujuan, setTempatTujuan] = useState("");
  const [lamanyaDinas, setLamanyaDinas] = useState("");
  const [tglBerangkat, setTglBerangkat] = useState("");
  const [tglKembali, setTglKembali] = useState("");

  // Budget Source details Table 1 Row 9
  const [akunInstansi, setAkunInstansi] = useState("Inspektorat Daerah Kabupaten Tabalong");
  const [akunKode, setAkunKode] = useState("");

  // Page 2 (Halaman Belakang) specific redactory overrides
  const [p2BerangkatDari, setP2BerangkatDari] = useState("Tanjung");
  const [p2Ke, setP2Ke] = useState("Banjarbaru");
  const [p2TglBerangkat, setP2TglBerangkat] = useState("");
  
  const [pptkName, setPptkName] = useState("Syahriadi, S.Sos., M.Si");
  const [pptkNip, setPptkNip] = useState("197812022005011008");

  const [p2Row1TibaDi, setP2Row1TibaDi] = useState("Banjarbaru");
  const [p2Row1TibaTgl, setP2Row1TibaTgl] = useState("");
  const [p2Row1BerangkatDari, setP2Row1BerangkatDari] = useState("Banjarbaru");
  const [p2Row1BerangkatKe, setP2Row1BerangkatKe] = useState("Tanjung");
  const [p2Row1BerangkatTgl, setP2Row1BerangkatTgl] = useState("");

  const [p2Row3TibaDi, setP2Row3TibaDi] = useState("Tanjung");
  const [p2Row3TibaTgl, setP2Row3TibaTgl] = useState("");

  const [p2Notes, setP2Notes] = useState("-");
  const [p2TopRightLabel, setP2TopRightLabel] = useState("selaku pelaksana teknis kegiatan");
  const [p2Row4LeftLabel, setP2Row4LeftLabel] = useState("selaku pelaksana teknis kegiatan");
  const [p2Row4RightLabel, setP2Row4RightLabel] = useState("Pengguna Anggaran");
  const [signSpecialCode, setSignSpecialCode] = useState("");
  const [showPaSuggestions, setShowPaSuggestions] = useState(false);
  const [showPptkSuggestions, setShowPptkSuggestions] = useState(false);
  const [signCodeCase, setSignCodeCase] = useState<"as-is" | "uppercase" | "lowercase">("as-is");
  const [signCodeSize, setSignCodeSize] = useState<"9px" | "11px" | "13px" | "15px">("11px");

  const matchingPaEmployees = paName.trim() === "" ? [] : employees.filter(emp => 
    emp.name.toLowerCase().includes(paName.toLowerCase()) || 
    emp.nip.toLowerCase().includes(paName.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(paName.toLowerCase())
  );

  const matchingPptkEmployees = pptkName.trim() === "" ? [] : employees.filter(emp => 
    emp.name.toLowerCase().includes(pptkName.toLowerCase()) || 
    emp.nip.toLowerCase().includes(pptkName.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(pptkName.toLowerCase())
  );

  // Keep state synchronized with travel select choices
  useEffect(() => {
    if (!activeEmployee) return;

    // Default metadata fields
    const cleanPrefix = travel.spdNumberPrefix.replace(/\/\d+$/, '');
    setNumSpd(`${cleanPrefix}/${serialNo}`);

    // Try to find the actual PA/PPK or default to Diyanto
    const matchedPpk = employees.find(e => e.id === travel.ppkId);
    if (matchedPpk) {
      setPaName(matchedPpk.name);
      setPaNip(matchedPpk.nip);
      setPaPangkat(getFormattedPangkatGolongan(matchedPpk.pangkat));
    } else {
      setPaName("Diyanto, SE, MT, FRMP");
      setPaNip("197110132005011005");
      setPaPangkat("Pembina Utama Muda (IV/c)");
    }

    // Traveler details
    setPangkatTraveler(getFormattedPangkatGolongan(activeEmployee.pangkat));
    setJabatanTraveler(activeEmployee.jabatan);
    setTingkatBiaya(getTingkatBiaya(travel.destination));

    // Travel particulars
    setMaksudDinas(travel.purpose);
    let mappedAlat = "Transportasi Darat";
    if (travel.transportMode) {
      const lowerMode = travel.transportMode.toLowerCase();
      if (lowerMode.includes("udara") || lowerMode.includes("pesawat")) {
        mappedAlat = "Transportasi Udara";
      } else if (lowerMode.includes("laut") || lowerMode.includes("feri") || lowerMode.includes("kapal")) {
        mappedAlat = "Transportasi Laut";
      } else {
        mappedAlat = "Transportasi Darat";
      }
    }
    setAlatTransport(mappedAlat);
    setTempatBerangkat(travel.departurePlace || "Tanjung");
    setTempatTujuan(travel.destination);
    setLamanyaDinas(`${durationDays} (${durationDaysToWords(durationDays)}) hari`);
    setTglBerangkat(formatIndoDate(travel.departureDate));
    setTglKembali(formatIndoDate(travel.returnDate));

    // Budget account matching Page 1 Row 9
    setAkunInstansi("Inspektorat Daerah Kabupaten Tabalong");
    setAkunKode(`${travel.budgetCode} Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD ${travel.budgetSource.replace("DPA-SKPD", "").replace("DPA", "").trim()}`);

    // Page 2 Default parameters
    setP2BerangkatDari(travel.departurePlace || "Tanjung");
    setP2Ke(travel.destination);
    setP2TglBerangkat(formatIndoDate(travel.departureDate));

    setP2Row1TibaDi(travel.destination);
    setP2Row1TibaTgl(formatIndoDate(travel.departureDate));
    setP2Row1BerangkatDari(travel.destination);
    setP2Row1BerangkatKe(travel.departurePlace || "Tanjung");
    setP2Row1BerangkatTgl(formatIndoDate(travel.returnDate));

    setP2Row3TibaDi(travel.departurePlace || "Tanjung");
    setP2Row3TibaTgl(formatIndoDate(travel.returnDate));

    // PPTK dynamic default search: try to find a sub-coordinator or active user or fallback
    const matchedPptk = employees.find(e => 
      e.jabatan.toLowerCase().includes("pelaksana") || 
      e.jabatan.toLowerCase().includes("perencanaan") || 
      e.id === travel.signatoryId
    );
    if (matchedPptk && matchedPptk.id !== activeEmployee.id) {
      setPptkName(matchedPptk.name);
      setPptkNip(matchedPptk.nip);
    } else {
      setPptkName("Syahriadi, S.Sos., M.Si");
      setPptkNip("197812022005011008");
    }

  }, [activeEmployeeId, travel.id, employees]);

  // Handle Preset trigger from screenshots
  const handleLoadCaptureDefaults = () => {
    setKopPemkab("PEMERINTAH KABUPATEN TABALONG");
    setKopInstansi("INSPEKTORAT DAERAH");
    setKopAlamat("Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513");
    setKopLaman("Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id");

    setLembarKe("");
    setKodeNo("");
    setNumSpd("090/084/ND-INSP/2026/01");

    setPaName("Diyanto, SE, MT, FRMP");
    setPaNip("197110132005011005");
    setPaPangkat("Pembina Utama Muda (IV/c)");

    setPangkatTraveler("Penata Muda Tk. I / III/b");
    setJabatanTraveler("PPUPD Ahli Pertama");
    setTingkatBiaya("Perjalanan Dinas Luar Daerah Luar Provinsi");

    setMaksudDinas("Penetapan dan Pemanggilan Peserta Ujikom Perjenjangan Jabatan Fungsional PPUPD Ahli Muda Angkatan II Tahun 2025");
    setAlatTransport("Transportasi Udara");
    setTempatBerangkat("Tanjung");
    setTempatTujuan("Makassar");
    setLamanyaDinas("4 (empat) hari");
    setTglBerangkat("30 Oktober 2025");
    setTglKembali("02 November 2025");

    setAkunInstansi("Inspektorat Daerah Kabupaten Tabalong");
    setAkunKode("5.1.02.04.001.00001 Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD Pendidikan dan Pelatihan Pegawai Berdasarkan Tugas dan Fungsi");

    setP2BerangkatDari("Tanjung");
    setP2Ke("Banjarbaru");
    setP2TglBerangkat("05 Maret 2026");

    setPptkName("Syahriadi, S.Sos., M.Si");
    setPptkNip("197812022005011008");

    setP2Row1TibaDi("Banjarbaru");
    setP2Row1TibaTgl("05 Maret 2026");
    setP2Row1BerangkatDari("Banjarbaru");
    setP2Row1BerangkatKe("Tanjung");
    setP2Row1BerangkatTgl("07 Maret 2026");

    setP2Row3TibaDi("Tanjung");
    setP2Row3TibaTgl("07 Maret 2026");

    setP2Notes("-");
    setP2TopRightLabel("selaku pelaksana teknis kegiatan");
    setP2Row4LeftLabel("selaku pelaksana teknis kegiatan");
    setP2Row4RightLabel("Pengguna Anggaran");
    setSignSpecialCode("");
    setSignCodeCase("as-is");
    setSignCodeSize("11px");
  };

  const handlePrint = () => {
    const printContent = document.getElementById("spd-printable")?.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "", "height=950,width=850");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SPD - ${numSpd.replace(/\//g, '_')}</title>
              <style>
                *, *:before, *:after {
                  box-sizing: border-box !important;
                }
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.4;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  padding: 2.5cm 1.5cm;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-justify { text-align: justify; }
                .font-bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                
                /* Layout Utility classes to replace Tailwind since it is not loaded in print window */
                .flex { display: flex !important; }
                .flex-col { flex-direction: column !important; }
                .justify-end { justify-content: flex-end !important; }
                .justify-between { justify-content: space-between !important; }
                .items-center { align-items: center !important; }
                .shrink-0 { flex-shrink: 0 !important; }
                .italic { font-style: italic !important; }
                .mb-1 { margin-bottom: 4px !important; }
                .mb-2 { margin-bottom: 8px !important; }
                .mt-1 { margin-top: 4px !important; }
                .mt-2 { margin-top: 8px !important; }
                .mt-3 { margin-top: 12px !important; }
                .mt-4 { margin-top: 16px !important; }
                .mt-5 { margin-top: 20px !important; }
                .w-1\/2 { width: 50% !important; }
                .w-full { width: 100% !important; }
                .w-24 { width: 96px !important; }
                .w-4 { width: 16px !important; }
                .w-5 { width: 20px !important; }
                .w-8 { width: 32px !important; }
                .w-20 { width: 80px !important; }
                .w-56 { width: 224px !important; }
                .w-72 { width: 288px !important; }
                .pl-16 { padding-left: 64px !important; }
                .pr-4 { padding-right: 16px !important; }
                .px-16 { padding-left: 64px !important; padding-right: 64px !important; }
                .px-20 { padding-left: 80px !important; padding-right: 80px !important; }
                .pl-28 { padding-left: 112px !important; }
                
                /* Letterhead Kop */
                .kop-header {
                  position: relative;
                  border-bottom: 4px double #000;
                  padding-bottom: 8px;
                  margin-bottom: 12px;
                  text-align: center;
                  min-height: 80px;
                  display: block;
                }
                .kop-logo-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  bottom: 0;
                  display: flex;
                  align-items: center;
                }
                .kop-logo {
                  height: 80px;
                  width: 70px;
                  object-fit: contain;
                }
                .kop-text-container {
                  padding-left: 80px;
                  padding-right: 80px;
                  width: 100%;
                  box-sizing: border-box;
                  text-align: center;
                }
                .kop-pemkab {
                  font-size: 16px;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                  margin: 0;
                  line-height: 1.2;
                }
                .kop-instansi {
                  font-size: 21px;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                  margin: 0;
                  margin-top: 2px;
                  line-height: 1.2;
                }
                .kop-alamat {
                  font-size: 11px;
                  margin: 0;
                  margin-top: 3.5px;
                  line-height: 1.3;
                }
                .kop-laman {
                  font-size: 11px;
                  margin: 0;
                  margin-top: 1px;
                  line-height: 1.3;
                }

                /* Top Right Meta Table */
                .top-meta-container {
                  float: right;
                  width: 310px;
                  margin-top: 2px;
                  margin-bottom: 4px;
                  font-size: 12.5px;
                }
                .top-meta-container table {
                  width: 100%;
                  border-collapse: collapse;
                }
                .top-meta-container td {
                  padding: 1px 2px;
                  vertical-align: top;
                }

                /* Document Title */
                .doc-title-box {
                  text-align: center;
                  margin-top: 10px;
                  margin-bottom: 8px;
                  clear: both;
                }
                .doc-title {
                  font-size: 15px;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                  text-decoration: none;
                  margin: 0;
                }

                /* SPD Grid Table */
                .spd-main-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  font-size: 13px;
                  margin-bottom: 12px;
                }
                .spd-main-table td {
                  border: 1px solid #000;
                  padding: 4px 6px !important;
                  vertical-align: top;
                  font-size: 13px !important;
                }
                .spd-main-table .center-align {
                  text-align: center;
                }

                /* Custom nested styles for multi-point cells */
                .sub-nested-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 0;
                }
                .sub-nested-table td {
                  border: none !important;
                  padding: 1.5px 0 !important;
                }

                /* Inner standard Pengikut sub-table */
                .pengikut-inner-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 2px;
                }
                .pengikut-inner-table td {
                  border-bottom: 1px solid #ddd;
                  padding: 3px 4px;
                }
                .pengikut-header-row td {
                  font-weight: bold;
                  border-bottom: 1px solid #000;
                  background-color: #fcfcfc;
                }

                /* Layout Page Breaks */
                .page-container {
                  width: 100%;
                  box-sizing: border-box;
                }
                .page-break {
                  page-break-after: always;
                  break-after: page;
                  margin-top: 60px;
                }

                /* Back Page Table Layout */
                .back-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  font-size: 13.5px;
                  margin-bottom: 12px;
                }
                .back-table td {
                  border: 1px solid #000;
                  padding: 5px 8px !important;
                  vertical-align: top;
                  font-size: 13.5px !important;
                }
                .back-table td:not([colspan]) {
                  width: 50%;
                }
                .back-half-col {
                  width: 50%;
                }
                .signature-box-mini {
                  height: 75px;
                }

                /* Traditional bottom signatories */
                .footer-sig-block {
                  margin-top: 12px;
                  float: right;
                  width: 270px;
                  font-size: 14px;
                  text-align: left;
                }
                .sig-box {
                  min-height: 90px;
                  height: auto;
                  margin-bottom: 10px;
                }

                @media print {
                  body { padding: 0; margin: 0; }
                  @page { size: A4 portrait; margin: 1.2cm; }
                  .page-break { margin-top: 0; }
                }
              </style>
            </head>
            <body id="spd-printable">
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 400);
      }
    }
  };

  // Generate Pengikut list automatically or populate empty items to match the layout
  const otherParticipants = participants.filter(p => p.id !== activeEmployeeId);
  const minRows = [0, 1]; // standard 2 rows empty or populated

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-5">
      
      {/* ACTION HEADER & CONTROLS BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-xs text-slate-600 font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Format Surat Perjalanan Dinas (SPD) Resmi - Double-Sided Pages</span>
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* TAB VISUAL SELECTORS */}
          <div className="bg-white border p-1 rounded-lg flex items-center text-[11px] font-bold text-slate-600 gap-1 mr-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${activeTab === "all" ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
            >
              Cetak Semua
            </button>
            <button
              onClick={() => setActiveTab("depan")}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${activeTab === "depan" ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
            >
              Halaman 1 (Depan)
            </button>
            <button
              onClick={() => setActiveTab("belakang")}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${activeTab === "belakang" ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
            >
              Halaman 2 (Belakang)
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg border transition duration-150 cursor-pointer ${
              showConfig 
                ? "bg-slate-200 border-slate-300 text-slate-800" 
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            {showConfig ? "Sembunyikan Pengaturan" : "Sesuaikan Metadata"}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Dokumen SPD
          </button>
        </div>
      </div>

      {/* EXPANDABLE COLLAPSIBLE CONTROL PANEL (NON-PRINTING SCREEN-ONLY) */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-fadeIn transition-all duration-300">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-500" />
              Sesuaikan Lembar SPD (Front & Back Metadata)
            </h4>
            <button
              onClick={handleLoadCaptureDefaults}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-[10px] font-bold text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded"
              title="Mengubah seluruh kolom ttd & data persis seperti lampiran contoh."
            >
              <RefreshCw className="w-3 h-3 text-emerald-500" />
              Set Sesuai Gambar Contoh
            </button>
          </div>

          {/* CHOOSE SYSTEM TRAVELER SYNC DIRECTORY */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-150 space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-slate-500 block">Sinkronisasi Data Peserta Aktif:</label>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {participants.map((p) => (
                <button
                  key={`conf-traveler-${p.id}`}
                  onClick={() => setActiveEmployeeId(p.id)}
                  className={`px-2.5 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                    activeEmployeeId === p.id 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : "bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Page 1 Overhead & Headers */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-emerald-600 border-b pb-1">1. Kop & Metadata Atas</p>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">LEMBAR KE</label>
                  <input type="text" value={lembarKe} onChange={(e) => setLembarKe(e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">KODE NO.</label>
                  <input type="text" value={kodeNo} onChange={(e) => setKodeNo(e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">NOMOR SURAT</label>
                  <input type="text" value={numSpd} onChange={(e) => setNumSpd(e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded font-semibold" />
                </div>
                <div className="border-t pt-2 space-y-1">
                  {/* Quick Select PA */}
                  <div className="bg-emerald-50/40 p-1.5 rounded border border-emerald-100/60 mb-1.5">
                    <label className="text-[8px] text-emerald-800 font-black block mb-0.5 uppercase tracking-wide">Cari PA dari Basis Data</label>
                    <select
                      onChange={(e) => {
                        const emp = employees.find(x => x.id === e.target.value);
                        if (emp) {
                          setPaName(emp.name);
                          setPaNip(emp.nip);
                          setPaPangkat(getFormattedPangkatGolongan(emp.pangkat));
                        }
                      }}
                      value=""
                      className="w-full text-[10px] p-0.5 border border-emerald-200 rounded bg-white text-emerald-950 font-semibold"
                    >
                      <option value="">-- Pilih PA --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({getFormattedPangkatGolongan(emp.pangkat)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="text-[9px] text-slate-400 font-bold block">PENGGUNA ANGGARAN (PA) LINE 1</label>
                    <input
                      type="text"
                      value={paName}
                      onChange={(e) => {
                        setPaName(e.target.value);
                        setShowPaSuggestions(true);
                      }}
                      onFocus={() => setShowPaSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowPaSuggestions(false), 200);
                      }}
                      className="w-full text-xs p-1 bg-slate-50 border rounded font-bold"
                      placeholder="Ketik untuk pencarian otomatis..."
                    />
                    {showPaSuggestions && matchingPaEmployees.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 text-left">
                        {matchingPaEmployees.map((emp) => (
                          <div
                            key={`pa-sugg-${emp.id}`}
                            onMouseDown={() => {
                              setPaName(emp.name);
                              setPaNip(emp.nip);
                              setPaPangkat(getFormattedPangkatGolongan(emp.pangkat));
                              setShowPaSuggestions(false);
                            }}
                            className="p-1.5 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-[10px]"
                          >
                            <p className="m-0 font-bold text-slate-800">{emp.name}</p>
                            <p className="m-0 text-[8.5px] text-slate-500 font-mono leading-tight">{emp.jabatan} | {emp.nip}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <label className="text-[9px] text-slate-400 font-bold block">NIP PA</label>
                  <input type="text" value={paNip} onChange={(e) => setPaNip(e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                  <label className="text-[9px] text-emerald-600 font-bold block">KODE KHUSUS TANDA TANGAN (DI ANTARA JABATAN & NAMA)</label>
                  <textarea
                    rows={4}
                    value={signSpecialCode}
                    onChange={(e) => setSignSpecialCode(e.target.value)}
                    placeholder="Contoh:
  - Kode 1
    Sub-kode 2

(Gunakan Enter untuk baris baru, Spasi atau Backspace untuk mengatur letak posisi)"
                    className="w-full text-xs p-1.5 bg-emerald-50/30 border border-emerald-200 rounded font-mono text-emerald-950 placeholder:text-emerald-700/50"
                  />
                  
                  <div className="grid grid-cols-2 gap-1.5 mt-1 bg-emerald-50/20 p-1.5 rounded border border-emerald-100/60">
                    <div>
                      <label className="text-[8px] text-emerald-700 font-bold block mb-0.5">BESAR/KECIL HURUF (CASING)</label>
                      <select
                        value={signCodeCase}
                        onChange={(e) => setSignCodeCase(e.target.value as any)}
                        className="w-full text-[10px] p-1 border border-emerald-250 rounded bg-white text-emerald-900 font-medium"
                      >
                        <option value="as-is">Sesuai Ketikan</option>
                        <option value="uppercase">HURUF BESAR (UPPER)</option>
                        <option value="lowercase">huruf kecil (lower)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-emerald-700 font-bold block mb-0.5">UKURAN HURUF (SIZE)</label>
                      <select
                        value={signCodeSize}
                        onChange={(e) => setSignCodeSize(e.target.value as any)}
                        className="w-full text-[10px] p-1 border border-emerald-250 rounded bg-white text-emerald-900 font-medium"
                      >
                        <option value="9px">Kecil sekali (9px)</option>
                        <option value="11px">Sesuai Standard (11px)</option>
                        <option value="13px">Besar (13px)</option>
                        <option value="15px">Sangat Besar (15px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Traveler details Customizations */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-emerald-600 border-b pb-1">2. Butir Perjalanan Dinas (Depan)</p>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">BUTIR 3A. PANGKAT & GOLONGAN</label>
                  <input type="text" value={pangkatTraveler} onChange={(e) => setPangkatTraveler(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">BUTIR 3B. JABATAN / INSTANSI</label>
                  <input type="text" value={jabatanTraveler} onChange={(e) => setJabatanTraveler(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">BUTIR 3C. TINGKAT PERJALANAN DINAS</label>
                  <select value={tingkatBiaya} onChange={(e) => setTingkatBiaya(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded cursor-pointer">
                    <option value="Perjalanan Dinas Luar Daerah Dalam Provinsi">Perjalanan Dinas Luar Daerah Dalam Provinsi</option>
                    <option value="Perjalanan Dinas Luar Daerah Luar Provinsi">Perjalanan Dinas Luar Daerah Luar Provinsi</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block">BUTIR 4. MAKSUD PERJALANAN DINAS</label>
                  <textarea rows={2} value={maksudDinas} onChange={(e) => setMaksudDinas(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                </div>
              </div>
            </div>

            {/* Column 3: Routes & Budgeting details */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-emerald-600 border-b pb-1">3. Rute & Pembebanan Anggaran</p>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block">B.5 TRANS.</label>
                    <select value={alatTransport} onChange={(e) => setAlatTransport(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded cursor-pointer">
                      <option value="Transportasi Darat">Transportasi Darat</option>
                      <option value="Transportasi Udara">Transportasi Udara</option>
                      <option value="Transportasi Laut">Transportasi Laut</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block">B.7A LAMANYA</label>
                    <input type="text" value={lamanyaDinas} onChange={(e) => setLamanyaDinas(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block">B.6A BERANGKAT</label>
                    <input type="text" value={tempatBerangkat} onChange={(e) => setTempatBerangkat(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block">B.6B TUJUAN</label>
                    <input type="text" value={tempatTujuan} onChange={(e) => setTempatTujuan(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                  </div>
                </div>
                <div className="border-t pt-2 space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">BUTIR 9A. INSTANSI (PEMBEBANAN ANGGARAN)</label>
                    <input type="text" value={akunInstansi} onChange={(e) => setAkunInstansi(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">BUTIR 9B. AKUN (PEMBEBANAN ANGGARAN)</label>
                    <textarea rows={2} value={akunKode} onChange={(e) => setAkunKode(e.target.value)} className="w-full text-[11px] p-1 bg-slate-50 border rounded" />
                    <div className="flex flex-wrap gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setAkunKode("5.1.02.04.001.00001 Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD Pendidikan dan Pelatihan Pegawai Berdasarkan Tugas dan Fungsi")}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium border border-slate-200"
                      >
                        Set Luar Daerah (5.1.02.04.001.00001)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAkunKode("5.1.02.04.001.00003 Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD Belanja Perjalanan Dinas Dalam Kota")}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200"
                      >
                        Set Dalam Kota (5.1.02.04.001.00003)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel Config: Specific to Page 2 (Halaman Belakang) */}
          <div className="bg-white p-4 rounded-lg border border-slate-150 space-y-3">
            <p className="text-[10px] font-bold uppercase text-emerald-700 border-b pb-1.5">4. Data Halaman Belakang (Halaman Kedua untuk Catatan Transit)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="space-y-2 bg-stone-50/50 p-2.5 rounded border">
                <span className="text-[10px] font-bold text-slate-500 block">A. POS AWAL KEDUDUKAN (Atas Kanan)</span>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">BERANGKAT DARI</label>
                  <input type="text" value={p2BerangkatDari} onChange={(e) => setP2BerangkatDari(e.target.value)} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">TUJUAN KE</label>
                  <input type="text" value={p2Ke} onChange={(e) => setP2Ke(e.target.value)} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">PADA TANGGAL</label>
                  <input type="text" value={p2TglBerangkat} onChange={(e) => setP2TglBerangkat(e.target.value)} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
              </div>

              <div className="space-y-2 bg-stone-50/50 p-2.5 rounded border">
                <span className="text-[10px] font-bold text-slate-500 block">B. PENANDATANGAN HALAMAN 2</span>
                
                {/* Quick Select PPTK */}
                <div className="bg-emerald-50/40 p-1 rounded border border-emerald-100/60 mb-1">
                  <label className="text-[8px] text-emerald-800 font-black block mb-0.5 uppercase tracking-wide">Cari PPTK dari Basis Data</label>
                  <select
                    onChange={(e) => {
                      const emp = employees.find(x => x.id === e.target.value);
                      if (emp) {
                        setPptkName(emp.name);
                        setPptkNip(emp.nip);
                      }
                    }}
                    value=""
                    className="w-full text-[9px] p-0.5 border border-emerald-250 rounded bg-white text-emerald-900 font-medium"
                  >
                    <option value="">-- Pilih PPTK --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[8px] text-slate-400 font-bold block">NAMA LENGKAP PPTK</label>
                  <input
                    type="text"
                    value={pptkName}
                    onChange={(e) => {
                      setPptkName(e.target.value);
                      setShowPptkSuggestions(true);
                    }}
                    onFocus={() => setShowPptkSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowPptkSuggestions(false), 200);
                    }}
                    className="w-full text-[11px] p-1 border rounded bg-white font-medium"
                    placeholder="Ketik untuk pencarian otomatis..."
                  />
                  {showPptkSuggestions && matchingPptkEmployees.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-32 overflow-y-auto z-50 text-left">
                      {matchingPptkEmployees.map((emp) => (
                        <div
                          key={`pptk-sugg-${emp.id}`}
                          onMouseDown={() => {
                            setPptkName(emp.name);
                            setPptkNip(emp.nip);
                            setShowPptkSuggestions(false);
                          }}
                          className="p-1 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-[10px]"
                        >
                          <p className="m-0 font-bold text-slate-800">{emp.name}</p>
                          <p className="m-0 text-[8.5px] text-slate-500 font-mono leading-tight">{emp.jabatan} | {emp.nip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">NIP PPTK</label>
                  <input type="text" value={pptkNip} onChange={(e) => setPptkNip(e.target.value)} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">JABATAN TTD PPTK (I & IV)</label>
                  <input type="text" value={p2TopRightLabel} onChange={(e) => {
                    setP2TopRightLabel(e.target.value);
                    setP2Row4LeftLabel(e.target.value);
                  }} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block">JABATAN TTD PA (IV KANAN)</label>
                  <input type="text" value={p2Row4RightLabel} onChange={(e) => setP2Row4RightLabel(e.target.value)} className="w-full text-[11px] p-1 border rounded bg-white" />
                </div>
              </div>

              <div className="space-y-2 bg-stone-50/50 p-2.5 rounded border">
                <span className="text-[10px] font-bold text-slate-500 block">C. JALUR TRANSIT RAYA (ROW I / Tiba-Pergi)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] text-slate-400 font-bold block">I. TIBA DI</label>
                    <input type="text" value={p2Row1TibaDi} onChange={(e) => setP2Row1TibaDi(e.target.value)} className="w-full text-[10px] p-1 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-400 font-bold block">I. TIBA TGL</label>
                    <input type="text" value={p2Row1TibaTgl} onChange={(e) => setP2Row1TibaTgl(e.target.value)} className="w-full text-[10px] p-1 border rounded bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] text-slate-400 font-bold block">I. GO FROM</label>
                    <input type="text" value={p2Row1BerangkatDari} onChange={(e) => setP2Row1BerangkatDari(e.target.value)} className="w-full text-[10px] p-1 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-400 font-bold block">I. GO DATE</label>
                    <input type="text" value={p2Row1BerangkatTgl} onChange={(e) => setP2Row1BerangkatTgl(e.target.value)} className="w-full text-[10px] p-1 border rounded bg-white" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* RENDER SHEET WRAPPER WITH TIMES NEW ROMAN STYLES FOR THE SIMULATION */}
      <div className="border border-slate-300 p-8 md:p-14 bg-slate-100 max-w-4xl mx-auto shadow-inner overflow-x-auto min-w-[320px]">
        
        {/* PRINTABLE COMPONENT */}
        <div 
          id="spd-printable" 
          className="bg-white p-10 md:p-14 font-serif text-black leading-normal shadow-lg max-w-[700px] mx-auto select-text select-all"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            #spd-printable *, #spd-printable *:before, #spd-printable *:after {
              box-sizing: border-box !important;
            }
            #spd-printable {
              font-family: "Times New Roman", Times, serif !important;
              color: #000 !important;
              background-color: #fff !important;
            }
            #spd-printable .flex { display: flex !important; }
            #spd-printable .flex-col { flex-direction: column !important; }
            #spd-printable .justify-end { justify-content: flex-end !important; }
            #spd-printable .justify-between { justify-content: space-between !important; }
            #spd-printable .items-center { align-items: center !important; }
            #spd-printable .shrink-0 { flex-shrink: 0 !important; }
            #spd-printable .italic { font-style: italic !important; }
            #spd-printable .mb-1 { margin-bottom: 4px !important; }
            #spd-printable .mb-2 { margin-bottom: 8px !important; }
            #spd-printable .mt-1 { margin-top: 4px !important; }
            #spd-printable .mt-2 { margin-top: 8px !important; }
            #spd-printable .mt-3 { margin-top: 12px !important; }
            #spd-printable .mt-4 { margin-top: 16px !important; }
            #spd-printable .mt-5 { margin-top: 20px !important; }
            #spd-printable .w-1\/2 { width: 50% !important; }
            #spd-printable .w-full { width: 100% !important; }
            #spd-printable .w-24 { width: 96px !important; }
            #spd-printable .w-4 { width: 16px !important; }
            #spd-printable .w-5 { width: 20px !important; }
            #spd-printable .w-8 { width: 32px !important; }
            #spd-printable .w-20 { width: 80px !important; }
            #spd-printable .w-56 { width: 224px !important; }
            #spd-printable .w-72 { width: 288px !important; }
            #spd-printable .pl-16 { padding-left: 64px !important; }
            #spd-printable .pr-4 { padding-right: 16px !important; }
            #spd-printable .px-16 { padding-left: 64px !important; padding-right: 64px !important; }
            #spd-printable .px-20 { padding-left: 80px !important; padding-right: 80px !important; }
            #spd-printable .pl-28 { padding-left: 112px !important; }
            #spd-printable .kop-header {
              position: relative;
              border-bottom: 4px double #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
              text-align: center;
              min-height: 80px;
              display: block;
            }
            #spd-printable .kop-logo-container {
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              display: flex;
              align-items: center;
            }
            #spd-printable .kop-logo {
              height: 80px;
              width: 70px;
              object-fit: contain;
            }
            #spd-printable .kop-text-container {
              padding-left: 80px;
              padding-right: 80px;
              width: 100%;
              box-sizing: border-box;
              text-align: center;
            }
            #spd-printable .kop-pemkab {
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin: 0;
              line-height: 1.2;
            }
            #spd-printable .kop-instansi {
              font-size: 21px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin: 0;
              margin-top: 2px;
              line-height: 1.2;
            }
            #spd-printable .kop-alamat {
              font-size: 11px;
              margin: 0;
              margin-top: 3.5px;
              line-height: 1.3;
            }
            #spd-printable .kop-laman {
              font-size: 11px;
              margin: 0;
              margin-top: 1px;
              line-height: 1.3;
            }
            #spd-printable .top-meta-container {
              float: right;
              width: 310px;
              margin-top: 2px;
              margin-bottom: 4px;
              font-size: 12.5px;
            }
            #spd-printable .top-meta-container table {
              width: 100%;
              border-collapse: collapse;
            }
            #spd-printable .top-meta-container td {
              padding: 1px 2px;
              vertical-align: top;
            }
            #spd-printable .doc-title-box {
              text-align: center;
              margin-top: 10px;
              margin-bottom: 8px;
              clear: both;
            }
            #spd-printable .doc-title {
              font-size: 15px;
              font-weight: bold;
              letter-spacing: 0.5px;
              text-decoration: none;
              margin: 0;
            }
            #spd-printable .spd-main-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
              font-size: 13px;
              margin-bottom: 12px;
            }
            #spd-printable .spd-main-table > tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 4px 6px !important;
              vertical-align: top;
              font-size: 13px !important;
            }
            #spd-printable .sub-nested-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
            }
            #spd-printable .sub-nested-table td {
              border: none !important;
              padding: 1.5px 0 !important;
            }
            #spd-printable .back-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
              font-size: 13.5px;
              margin-bottom: 12px;
            }
            #spd-printable .back-table > tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 5px 8px !important;
              vertical-align: top;
              font-size: 13.5px !important;
            }
            #spd-printable .back-table > tbody > tr > td:not([colspan]) {
              width: 50%;
            }
            #spd-printable .back-half-col {
              width: 50%;
            }
            #spd-printable .signature-box-mini {
              height: 75px;
            }
            #spd-printable .footer-sig-block {
              margin-top: 12px;
              float: right;
              width: 270px;
              font-size: 14px;
              text-align: left;
            }
            #spd-printable .sig-box {
              min-height: 90px;
              height: auto;
              margin-bottom: 10px;
            }
          ` }} />

          {/* HALAMAN 1 (HALAMAN DEPAN) */}
          {(activeTab === "all" || activeTab === "depan") && (
            <div className="page-container select-text text-black">
              {/* HEAD KOP */}
              <div className="kop-header relative border-b-4 border-double border-black pb-3 mb-4 min-h-[85px] flex items-center justify-center">
                <div className="kop-logo-container absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                  <img
                    src={TABALONG_LOGO_BASE64}
                    alt="Logo Kabupaten Tabalong"
                    className="kop-logo h-20 w-16 md:h-[80px] md:w-[70px] object-contain"
                  />
                </div>
                
                <div className="kop-text-container text-center w-full px-16 md:px-20">
                  <h1 className="kop-pemkab text-[15px] font-bold tracking-tight uppercase m-0 leading-tight">
                    {kopPemkab}
                  </h1>
                  <h2 className="kop-instansi text-xl font-bold tracking-normal uppercase m-0 leading-tight mt-1">
                    {kopInstansi}
                  </h2>
                  <p className="kop-alamat text-[10px] text-slate-800 m-0 mt-1 leading-normal">
                    {kopAlamat}
                  </p>
                  <p className="kop-laman text-[10px] text-slate-800 m-0 mt-0.5 leading-normal">
                    {kopLaman}
                  </p>
                </div>
              </div>

              {/* TOP RIGHT BLOCK SERIAL */}
              <div className="top-meta-container">
                <table>
                  <tbody>
                    <tr>
                      <td className="w-20">Lembar ke</td>
                      <td className="w-4 text-center">:</td>
                      <td>{lembarKe || "-"}</td>
                    </tr>
                    <tr>
                      <td>Kode No.</td>
                      <td className="text-center">:</td>
                      <td>{kodeNo || "-"}</td>
                    </tr>
                    <tr>
                      <td>Nomor</td>
                      <td className="text-center">:</td>
                      <td>{numSpd}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="clear-both"></div>

              {/* DOCUMENT MAIN HEADING */}
              <div className="doc-title-box mt-3 text-center">
                <h3 className="doc-title text-base font-bold tracking-wide m-0">
                  SURAT PERJALANAN DINAS (SPD)
                </h3>
              </div>

              {/* ROW ITEMS TABLE */}
              <table className="spd-main-table" style={{ borderCollapse: 'collapse', border: '1px solid black', width: '100%', fontSize: '13px' }}>
                <tbody>
                  {/* Row 1 */}
                  <tr>
                    <td className="center-align w-8 font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>1</td>
                    <td className="w-56 font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>Pengguna Anggaran</td>
                    <td className="font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>{paName}</td>
                  </tr>

                  {/* Row 2 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>2</td>
                    <td className="font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>Nama/NIP Pegawai yang melaksanakan perjalanan dinas</td>
                    <td style={{ border: '1px solid black', padding: '4px 6px' }}>
                      <div className="font-bold">{activeEmployee.name}</div>
                      <div className="mt-0.5 font-mono">{activeEmployee.nip !== "-" ? activeEmployee.nip : "Non-ASN"}</div>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>3</td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="font-bold py-0 leading-tight">a. Pangkat dan Golongan</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">b. Jabatan / Instansi</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">c. Tingkat Perjalanan Dinas</div>
                    </td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="py-0 leading-tight">a. {pangkatTraveler}</div>
                      <div className="py-0 leading-tight mt-0.5">b. {jabatanTraveler}</div>
                      <div className="py-0 leading-tight mt-0.5">c. {tingkatBiaya}</div>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>4</td>
                    <td className="font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>Maksud Perjalanan Dinas</td>
                    <td className="text-justify leading-normal text-[12.5px]" style={{ border: '1px solid black', padding: '4px 6px' }}>{maksudDinas}</td>
                  </tr>

                  {/* Row 5 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>5</td>
                    <td className="font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>Alat angkut yang dipergunakan</td>
                    <td style={{ border: '1px solid black', padding: '4px 6px' }}>{alatTransport}</td>
                  </tr>

                  {/* Row 6 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>6</td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="font-bold py-0 leading-tight">a. Tempat berangkat</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">b. Tempat tujuan</div>
                    </td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="py-0 leading-tight">a. {tempatBerangkat}</div>
                      <div className="py-0 leading-tight mt-0.5">b. {tempatTujuan}</div>
                    </td>
                  </tr>

                  {/* Row 7 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>7</td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="font-bold py-0 leading-tight">a. Lamanya Perjalanan Dinas</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">b. Tanggal berangkat</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">c. Tanggal harus kembali/tiba di tempat</div>
                    </td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="py-0 leading-tight">a. {lamanyaDinas}</div>
                      <div className="py-0 leading-tight mt-0.5">b. {tglBerangkat}</div>
                      <div className="py-0 leading-tight mt-0.5">c. {tglKembali}</div>
                    </td>
                  </tr>

                  {/* Row 8 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>8</td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="font-bold py-0 leading-tight">Pengikut : Nama</div>
                      <div className="mt-0.5 space-y-0.5 text-[12px] md:text-[13px]">
                        <div className="py-0 leading-none">1.</div>
                        <div className="py-0 leading-none">2.</div>
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="flex w-full border-b border-black/40 pb-0.5 mb-0.5 text-center font-bold text-[12px]">
                        <div className="w-1/2">Tanggal Lahir</div>
                        <div className="w-1/2">Keterangan</div>
                      </div>
                      <div className="space-y-0.5 text-[12px] md:text-[13px]">
                        <div className="flex w-full text-center leading-none">
                          <div className="w-1/2">-</div>
                          <div className="w-1/2">-</div>
                        </div>
                        <div className="flex w-full text-center leading-none">
                          <div className="w-1/2">-</div>
                          <div className="w-1/2">-</div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Row 9 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>9</td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="font-bold py-0 leading-tight">Pembebanan anggaran</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">a. Instansi</div>
                      <div className="font-bold py-0 leading-tight mt-0.5">b. Akun</div>
                    </td>
                    <td style={{ border: '1px solid black', verticalAlign: 'top', padding: '4px 6px' }}>
                      <div className="py-0 leading-tight">&nbsp;</div>
                      <div className="py-0 leading-tight mt-0.5">a. {akunInstansi}</div>
                      <div className="py-0 leading-tight mt-0.5">b. {akunKode}</div>
                    </td>
                  </tr>

                  {/* Row 10 */}
                  <tr>
                    <td className="center-align font-bold" style={{ border: '1px solid black', textAlign: 'center', padding: '4px 6px' }}>10</td>
                    <td className="font-bold" style={{ border: '1px solid black', padding: '4px 6px' }}>Keterangan lain-lain</td>
                    <td style={{ border: '1px solid black', padding: '4px 6px' }}>-</td>
                  </tr>
                </tbody>
              </table>

              {/* FOOTER SIGN-OFF PAGE 1 */}
              <div className="mt-2 flex justify-end">
                <div className="footer-sig-block w-72 text-left" style={{ fontSize: '13px' }}>
                  <p className="m-0">Dikeluarkan di Tanjung</p>
                  <p className="m-0">Tanggal {formatIndoDate(travel.taskLetterDate)}</p>
                  
                  <div className="mt-2 text-left">
                    <p className="m-0 font-bold leading-tight">Pengguna Anggaran,</p>
                    <p className="m-0 font-bold leading-tight">Inspektur Daerah Kab. Tabalong</p>
                    <div className="sig-box min-h-[90px] flex flex-col justify-center my-2" style={{ minHeight: '90px', height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {signSpecialCode ? (
                        <p className="m-0 font-mono text-slate-800 font-semibold text-left" style={{ fontSize: signCodeSize, lineHeight: '1.2', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {signCodeCase === "uppercase" 
                            ? signSpecialCode.toUpperCase() 
                            : signCodeCase === "lowercase" 
                              ? signSpecialCode.toLowerCase() 
                              : signSpecialCode}
                        </p>
                      ) : (
                        <div className="h-full"></div>
                      )}
                    </div>
                    <p className="m-0 font-bold leading-tight uppercase text-[13px]">{paName}</p>
                    <p className="m-0 leading-tight text-[12px]">NIP. {paNip}</p>
                  </div>
                </div>
              </div>

              <div className="clear-both"></div>
            </div>
          )}

          {/* PAGE BREAK CONDITION ON ALL MODE */}
          {activeTab === "all" && (
            <div className="page-break border-t-2 border-dashed border-slate-350 my-10 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-100 border text-slate-400 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider print:hidden select-none">PAGE BREAK (Cetak Bolak-Balik)</span>
            </div>
          )}

          {/* HALAMAN 2 (HALAMAN BELAKANG) */}
          {(activeTab === "all" || activeTab === "belakang") && (
            <div className="page-container select-text text-black">
              
              {/* BACK MATRIX BOX */}
              <table className="back-table w-full">
                <tbody>
                  {/* Row 1: Left is completely empty, Right is departure */}
                  <tr>
                    <td className="back-half-col w-1/2" style={{ border: '1px solid black' }}></td>
                    <td className="back-half-col w-1/2 text-xs leading-5" style={{ border: '1px solid black', padding: '5px 8px' }}>
                      <div className="flex mb-1">
                        <div className="w-24 shrink-0">Berangkat dari</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2BerangkatDari}</div>
                      </div>
                      <div className="italic text-[10.5px] pl-28 mb-1 leading-normal">(Tempat Kedudukan)</div>
                      <div className="flex mb-1">
                        <div className="w-24 shrink-0">Ke</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Ke}</div>
                      </div>
                      <div className="flex mb-1">
                        <div className="w-1/2 md:w-24 shrink-0">Pada Tanggal</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2TglBerangkat}</div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="m-0 text-[11.5px]">{p2TopRightLabel}</p>
                        <div className="signature-box-mini h-16"></div>
                        <p className="m-0 font-bold text-left text-[11.5px]">{pptkName}</p>
                        <p className="m-0 text-[11px]">NIP. {pptkNip}</p>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2 (labeled "I."): Left is I. Tiba di, Right is Berangkat Dari */}
                  <tr>
                    <td className="text-xs leading-5 w-1/2" style={{ border: '1px solid black', padding: '5px 8px', verticalAlign: 'top' }}>
                      <div className="flex mb-1">
                        <div className="w-5 font-bold shrink-0">I.</div>
                        <div className="w-24 shrink-0">Tiba di</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row1TibaDi}</div>
                      </div>
                      <div className="flex mb-1">
                        <div className="w-5 shrink-0"></div>
                        <div className="w-24 shrink-0">Pada Tanggal</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row1TibaTgl}</div>
                      </div>
                      
                      {/* Blank area for local officer signature and stamp as shown in photo */}
                      <div className="signature-box-mini h-16"></div>
                    </td>
                    <td className="text-xs leading-5 w-1/2" style={{ border: '1px solid black', padding: '5px 8px', verticalAlign: 'top' }}>
                      <div className="flex mb-1">
                        <div className="w-24 shrink-0">Berangkat dari</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row1BerangkatDari}</div>
                      </div>
                      <div className="flex mb-1">
                        <div className="w-24 shrink-0">Ke</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row1BerangkatKe}</div>
                      </div>
                      <div className="flex mb-1">
                        <div className="w-24 shrink-0">Pada Tanggal</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row1BerangkatTgl}</div>
                      </div>
                      
                      {/* Blank area for local officer signature and stamp as shown in photo */}
                      <div className="signature-box-mini h-16"></div>
                    </td>
                  </tr>

                  {/* Row 3 (labeled "III."): Left is III. Tiba di + PPTK signature, Right is general text */}
                  <tr>
                    <td className="text-xs leading-5 w-1/2" style={{ border: '1px solid black', padding: '5px 8px', verticalAlign: 'top' }}>
                      <div className="flex mb-1">
                        <div className="w-5 font-bold shrink-0">III.</div>
                        <div className="w-24 shrink-0">Tiba di</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row3TibaDi}</div>
                      </div>
                      <div className="flex mb-1">
                        <div className="w-5 shrink-0"></div>
                        <div className="w-24 shrink-0">Pada Tanggal</div>
                        <div className="w-4 text-center">:</div>
                        <div>{p2Row3TibaTgl}</div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="m-0 text-[11.5px]">{p2Row4LeftLabel}</p>
                        <div className="signature-box-mini h-16"></div>
                        <p className="m-0 font-bold text-left text-[11.5px]">{pptkName}</p>
                        <p className="m-0 text-[11px]">NIP. {pptkNip}</p>
                      </div>
                    </td>
                    <td className="text-xs w-1/2" style={{ border: '1px solid black', padding: '5px 8px', verticalAlign: 'top' }}>
                      <p className="m-0 text-justify leading-relaxed">
                        Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                      </p>
                    </td>
                  </tr>

                  {/* Row 4: Catatan Lain-Lain */}
                  <tr>
                    <td colSpan={2} className="text-xs" style={{ border: '1px solid black', padding: '5px 8px' }}>
                      <span className="font-bold">IV. Catatan lain-lain :</span> {p2Notes}
                    </td>
                  </tr>

                  {/* Row 5: Perhatian */}
                  <tr>
                    <td colSpan={2} className="text-xs text-justify leading-normal" style={{ border: '1px solid black', padding: '5px 8px' }}>
                      <span className="font-bold">V. PERHATIAN :</span>
                      <p className="m-0 mt-1 leading-normal">
                        PA yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* OUTSIDE TABLE footer block for Halaman 2 bottom right signature */}
              <div className="mt-5 flex justify-end">
                <div className="footer-sig-block w-72 text-left" style={{ fontSize: '14px' }}>
                  <p className="m-0 font-bold leading-tight">{p2Row4RightLabel},</p>
                  <p className="m-0 font-bold leading-tight">Inspektur Daerah Kab. Tabalong</p>
                  <div className="sig-box min-h-[110px] flex flex-col justify-center my-2" style={{ minHeight: '110px', height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {signSpecialCode ? (
                      <p className="m-0 font-mono text-slate-800 font-semibold text-left" style={{ fontSize: signCodeSize, lineHeight: '1.2', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {signCodeCase === "uppercase" 
                          ? signSpecialCode.toUpperCase() 
                          : signCodeCase === "lowercase" 
                            ? signSpecialCode.toLowerCase() 
                            : signSpecialCode}
                      </p>
                    ) : (
                      <div className="h-full"></div>
                    )}
                  </div>
                  <p className="m-0 font-bold leading-tight uppercase text-[13.5px]">{paName}</p>
                  <p className="m-0 leading-tight text-[12.5px]">NIP. {paNip}</p>
                </div>
              </div>

              <div className="clear-both"></div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
