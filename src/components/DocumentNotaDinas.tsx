import React, { useState, useEffect } from "react";
import { Employee, Travel } from "../types";
import { Printer, FileText, Settings, RefreshCw } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";
import { getFormattedPangkatGolongan } from "../utils/pangkat";

interface DocumentNotaDinasProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentNotaDinas({ travel, employees }: DocumentNotaDinasProps) {
  // Try to find reasonable defaults from the employee directory
  const signatory = employees.find(e => e.id === travel.signatoryId);
  const participants = travel.employeeIds
    .map(id => employees.find(e => e.id === id))
    .filter(Boolean) as Employee[];

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

  const formatBudgetSentence = (source: string) => {
    let clean = source.replace(/^(DPA-SKPD\s*|DPA\s*)/i, "").trim();
    if (!clean) {
      clean = "Inspektorat Daerah Kabupaten Tabalong";
    }
    if (clean.toLowerCase().includes("tahun anggaran")) {
      return `Adapun anggaran untuk kegiatan ini dibebankan pada DPA ${clean} pada Sub Kegiatan Pendidikan dan Pelatihan Pegawai Berdasarkan Tugas dan Fungsi.`;
    } else {
      return `Adapun anggaran untuk kegiatan ini dibebankan pada DPA ${clean} Tahun Anggaran 2025 pada Sub Kegiatan Pendidikan dan Pelatihan Pegawai Berdasarkan Tugas dan Fungsi.`;
    }
  };

  // --- LIVE EDITABLE STATES (non-printing controls) ---
  const [showConfig, setShowConfig] = useState(false);
  const [formatPeserta, setFormatPeserta] = useState<"list" | "tabel">("list");

  // Kop Header States
  const [kopPemkab, setKopPemkab] = useState("PEMERINTAH KABUPATEN TABALONG");
  const [kopInstansi, setKopInstansi] = useState("INSPEKTORAT DAERAH");
  const [kopAlamat, setKopAlamat] = useState("Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513");
  const [kopLaman, setKopLaman] = useState("Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id");

  // Nota Dinas Metadata States
  const [numNota, setNumNota] = useState(travel.notaNumber);
  const [dateNota, setDateNota] = useState(formatIndoDate(travel.notaDate));
  const [kepada, setKepada] = useState("Yth. Plt. Inspektur Daerah Kab. Tabalong");
  const [dari, setDari] = useState("Kasubbag Umum dan Kepegawaian");
  const [tembusan, setTembusan] = useState("-");
  const [sifat, setSifat] = useState("Biasa");
  const [lampiran, setLampiran] = useState("1 (satu) berkas");
  const [hal, setHal] = useState("");

  // Paragraph 1 Reference States & Toggle
  const [useRujukan, setUseRujukan] = useState(true);
  const [rujalanDari, setRujukanDari] = useState("Bupati Tabalong");
  const [rujakanNomor, setRujukanNomor] = useState("B-95/INSP/700.1.2.9/X/2025");
  const [rujakanTanggal, setRujukanTanggal] = useState("9 Oktober 2025");
  const [rujakanHal, setRujukanHal] = useState("Undangan");
  const [isCustomRujukan, setIsCustomRujukan] = useState(false);
  const [customRujukanText, setCustomRujukanText] = useState("Sehubungan dengan surat dari Bupati Tabalong Nomor B-95/INSP/700.1.2.9/X/2025 Tanggal 9 Oktober 2025 Hal: Undangan.");

  // Signature Block States
  const [sigJabatan, setSigJabatan] = useState("Kasubbag Umum dan Kepegawaian");
  const [sigNama, setSigNama] = useState("Ida Lusia Wahyuti, S.Sos, MM");
  const [sigPangkat, setSigPangkat] = useState("Pembina / IV/a");
  const [sigNip, setSigNip] = useState("197904092000032002");
  const [showSigSuggestions, setShowSigSuggestions] = useState(false);
  const [signSpecialCode, setSignSpecialCode] = useState("");
  const [signCodeCase, setSignCodeCase] = useState<"as-is" | "uppercase" | "lowercase">("as-is");
  const [signCodeSize, setSignCodeSize] = useState<"9px" | "11px" | "13px" | "15px">("11px");

  const matchingSigEmployees = sigNama.trim() === "" ? [] : employees.filter(emp => 
    emp.name.toLowerCase().includes(sigNama.toLowerCase()) || 
    emp.nip.toLowerCase().includes(sigNama.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(sigNama.toLowerCase())
  );

  // Text paragraphs
  const [useAnggaran, setUseAnggaran] = useState(true);
  const [textAnggaran, setTextAnggaran] = useState("");
  const [textPenutup, setTextPenutup] = useState("Demikian nota dinas ini disampaikan, mohon petunjuk, arahan dan persetujuan.");

  // Keep states synchronized when active travel or participants list changes
  useEffect(() => {
    setNumNota(travel.notaNumber);
    setDateNota(formatIndoDate(travel.notaDate));
    
    // Default Hal based on current travel purpose
    setHal(`Mohon persetujuan mengikuti Kegiatan ${travel.purpose}`);

    // Set initial rujukan text
    setCustomRujukanText(`Sehubungan dengan surat dari ${rujalanDari} Nomor ${rujakanNomor} Tanggal ${rujakanTanggal} Hal: ${rujakanHal}.`);

    // Try to search for a Kasubbag / Kepegawaian role in our employees list
    const kasubbag = employees.find(e => 
      e.jabatan.toLowerCase().includes("kasubbag") || 
      e.jabatan.toLowerCase().includes("kepegawaian") ||
      e.jabatan.toLowerCase().includes("umum")
    );

    if (kasubbag) {
      setDari(kasubbag.jabatan);
      setSigJabatan(kasubbag.jabatan);
      setSigNama(kasubbag.name);
      setSigPangkat(kasubbag.pangkat);
      setSigNip(kasubbag.nip);
    } else {
      // Fallback to screenshot defaults
      setDari("Kasubbag Umum dan Kepegawaian");
      setSigJabatan("Kasubbag Umum dan Kepegawaian");
      setSigNama("Ida Lusia Wahyuti, S.Sos, MM");
      setSigPangkat("Pembina / IV/a");
      setSigNip("197904092000032002");
    }

    // Populate dynamic Budget and Reckoning Sentence
    setTextAnggaran(formatBudgetSentence(travel.budgetSource));
  }, [travel.id, employees, rujalanDari, rujakanNomor, rujakanTanggal, rujakanHal]);

  // Handle restoring exact capture defaults immediately on request
  const handleLoadCaptureDefaults = () => {
    setKopPemkab("PEMERINTAH KABUPATEN TABALONG");
    setKopInstansi("INSPEKTORAT DAERAH");
    setKopAlamat("Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513");
    setKopLaman("Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id");

    setKepada("Yth. Plt. Inspektur Daerah Kab. Tabalong");
    setDari("Kasubbag Umum dan Kepegawaian");
    setTembusan("-");
    setSifat("Biasa");
    setLampiran("1 (satu) berkas");
    
    setHal(`Mohon persetujuan mengikuti Kegiatan ${travel.purpose}`);
    
    setUseRujukan(true);
    setRujukanDari("Bupati Tabalong");
    setRujukanNomor("B-95/INSP/700.1.2.9/X/2025");
    setRujukanTanggal("9 Oktober 2025");
    setRujukanHal("Undangan");
    setIsCustomRujukan(false);
    setCustomRujukanText("Sehubungan dengan surat dari Bupati Tabalong Nomor B-95/INSP/700.1.2.9/X/2025 Tanggal 9 Oktober 2025 Hal: Undangan.");

    setSigJabatan("Kasubbag Umum dan Kepegawaian");
    setSigNama("Ida Lusia Wahyuti, S.Sos, MM");
    setSigPangkat("Pembina / IV/a");
    setSigNip("197904092000032002");

    setTextAnggaran(formatBudgetSentence(travel.budgetSource));
    setUseAnggaran(true);
    setTextPenutup("Demikian nota dinas ini disampaikan, mohon petunjuk, arahan dan persetujuan.");
    setFormatPeserta("list");
    setSignSpecialCode("");
    setSignCodeCase("as-is");
    setSignCodeSize("11px");
  };

  const handlePrint = () => {
    const printContent = document.getElementById("nota-dinas-printable")?.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "", "height=900,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Nota Dinas - ${numNota.replace(/\//g, '_')}</title>
              <style>
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.45;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  padding: 30px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-justify { text-align: justify; }
                .font-bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                
                /* Tailwind utility mappings for print wrapper */
                .w-full { width: 100%; }
                .w-8 { width: 32px !important; min-width: 32px !important; max-width: 32px !important; }
                .w-24 { width: 96px !important; min-width: 96px !important; max-width: 96px !important; }
                .w-4 { width: 16px !important; min-width: 16px !important; max-width: 16px !important; }
                .align-top { vertical-align: top !important; }
                .text-left { text-align: left !important; }
                .border-none { border: none !important; }
                .border-collapse { border-collapse: collapse !important; }
                .py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
                .h-1\.5 { height: 6px !important; }
                .leading-none { line-height: 1 !important; }
                .leading-relaxed { line-height: 1.625 !important; }
                .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                .pl-8 { padding-left: 32px !important; }
                .p-1 { padding: 4px !important; }
                .p-1\.5 { padding: 6px !important; }
                .px-1\.5 { padding-left: 6px !important; padding-right: 6px !important; }
                .text-\[11px\] { font-size: 11px !important; }
                .mt-0\.5 { margin-top: 2px !important; }
                
                /* Letterhead Kop */
                .kop-header {
                  position: relative;
                  border-bottom: 4px double #000;
                  padding-bottom: 10px;
                  margin-bottom: 22px;
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
                  margin-top: 3px;
                  line-height: 1.3;
                }
                .kop-laman {
                  font-size: 11px;
                  margin: 0;
                  margin-top: 1px;
                  line-height: 1.3;
                }
                
                /* Document Title */
                .doc-title {
                  font-size: 18px;
                  font-weight: bold;
                  text-align: center;
                  margin-top: 10px;
                  margin-bottom: 2px;
                  letter-spacing: 0.5px;
                }
                .doc-subtitle {
                  font-size: 14px;
                  text-align: center;
                  margin-bottom: 20px;
                }
                
                /* Metadata Table */
                .meta-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 12px;
                  font-size: 14px;
                }
                .meta-table td {
                  padding: 3px 4px;
                  vertical-align: top;
                }
                .line-divider {
                  border-top: 1.5px solid #000;
                  margin-bottom: 15px;
                }
                
                /* Body Paragraphs */
                .body-text {
                  font-size: 14px;
                  text-align: justify;
                  margin-bottom: 12px;
                  line-height: 1.45;
                }
                .indent-8 {
                  text-indent: 30px;
                }
                
                /* Traditional Table Format */
                .table-participants {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 6px 0;
                  font-size: 14px;
                }
                .table-participants th, .table-participants td {
                  border: 1px solid #000;
                  padding: 3px 5px;
                  text-align: left;
                }
                .table-participants th {
                  background-color: #f2f2f2;
                  text-align: center;
                  font-weight: bold;
                }
                
                /* Capture's Enumerated Participant List Format */
                .list-participants-container {
                  margin: 6px 0;
                  font-size: 14px;
                  padding-left: 32px;
                }
                .list-participant-item {
                  margin-bottom: 6px;
                  page-break-inside: avoid;
                }
                .list-participant-item table {
                  width: 100%;
                  border-collapse: collapse;
                  border: none;
                }
                .list-participant-item td {
                  padding: 1.5px 0;
                  vertical-align: top;
                }
                
                /* Signature block */
                .sig-container {
                  margin-top: 25px;
                  float: right;
                  width: 280px;
                  font-size: 14px;
                  text-align: left;
                  page-break-inside: avoid;
                }
                .sig-box {
                  min-height: 110px;
                  height: auto;
                  margin-bottom: 12px;
                }
                
                @media print {
                  body { padding: 1.5cm 1.5cm; }
                  @page { size: A4 portrait; margin: 1.5cm; }
                }
              </style>
            </head>
            <body>
              ${printContent}
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
    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-5">
      
      {/* ACTION HEADER & CONTROLS BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-xs text-slate-600 font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Format Nota Dinas Resmi (Times New Roman Standard) - <b className="text-slate-800 uppercase">{formatPeserta} Mode</b></span>
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition duration-150 cursor-pointer ${
              showConfig 
                ? "bg-slate-200 border-slate-300 text-slate-800" 
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            {showConfig ? "Sembunyikan Pengaturan" : "Sesuaikan Dokumen"}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Nota Dinas
          </button>
        </div>
      </div>

      {/* EXPANDABLE COLLAPSIBLE CONTROL PANEL (NON-PRINTING SCREEN-ONLY) */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-fadeIn transition-all duration-300">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-500" />
              Kontrol Redaksi & Layout Nota Dinas
            </h4>
            <button
              onClick={handleLoadCaptureDefaults}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-[10px] font-bold text-blue-600 border border-blue-200 px-2 py-1 rounded"
              title="Ganti semua data input agar sama persis seperti screenshot capture contoh user."
            >
              <RefreshCw className="w-3 h-3 text-blue-500" />
              Set Sesuai Gambar Contoh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Kop Header */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-blue-600 border-b pb-1">1. Kop Pemerintah & Alamat</p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Pemerintah Daerah (Line 1)</label>
                  <input
                    type="text"
                    value={kopPemkab}
                    onChange={(e) => setKopPemkab(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Instansi Utama (Line 2)</label>
                  <input
                    type="text"
                    value={kopInstansi}
                    onChange={(e) => setKopInstansi(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Alamat (Line 3)</label>
                  <input
                    type="text"
                    value={kopAlamat}
                    onChange={(e) => setKopAlamat(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Laman / Surel (Line 4)</label>
                  <input
                    type="text"
                    value={kopLaman}
                    onChange={(e) => setKopLaman(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Metadata Memo & Rujukan */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-blue-600 border-b pb-1">2. Metadata Kepala Nota</p>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Kepada</label>
                  <input
                    type="text"
                    value={kepada}
                    onChange={(e) => setKepada(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Dari</label>
                  <input
                    type="text"
                    value={dari}
                    onChange={(e) => setDari(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Sifat</label>
                    <input
                      type="text"
                      value={sifat}
                      onChange={(e) => setSifat(e.target.value)}
                      className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Lampiran</label>
                    <input
                      type="text"
                      value={lampiran}
                      onChange={(e) => setLampiran(e.target.value)}
                      className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Perihal (Hal)</label>
                  <textarea
                    rows={2}
                    value={hal}
                    onChange={(e) => setHal(e.target.value)}
                    className="w-full text-xs bg-slate-50 border p-1.5 rounded focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Redaksional Rujukan & TTD */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
              <p className="text-[10px] font-bold uppercase text-blue-600 border-b pb-1">3. Rujukan & Penanda Tangan</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5 py-1">
                  <input
                    id="enable-rujukan"
                    type="checkbox"
                    checked={useRujukan}
                    onChange={(e) => setUseRujukan(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="enable-rujukan" className="text-[10px] text-slate-600 font-bold uppercase cursor-pointer">Pasang Paragraf Rujukan</label>
                </div>
                {useRujukan && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 grid grid-cols-1 gap-2">
                    {!isCustomRujukan ? (
                      <>
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Surat Rujukan Dari</label>
                          <input 
                            type="text" 
                            value={rujalanDari} 
                            onChange={(e) => setRujukanDari(e.target.value)} 
                            className="w-full text-[11px] p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Nomor Rujukan</label>
                          <input 
                            type="text" 
                            value={rujakanNomor} 
                            onChange={(e) => setRujukanNomor(e.target.value)} 
                            className="w-full text-[11px] p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Tanggal Rujukan</label>
                            <input 
                              type="text" 
                              value={rujakanTanggal} 
                              onChange={(e) => setRujukanTanggal(e.target.value)} 
                              className="w-full text-[11px] p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Hal Rujukan</label>
                            <input 
                              type="text" 
                              value={rujakanHal} 
                              onChange={(e) => setRujukanHal(e.target.value)} 
                              className="w-full text-[11px] p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                              placeholder="Undangan"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[9px] text-amber-600 font-extrabold block uppercase">Kalimat Rujukan Manual</label>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Kembalikan kalimat rujukan ke setelan otomatis?")) {
                                setIsCustomRujukan(false);
                              }
                            }}
                            className="text-[8px] text-slate-400 hover:text-blue-500 font-bold"
                          >
                            Reset ke Otomatis
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          value={customRujukanText}
                          onChange={(e) => setCustomRujukanText(e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-amber-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-sans text-slate-800"
                          placeholder="Ketik kalimat rujukan secara manual di sini..."
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 py-1 border-t border-slate-200 mt-1 pt-1.5">
                      <input
                        id="custom-rujukan-check"
                        type="checkbox"
                        checked={isCustomRujukan}
                        onChange={(e) => {
                          setIsCustomRujukan(e.target.checked);
                          if (e.target.checked) {
                            setCustomRujukanText(`Sehubungan dengan surat dari ${rujalanDari} Nomor ${rujakanNomor} Tanggal ${rujakanTanggal} Hal: ${rujakanHal}.`);
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <label htmlFor="custom-rujukan-check" className="text-[9px] text-slate-600 font-extrabold uppercase cursor-pointer select-none">Edit Kalimat Secara Bebas (Manual)</label>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Format Pendataan Peserta</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setFormatPeserta("list")}
                      className={`flex-1 py-1 px-1.5 rounded border font-semibold ${
                        formatPeserta === "list" 
                          ? "bg-blue-50 text-blue-600 border-blue-200" 
                          : "bg-white text-slate-505 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      Daftar Gambar (List)
                    </button>
                    <button
                      onClick={() => setFormatPeserta("tabel")}
                      className={`flex-1 py-1 px-1.5 rounded border font-semibold ${
                        formatPeserta === "tabel" 
                          ? "bg-blue-50 text-blue-600 border-blue-200" 
                          : "bg-white text-slate-505 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      Tabel Standar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Bottom Row: Signatory and Budget text overrides */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-150">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-blue-600 border-b pb-1">4. Penanda Tangan Dinas (Sign-Off)</p>
              
              {/* Quick Select Employee */}
              <div className="bg-blue-50/50 p-1.5 rounded border border-blue-100/60 mb-2">
                <label className="text-[8px] text-blue-700 font-black block mb-0.5 uppercase tracking-wide">CARI CEPAT DARI BASIS DATA</label>
                <select
                  onChange={(e) => {
                    const emp = employees.find(x => x.id === e.target.value);
                    if (emp) {
                      setSigNama(emp.name);
                      setSigJabatan(emp.jabatan);
                      setSigPangkat(getFormattedPangkatGolongan(emp.pangkat));
                      setSigNip(emp.nip);
                    }
                  }}
                  value=""
                  className="w-full text-[10px] p-1 border border-blue-200 rounded bg-white text-blue-900 font-medium"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({getFormattedPangkatGolongan(emp.pangkat)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="relative">
                  <label className="text-[10px] text-slate-400 block font-bold">NAMA LENGKAP TTD</label>
                  <input
                    type="text"
                    value={sigNama}
                    onChange={(e) => {
                      setSigNama(e.target.value);
                      setShowSigSuggestions(true);
                    }}
                    onFocus={() => setShowSigSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSigSuggestions(false), 200);
                    }}
                    className="w-full p-1 border rounded bg-slate-50 font-semibold"
                    placeholder="Ketik untuk pencarian otomatis..."
                  />
                  {showSigSuggestions && matchingSigEmployees.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 text-left">
                      {matchingSigEmployees.map((emp) => (
                        <div
                          key={`sig-sugg-${emp.id}`}
                          onMouseDown={() => {
                            setSigNama(emp.name);
                            setSigJabatan(emp.jabatan);
                            setSigPangkat(getFormattedPangkatGolongan(emp.pangkat));
                            setSigNip(emp.nip);
                            setShowSigSuggestions(false);
                          }}
                          className="p-1.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-[10px]"
                        >
                          <p className="m-0 font-bold text-slate-800">{emp.name}</p>
                          <p className="m-0 text-[8.5px] text-slate-500 font-mono leading-tight">{emp.jabatan} | {emp.nip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-bold">JABATAN TTD</label>
                  <input type="text" value={sigJabatan} onChange={(e) => setSigJabatan(e.target.value)} className="w-full p-1 border rounded bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-bold">PANGKAT / GOL</label>
                  <input type="text" value={sigPangkat} onChange={(e) => setSigPangkat(e.target.value)} className="w-full p-1 border rounded bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-bold">NIP PEJABAT</label>
                  <input type="text" value={sigNip} onChange={(e) => setSigNip(e.target.value)} className="w-full p-1 border rounded bg-slate-50" />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <label className="text-[9px] text-emerald-600 font-bold block uppercase">KODE KHUSUS TANDA TANGAN (DI ANTARA JABATAN & NAMA)</label>
                <textarea
                  rows={2}
                  value={signSpecialCode}
                  onChange={(e) => setSignSpecialCode(e.target.value)}
                  placeholder="Contoh: Kode 1 (Gunakan Enter, Spasi, atau Backspace)"
                  className="w-full text-xs p-1.5 bg-emerald-50/30 border border-emerald-200 rounded font-mono text-emerald-950 placeholder:text-emerald-700/50 mt-1"
                />
                <div className="grid grid-cols-2 gap-1.5 mt-1 bg-emerald-50/20 p-1 rounded border border-emerald-100/60">
                  <div>
                    <label className="text-[8px] text-emerald-700 font-bold block mb-0.5">BESAR/KECIL HURUF</label>
                    <select
                      value={signCodeCase}
                      onChange={(e) => setSignCodeCase(e.target.value as any)}
                      className="w-full text-[9px] p-0.5 border border-emerald-250 rounded bg-white text-emerald-900 font-medium"
                    >
                      <option value="as-is">Sesuai Ketikan</option>
                      <option value="uppercase">HURUF BESAR</option>
                      <option value="lowercase">huruf kecil</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-emerald-700 font-bold block mb-0.5">UKURAN HURUF</label>
                    <select
                      value={signCodeSize}
                      onChange={(e) => setSignCodeSize(e.target.value as any)}
                      className="w-full text-[9px] p-0.5 border border-emerald-250 rounded bg-white text-emerald-900 font-medium"
                    >
                      <option value="9px">Kecil (9px)</option>
                      <option value="11px">Standard (11px)</option>
                      <option value="13px">Besar (13px)</option>
                      <option value="15px">Sangat Besar (15px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                <p className="text-[10px] font-bold uppercase text-blue-600">5. Redaksi Pembebanan Anggaran</p>
                <div className="flex items-center gap-1.5">
                  <input
                    id="enable-anggaran"
                    type="checkbox"
                    checked={useAnggaran}
                    onChange={(e) => setUseAnggaran(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <label htmlFor="enable-anggaran" className="text-[9px] text-slate-600 font-bold uppercase cursor-pointer select-none">Tampilkan</label>
                </div>
              </div>
              {useAnggaran ? (
                <textarea
                  rows={3}
                  value={textAnggaran}
                  onChange={(e) => setTextAnggaran(e.target.value)}
                  className="w-full text-xs p-2 border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Sesuaikan redaksi anggaran belanja..."
                />
              ) : (
                <p className="text-[10px] text-slate-400 italic">Paragraf anggaran disembunyikan dari nota dinas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER SHEET WRAPPER WITH TIMES NEW ROMAN STYLES FOR THE SIMULATION */}
      <div className="border border-slate-300 p-8 md:p-14 bg-slate-100 max-w-4xl mx-auto shadow-inner overflow-x-auto min-w-[320px]">
        
        {/* PRINTABLE COMPONENT */}
        <div 
          id="nota-dinas-printable" 
          className="bg-white p-12 md:p-14 font-serif text-black leading-relaxed shadow-lg max-w-[700px] mx-auto select-text select-all"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          
          {/* KOP SURAT */}
          <div className="kop-header relative border-b-4 border-double border-black pb-3 mb-6 min-h-[85px] flex items-center justify-center">
            <div className="kop-logo-container absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
              <img
                src={TABALONG_LOGO_BASE64}
                alt="Logo Kabupaten Tabalong"
                className="kop-logo h-20 w-16 md:h-[80px] md:w-[70px] object-contain"
              />
            </div>
            
            <div className="kop-text-container text-center w-full px-16 md:px-20">
              <h1 className="kop-pemkab text-[16px] font-bold tracking-tight uppercase m-0 leading-tight">
                {kopPemkab}
              </h1>
              <h2 className="kop-instansi text-2xl font-bold tracking-normal uppercase m-0 leading-tight mt-1">
                {kopInstansi}
              </h2>
              <p className="kop-alamat text-[11px] text-slate-800 m-0 mt-1 leading-normal">
                {kopAlamat}
              </p>
              <p className="kop-laman text-[11px] text-slate-800 m-0 mt-0.5 leading-normal">
                {kopLaman}
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center mb-6">
            <h3 className="doc-title text-lg font-bold uppercase tracking-wide m-0">
              NOTA DINAS
            </h3>
          </div>

          {/* METADATA TABLES */}
          <table className="meta-table w-full text-sm md:text-[14px] border-collapse mb-4 select-text leading-normal">
            <tbody>
              <tr>
                <td className="w-20 font-medium py-1">Kepada</td>
                <td className="w-4 py-1 text-center">:</td>
                <td className="py-1">{kepada}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Dari</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{dari}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Tembusan</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{tembusan}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Tanggal</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{dateNota}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Nomor</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{numNota}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Sifat</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{sifat}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Lampiran</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1">{lampiran}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Hal</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  {hal}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SEPARATOR LINE */}
          <div className="line-divider border-t-1.5 border-black mb-4"></div>

          {/* BODY CONTENT */}
          <div className="space-y-4 text-sm md:text-[14.5px] text-justify leading-relaxed">
            
            {useRujukan && (
              <div className="relative group">
                <div className="absolute -left-6 top-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none pointer-events-none text-xs" title="Kalimat rujukan ini dapat diedit langsung">
                  ✍️
                </div>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText;
                    setIsCustomRujukan(true);
                    setCustomRujukanText(text);
                  }}
                  className="body-text text-black hover:bg-amber-50/40 focus:bg-amber-50/80 p-1.5 -m-1.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-300 transition duration-150 cursor-text text-justify"
                  style={{ minHeight: "1.5em", outline: "none" }}
                  title="Klik langsung pada teks ini untuk mengubah kalimat rujukan"
                >
                  {isCustomRujukan ? customRujukanText : `Sehubungan dengan surat dari ${rujalanDari} Nomor ${rujakanNomor} Tanggal ${rujakanTanggal} Hal: ${rujakanHal}.`}
                </p>
              </div>
            )}

            <p className="body-text indent-8 text-black">
              Berkenaan dengan hal tersebut di atas, mohon persetujuan untuk melaksanakan perjalanan dinas dalam rangka mengikuti kegiatan <span className="font-bold">"{travel.purpose}"</span> selama <span className="font-bold">{durationDays} ({durationDaysToWords(durationDays)}) hari</span> {travel.customDates && travel.customDates.length > 0 ? (
                <>
                  yaitu pada tanggal{" "}
                  <span className="font-bold">
                    {(() => {
                      const sorted = [...travel.customDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                      const formatted = sorted.map(d => formatIndoDate(d));
                      if (formatted.length === 1) return formatted[0];
                      const last = formatted.pop();
                      return `${formatted.join(", ")} dan ${last}`;
                    })()}
                  </span>
                </>
              ) : (
                <>
                  dari tanggal <span className="font-bold">{formatIndoDate(travel.departureDate)} s.d {formatIndoDate(travel.returnDate)}</span>
                </>
              )} bertempat di <span className="font-bold">{travel.destination}</span>.
            </p>

            <p className="body-text text-black">
              Adapun Pegawai yang diusulkan mengikuti kegiatan tersebut adalah:
            </p>

            {/* SEGMENT: RENDERING PESERTA (DYNAMIC FORMAT BASED ON CONTROLS) */}
            {formatPeserta === "list" ? (
              <div className="list-participants-container pl-8">
                <table className="w-full text-sm md:text-[14.5px] text-black border-none border-collapse text-left">
                  <tbody>
                    {participants.map((emp, index) => (
                      <React.Fragment key={`nd-p-list-${emp.id}-${index}`}>
                        {/* Nama Row */}
                        <tr className="break-inside-avoid">
                          <td className="w-8 font-bold align-top py-0 text-black" rowSpan={4}>
                            {index + 1}.
                          </td>
                          <td className="w-24 align-top py-0 text-black">Nama</td>
                          <td className="w-4 align-top py-0 text-center text-black">:</td>
                          <td className="align-top py-0 font-bold text-black">{emp.name}</td>
                        </tr>
                        {/* Pangkat/Gol Row */}
                        <tr className="break-inside-avoid">
                          <td className="align-top py-0 text-black">Pangkat/Gol</td>
                          <td className="align-top py-0 text-center text-black">:</td>
                          <td className="align-top py-0 text-black">{getFormattedPangkatGolongan(emp.pangkat)}</td>
                        </tr>
                        {/* NIP Row */}
                        <tr className="break-inside-avoid">
                          <td className="align-top py-0 text-black">NIP</td>
                          <td className="align-top py-0 text-center text-black">:</td>
                          <td className="align-top py-0 text-black">
                            {emp.nip !== "-" ? emp.nip : "Pramubakti / Non-ASN"}
                          </td>
                        </tr>
                        {/* Jabatan Row */}
                        <tr className="break-inside-avoid">
                          <td className="align-top py-0 text-black">Jabatan</td>
                          <td className="align-top py-0 text-center text-black">:</td>
                          <td className="align-top py-0 text-black">{emp.jabatan}</td>
                        </tr>
                        {/* Spacer row between participants */}
                        {index < participants.length - 1 && (
                          <tr>
                            <td colSpan={4} className="h-1.5"></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // 2. Traditional Matrix Table Format (Permendagri Style)
              <table className="table-participants w-full border-collapse border border-black my-4 text-sm md:text-[14px] text-black text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-1 text-center w-8 font-bold">No</th>
                    <th className="border border-black p-1.5 font-bold">Nama / NIP</th>
                    <th className="border border-black p-1.5 font-bold">Pangkat / Gol</th>
                    <th className="border border-black p-1.5 font-bold">Jabatan</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((emp, index) => (
                    <tr key={`nd-p-tab-${emp.id}-${index}`}>
                      <td className="border border-black p-1 text-center text-black">{index + 1}</td>
                      <td className="border border-black p-1 px-1.5">
                        <div className="font-bold text-black">{emp.name}</div>
                        <div className="text-[11px] text-slate-800 leading-none mt-0.5">
                          {emp.nip !== "-" ? `NIP: ${emp.nip}` : "Pramubakti / Non-ASN"}
                        </div>
                      </td>
                      <td className="border border-black p-1 px-1.5 text-black">{getFormattedPangkatGolongan(emp.pangkat)}</td>
                      <td className="border border-black p-1 px-1.5 text-black">{emp.jabatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BUDGET SUB-STATEMENT */}
            {useAnggaran && textAnggaran && (
              <p className="body-text text-justify text-black">
                {textAnggaran}
              </p>
            )}

            {/* CLOSING STATEMENT */}
            <p className="body-text text-justify text-black">
              {textPenutup}
            </p>
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="mt-8 flex justify-end break-inside-avoid">
            <div className="sig-container w-72 text-black text-sm md:text-[14.5px] text-left">
              <p className="m-0 leading-snug">{sigJabatan},</p>
              
              {/* Spaces for signature */}
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
              
              <p className="m-0 font-bold underline leading-snug">{sigNama}</p>
              <p className="m-0 leading-snug">{sigPangkat}</p>
              {sigNip && sigNip !== "-" && (
                <p className="m-0 leading-snug">NIP. {sigNip}</p>
              )}
            </div>
          </div>
          
          <div className="clear-both"></div>

        </div>
      </div>
    </div>
  );
}
