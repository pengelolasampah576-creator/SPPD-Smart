import React, { useState, useEffect } from "react";
import { Employee, Travel } from "../types";
import { Printer, FileBadge2, Settings } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";
import { getFormattedPangkatGolongan } from "../utils/pangkat";

interface DocumentSuratTugasProps {
  key?: React.Key;
  travel: Travel;
  employees: Employee[];
}

export default function DocumentSuratTugas({ travel, employees }: DocumentSuratTugasProps) {
  const signatory = employees.find(e => e.id === travel.signatoryId);
  const participants = travel.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

  const [showConfig, setShowConfig] = useState(false);
  const [formatType, setFormatType] = useState<"standar" | "naskah_baru">("standar");
  const [docFontFamily, setDocFontFamily] = useState<"Arial" | "Times New Roman">("Arial");
  const [docFontSize, setDocFontSize] = useState<"12pt" | "11pt" | "10pt" | "14px">("12pt");
  const [signSpecialCode, setSignSpecialCode] = useState("");
  const [signCodeCase, setSignCodeCase] = useState<"as-is" | "uppercase" | "lowercase">("as-is");
  const [signCodeSize, setSignCodeSize] = useState<"9px" | "11px" | "13px" | "15px">("11px");
  const [dasarList, setDasarList] = useState<string[]>([]);
  const [dasarTextFormatBaru, setDasarTextFormatBaru] = useState("");
  const [untukTextFormatBaru, setUntukTextFormatBaru] = useState("");
  const [issuedCity, setIssuedCity] = useState("Tanjung");

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

  const getDayNameIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return days[d.getDay()] || "";
    }
    return "";
  };

  // Helper to format proper case for inspector title/jabatan
  const formatProperJabatan = (jabatan?: string): string => {
    if (!jabatan) return "Inspektur Daerah";
    if (jabatan.toUpperCase() === jabatan) {
      return jabatan
        .toLowerCase()
        .split(/\s+/)
        .map(w => {
          if (["dan", "di", "ke", "dari", "pada"].includes(w)) return w;
          if (["skpd", "asn", "pns"].includes(w)) return w.toUpperCase();
          if (/^(i|ii|iii|iv|v|vi)$/i.test(w)) return w.toUpperCase();
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
    }
    return jabatan;
  };

  // Helper to format proper name with academic degrees preserved
  const formatProperName = (fullName?: string): string => {
    if (!fullName) return "";
    const parts = fullName.split(",");
    const baseName = parts[0].trim();
    const degrees = parts.slice(1).map(d => d.trim()).filter(Boolean);

    const formattedBase = baseName
      .split(/\s+/)
      .map(word => {
        const lower = word.toLowerCase();
        if (lower === "dr." || lower === "dr") return "Dr.";
        if (lower === "drs." || lower === "drs") return "Drs.";
        if (lower === "dra." || lower === "dra") return "Dra.";
        if (lower === "ir." || lower === "ir") return "Ir.";
        if (lower === "prof." || lower === "prof") return "Prof.";
        if (lower === "h." || lower === "h") return "H.";
        if (lower === "hj." || lower === "hj") return "Hj.";
        if (word.length === 0) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");

    if (degrees.length === 0) {
      return formattedBase;
    }

    const formattedDegrees = degrees.map(deg => {
      const clean = deg.trim();
      if (/^s\.?\s*sos\.?$/i.test(clean)) return "S.Sos";
      if (/^m\.?\s*si\.?$/i.test(clean)) return "M.Si";
      if (/^s\.?\s*kom\.?$/i.test(clean)) return "S.Kom";
      if (/^s\.?\s*pd\.?$/i.test(clean)) return "S.Pd";
      if (/^m\.?\s*pd\.?$/i.test(clean)) return "M.Pd";
      if (/^s\.?\s*ked\.?$/i.test(clean)) return "S.Ked";
      if (/^s\.?\s*kep\.?$/i.test(clean)) return "S.Kep";
      if (/^s\.?\s*pt\.?$/i.test(clean)) return "S.Pt";
      if (/^s\.?\s*hut\.?$/i.test(clean)) return "S.Hut";
      if (/^s\.?\s*st\.?$/i.test(clean)) return "S.ST";
      if (/^s\.?\s*tr\.?$/i.test(clean)) return "S.Tr";
      if (/^frmp$/i.test(clean)) return "FRMP";
      if (/^cpa$/i.test(clean)) return "CPA";
      if (/^ca$/i.test(clean)) return "CA";
      if (/^cia$/i.test(clean)) return "CIA";
      if (/^qia$/i.test(clean)) return "QIA";
      if (/^cgcae$/i.test(clean)) return "CGCAE";
      if (/[a-z]/.test(clean) && /[A-Z]/.test(clean)) return clean;
      return clean.toUpperCase();
    });

    return `${formattedBase}, ${formattedDegrees.join(", ")}`;
  };

  const defaultDasarTextBaru = `Nota Dinas ${formatProperName(signatory?.name || "Diyanto, SE, MT, FRMP")} (${formatProperJabatan(signatory?.jabatan || "Inspektur Daerah")}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`;

  const defaultUntukTextBaru = `Melaksanakan Perjalanan Dinas dalam rangka: "${travel.purpose}" pada hari ${getDayNameIndo(travel.departureDate)}, ${formatIndoDate(travel.departureDate)}${travel.departureDate !== travel.returnDate ? ` s.d ${formatIndoDate(travel.returnDate)}` : ""} bertempat di ${travel.destination}.`;

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

  const [prevTravelId, setPrevTravelId] = useState<string | null>(null);

  // Synchronize dasarList with current travel notaNumber, notaDate, and destination
  useEffect(() => {
    setDasarList(prev => {
      const notaDinasText = `Nota Dinas ${formatProperName(signatory?.name || "Diyanto, SE, MT, FRMP")} (${formatProperJabatan(signatory?.jabatan || "Inspektur")}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`;
      const hasNota = prev.some(d => d.startsWith("Nota Dinas"));
      if (hasNota) {
        return prev.map(d => d.startsWith("Nota Dinas") ? notaDinasText : d);
      }
      return prev;
    });
  }, [travel.notaNumber, travel.notaDate, travel.destination, signatory?.name, signatory?.jabatan]);

  // Synchronize or initialize default Dasar lists based on active travel and signatory configuration
  useEffect(() => {
    if (travel.id !== prevTravelId) {
      setPrevTravelId(travel.id);

      // Try to load cached values from localStorage
      const cacheKey = `sppd_doc_surattugas_cache_${travel.id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.formatType !== undefined) setFormatType(data.formatType);
          if (data.dasarTextFormatBaru !== undefined) setDasarTextFormatBaru(data.dasarTextFormatBaru);
          if (data.untukTextFormatBaru !== undefined) setUntukTextFormatBaru(data.untukTextFormatBaru);
          if (data.issuedCity !== undefined) setIssuedCity(data.issuedCity);
          if (data.dasarList !== undefined && Array.isArray(data.dasarList)) {
            // Update the Nota Dinas entry with current travel values
            const notaDinasText = `Nota Dinas ${formatProperName(signatory?.name || "Diyanto, SE, MT, FRMP")} (${formatProperJabatan(signatory?.jabatan || "Inspektur")}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`;
            const syncedList = data.dasarList.map((d: string) => d.startsWith("Nota Dinas") ? notaDinasText : d);
            setDasarList(syncedList);
          }
          if (data.signSpecialCode !== undefined) setSignSpecialCode(data.signSpecialCode);
          if (data.signCodeCase !== undefined) setSignCodeCase(data.signCodeCase);
          if (data.signCodeSize !== undefined) setSignCodeSize(data.signCodeSize);
          if (data.docFontFamily !== undefined) setDocFontFamily(data.docFontFamily);
          if (data.docFontSize !== undefined) setDocFontSize(data.docFontSize);
          return;
        } catch (e) {
          console.error("Error parsing cached Surat Tugas", e);
        }
      }

      setFormatType("standar");
      setIssuedCity("Tanjung");
      setDasarTextFormatBaru(
        `Nota Dinas ${formatProperName(signatory?.name || "Diyanto, SE, MT, FRMP")} (${formatProperJabatan(signatory?.jabatan || "Inspektur Daerah")}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`
      );
      setUntukTextFormatBaru(
        `Melaksanakan Perjalanan Dinas dalam rangka: "${travel.purpose}" pada hari ${getDayNameIndo(travel.departureDate)}, ${formatIndoDate(travel.departureDate)}${travel.departureDate !== travel.returnDate ? ` s.d ${formatIndoDate(travel.returnDate)}` : ""} bertempat di ${travel.destination}.`
      );
      setDasarList([
        "Peraturan Daerah Kabupaten Tabalong Nomor 3 Tahun 2021 tentang Organisasi dan Tata Kerja Inspektorat Daerah Kabupaten Tabalong.",
        `Nota Dinas ${formatProperName(signatory?.name || "Diyanto, SE, MT, FRMP")} (${formatProperJabatan(signatory?.jabatan || "Inspektur")}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`
      ]);
    }
  }, [travel.id, travel.notaNumber, travel.notaDate, travel.destination, travel.purpose, travel.departureDate, travel.returnDate, signatory?.id, signatory?.name, signatory?.jabatan, prevTravelId]);

  // Save changes to localStorage on any state change
  useEffect(() => {
    if (!travel.id) return;
    const cacheKey = `sppd_doc_surattugas_cache_${travel.id}`;
    const data = {
      formatType,
      dasarTextFormatBaru,
      untukTextFormatBaru,
      issuedCity,
      dasarList,
      signSpecialCode,
      signCodeCase,
      signCodeSize,
      docFontFamily,
      docFontSize
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  }, [travel.id, formatType, dasarTextFormatBaru, untukTextFormatBaru, issuedCity, dasarList, signSpecialCode, signCodeCase, signCodeSize, docFontFamily, docFontSize]);

  // Helper to split a combined text entry into a list of individual cleaned legal references
  const getFlattenedDasarList = () => {
    const flattened: string[] = [];
    
    dasarList.forEach(item => {
      if (!item) return;
      
      let cleanItem = item.trim();
      
      // Check if item has embedded numbers like "2. ", "3. " or "; 2. "
      const embeddedRegex = /(?:;\s*|\s+|^)\b(\d+)[\.\)]\s+/g;
      const matches = [...cleanItem.matchAll(embeddedRegex)];
      const hasEmbeddedNumbers = matches.some(match => {
        const num = parseInt(match[1], 10);
        return num >= 2;
      });
      
      if (hasEmbeddedNumbers) {
        const splitIndices: { index: number; num: number; length: number }[] = [];
        embeddedRegex.lastIndex = 0;
        let match;
        while ((match = embeddedRegex.exec(cleanItem)) !== null) {
          const num = parseInt(match[1], 10);
          if (num > 1) { // Only split on 2, 3, etc.
            splitIndices.push({
              index: match.index,
              num: num,
              length: match[0].length
            });
          }
        }
        
        splitIndices.sort((a, b) => a.index - b.index);
        
        if (splitIndices.length > 0) {
          // Add first segment
          let firstText = cleanItem.substring(0, splitIndices[0].index).trim();
          const leadingNumRegex = /^\d+[\.\)]\s*/;
          if (leadingNumRegex.test(firstText)) {
            firstText = firstText.replace(leadingNumRegex, "");
          }
          if (firstText) {
            flattened.push(firstText);
          }
          
          // Add middle segments
          for (let i = 0; i < splitIndices.length; i++) {
            const start = splitIndices[i].index + splitIndices[i].length;
            const end = i < splitIndices.length - 1 ? splitIndices[i + 1].index : cleanItem.length;
            let text = cleanItem.substring(start, end).trim();
            if (leadingNumRegex.test(text)) {
              text = text.replace(leadingNumRegex, "");
            }
            if (text) {
              flattened.push(text);
            }
          }
        } else {
          flattened.push(cleanItem);
        }
      } else {
        flattened.push(cleanItem);
      }
    });
    
    return flattened;
  };

  // Helper to format/beautify long or manual list items to look neat
  const renderFormattedDasarItem = (item: string) => {
    if (!item) return null;

    let cleanItem = item.trim();
    const leadingNumRegex = /^\d+[\.\)]\s*/;
    if (leadingNumRegex.test(cleanItem)) {
      cleanItem = cleanItem.replace(leadingNumRegex, "");
    }

    return (
      <span 
        className="text-justify block text-slate-900 leading-relaxed"
        style={{
          fontFamily: docFontFamily === "Arial" ? "Arial, 'Helvetica Neue', Helvetica, sans-serif" : '"Times New Roman", Times, serif',
          fontSize: docFontSize
        }}
      >
        {cleanItem}
      </span>
    );
  };

  const handlePrint = () => {
    const docContainer = document.getElementById("surat-tugas-printable");
    if (docContainer) {
      // Clone the element to avoid mutating live screen DOM
      const clone = docContainer.cloneNode(true) as HTMLElement;
      
      // Remove any print-hidden or print:hidden elements
      const hiddenElements = clone.querySelectorAll(".print-hidden, .print\\:hidden, [class*='print-hidden'], [class*='print:hidden']");
      hiddenElements.forEach(el => el.remove());

      const fontCssFamily = docFontFamily === "Arial" 
        ? "Arial, 'Helvetica Neue', Helvetica, sans-serif" 
        : '"Times New Roman", Times, serif';

      const printContent = clone.innerHTML;
      const printWindow = window.open("", "", "height=800,width=700");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Surat Tugas - ${travel.taskLetterNumber.replace(/\//g, '_')}</title>
              <style>
                body {
                  font-family: ${fontCssFamily};
                  font-size: ${docFontSize};
                  line-height: 1.5;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  padding: 40px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-justify { text-align: justify; }
                .font-bold { font-weight: normal !important; }
                .uppercase { text-transform: uppercase; }
                
                /* Letterhead Kop */
                .kop-header {
                  position: relative;
                  border-bottom: 4px double #000;
                  padding-bottom: 12px;
                  margin-bottom: 25px;
                  text-align: center;
                  min-height: 85px;
                  display: block;
                  font-family: ${fontCssFamily};
                }
                .kop-logo-container {
                  position: absolute;
                  left: 0;
                  top: 50%;
                  transform: translateY(-50%);
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
                  text-align: center;
                  display: block;
                  width: 100%;
                  box-sizing: border-box;
                }
                .kop-pemkab {
                  font-size: 16px;
                  font-weight: normal;
                  letter-spacing: 1px;
                  margin: 0;
                }
                .kop-instansi {
                  font-size: 21px;
                  font-weight: normal;
                  letter-spacing: 0.5px;
                  margin: 0;
                  margin-top: 4px;
                }
                .kop-alamat {
                  font-size: 11px;
                  margin: 0;
                  margin-top: 4px;
                }
                .kop-laman {
                  font-size: 11px;
                  margin: 0;
                  margin-top: 2px;
                }
                
                /* title */
                .doc-title {
                  font-size: 18px;
                  font-weight: normal;
                  text-decoration: underline;
                  margin-top: 15px;
                  margin-bottom: 4px;
                }
                .doc-subtitle {
                  font-size: ${docFontSize};
                  margin-bottom: 25px;
                }
                
                /* Dasar Block */
                .dasar-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: ${docFontSize};
                  font-family: ${fontCssFamily};
                }
                .dasar-table td {
                  padding: 4px 6px;
                  vertical-align: top;
                }
                
                /* Memerintahkan */
                .memperin {
                  font-size: 15px;
                  font-weight: normal;
                  letter-spacing: 1px;
                  text-align: center;
                  margin: 12px 0 10px 0;
                }

                /* Participants */
                .participants-list-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 12px;
                  font-size: ${docFontSize};
                  font-family: ${fontCssFamily};
                }
                .participants-list-table td {
                  padding: 3px 4px;
                  vertical-align: top;
                }

                /* Goals / Untuk */
                .untuk-list {
                  margin-left: 20px;
                  padding-left: 0;
                  font-size: ${docFontSize};
                  text-align: justify;
                  font-family: ${fontCssFamily};
                }
                .untuk-list li {
                  margin-bottom: 8px;
                }
                
                /* Signature block */
                .sig-container {
                  margin-top: 40px;
                  float: right;
                  width: 280px;
                  font-size: ${docFontSize};
                  font-family: ${fontCssFamily};
                  text-align: left;
                }
                .sig-box {
                  min-height: 95px;
                  height: auto;
                  margin-bottom: 12px;
                }
                
                .whitespace-nowrap { white-space: nowrap !important; }
                .format-baru-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 16px;
                  font-size: ${docFontSize};
                  font-family: ${fontCssFamily};
                }
                .format-baru-table td {
                  padding: 3px 0;
                  vertical-align: top;
                }
                .format-baru-memperin {
                  font-size: 14px;
                  font-weight: normal;
                  letter-spacing: 0.5px;
                  text-align: center;
                  margin: 18px 0 16px 0;
                }

                @media print {
                  body { padding: 20px; }
                  @page { size: portrait; margin: 2cm; }
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
        }, 300);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <FileBadge2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Format Surat Tugas:</span>
          </span>
          {/* Format selector buttons */}
          <div className="flex items-center bg-slate-200/90 p-1 rounded-xl border border-slate-300">
            <button
              type="button"
              onClick={() => setFormatType("standar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                formatType === "standar"
                  ? "bg-white text-blue-700 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Format Standar (Lama)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatType("naskah_baru")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                formatType === "naskah_baru"
                  ? "bg-white text-emerald-700 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Format Baru (Naskah Dinas)</span>
            </button>
          </div>
        </div>
        
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
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Surat Tugas
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-fadeIn">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-500" />
              Kontrol Redaksi & Tata Letak Surat Tugas
            </h4>
          </div>

          {/* PILIHAN FORMAT DI PENGATURAN */}
          <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
            <label className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">
              Pilihan Format Dokumen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormatType("standar")}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  formatType === "standar"
                    ? "bg-blue-50 border-blue-400 text-blue-900"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold text-xs">Format Standar (Lama)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Dasar berbutir angka, tabel penugasan, dan butir instruksi 5 poin.</div>
              </button>

              <button
                type="button"
                onClick={() => setFormatType("naskah_baru")}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  formatType === "naskah_baru"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Format Baru (Naskah Dinas)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tata letak naratif sesuai contoh perbup/undangan, kolom rata, ringkas dan rapi.</div>
              </button>
            </div>
          </div>

          {/* KHUSUS FORMAT BARU: EDIT REDAKSI DASAR & UNTUK */}
          {formatType === "naskah_baru" && (
            <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                <label className="text-[10px] text-emerald-800 font-extrabold block uppercase tracking-wider">
                  Pengaturan Khusus Format Baru
                </label>
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded">
                  Sesuai Contoh Naskah
                </span>
              </div>

              {/* DASAR FORMAT BARU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-700">Teks Dasar:</label>
                  <button
                    type="button"
                    onClick={() => setDasarTextFormatBaru(defaultDasarTextBaru)}
                    className="text-[9px] text-blue-600 hover:underline cursor-pointer font-medium"
                  >
                    Reset ke Standar Nota Dinas
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={dasarTextFormatBaru}
                  onChange={(e) => setDasarTextFormatBaru(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Pendampingan Pengisian Data Gender dan Anak Nomor..."
                  className="w-full text-xs p-2 bg-white border border-emerald-250 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* UNTUK FORMAT BARU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-700">Teks Untuk:</label>
                  <button
                    type="button"
                    onClick={() => setUntukTextFormatBaru(defaultUntukTextBaru)}
                    className="text-[9px] text-blue-600 hover:underline cursor-pointer font-medium"
                  >
                    Reset ke Standar Perjalanan Dinas
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={untukTextFormatBaru}
                  onChange={(e) => setUntukTextFormatBaru(e.target.value)}
                  placeholder="Contoh: Menghadiri Rapat sesuai tersebut di atas pada hari Selasa, 22 September 2026 di..."
                  className="w-full text-xs p-2 bg-white border border-emerald-250 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* TEMPAT DIKELUARKAN */}
              <div className="w-full sm:w-1/2">
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Kota Dikeluarkan:</label>
                <input
                  type="text"
                  value={issuedCity}
                  onChange={(e) => setIssuedCity(e.target.value)}
                  placeholder="Tanjung"
                  className="w-full text-xs p-2 bg-white border border-emerald-250 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* EDIT REDAKSI DASAR SURAT TUGAS (KHUSUS FORMAT STANDAR) */}
          {formatType === "standar" && (
            <div className="bg-white p-4 rounded-lg border border-slate-150 space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <label className="text-[10px] text-blue-600 font-extrabold block uppercase tracking-wider">
                  Edit Redaksi Dasar Surat Tugas (Format Standar)
                </label>
                <button
                  type="button"
                  onClick={() => setDasarList([...dasarList, ""])}
                  className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-100 transition cursor-pointer"
                >
                  + Tambah Dasar Hukum/Nota
                </button>
              </div>
              
              <div className="space-y-3">
                {dasarList.map((item, index) => (
                  <div key={`edit-dasar-${index}`} className="flex flex-col gap-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-slate-500">Dasar Poin {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const newList = [...dasarList];
                            const temp = newList[index];
                            newList[index] = newList[index - 1];
                            newList[index - 1] = temp;
                            setDasarList(newList);
                          }}
                          className="text-[9px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          title="Geser ke atas"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === dasarList.length - 1}
                          onClick={() => {
                            const newList = [...dasarList];
                            const temp = newList[index];
                            newList[index] = newList[index + 1];
                            newList[index + 1] = temp;
                            setDasarList(newList);
                          }}
                          className="text-[9px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          title="Geser ke bawah"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newList = dasarList.filter((_, i) => i !== index);
                            setDasarList(newList);
                          }}
                          className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="Hapus"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) => {
                        const newList = [...dasarList];
                        newList[index] = e.target.value;
                        setDasarList(newList);
                      }}
                      placeholder={`Ketik dasar poin ${index + 1} di sini...`}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
                {dasarList.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic text-center py-2 animate-pulse">
                    Belum ada poin dasar. Klik "+ Tambah Dasar Hukum/Nota" di atas untuk menambahkan.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
            <label className="text-[10px] text-emerald-600 font-bold block uppercase tracking-wider">KODE KHUSUS TANDA TANGAN (DI ANTARA JABATAN & NAMA)</label>
            <textarea
              rows={4}
              value={signSpecialCode}
              onChange={(e) => setSignSpecialCode(e.target.value)}
              placeholder="Contoh: Kode Khusus (Gunakan Enter, Spasi, atau Backspace untuk memindahkan lokasinya)"
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

          {/* STANDARISASI HURUF (FONT & UKURAN) */}
          <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
            <label className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">Jenis & Ukuran Huruf (Font)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-500 block font-bold uppercase mb-0.5">Jenis Huruf</label>
                <select
                  value={docFontFamily}
                  onChange={(e) => setDocFontFamily(e.target.value as any)}
                  className="w-full text-xs p-1.5 border border-slate-250 rounded bg-slate-50 font-medium"
                >
                  <option value="Arial">Arial (Sesuai Permintaan)</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block font-bold uppercase mb-0.5">Ukuran Huruf</label>
                <select
                  value={docFontSize}
                  onChange={(e) => setDocFontSize(e.target.value as any)}
                  className="w-full text-xs p-1.5 border border-slate-250 rounded bg-slate-50 font-medium"
                >
                  <option value="12pt">Ukuran 12 (12pt Standar)</option>
                  <option value="11pt">Ukuran 11 (11pt)</option>
                  <option value="10pt">Ukuran 10 (10pt)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SHEET */}
      <div className="border border-slate-300 p-8 md:p-12 bg-white max-w-3xl mx-auto shadow-sm select-text overflow-x-auto min-w-[320px]">
        <div 
          id="surat-tugas-printable" 
          className="text-black leading-relaxed max-w-[650px] mx-auto bg-white"
          style={{
            fontFamily: docFontFamily === "Arial" ? "Arial, 'Helvetica Neue', Helvetica, sans-serif" : '"Times New Roman", Times, serif',
            fontSize: docFontSize,
            lineHeight: "1.5"
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            #surat-tugas-printable, #surat-tugas-printable * {
              font-family: ${docFontFamily === "Arial" ? "Arial, 'Helvetica Neue', Helvetica, sans-serif" : '"Times New Roman", Times, serif'} !important;
            }
            #surat-tugas-printable td, 
            #surat-tugas-printable p:not(.kop-pemkab):not(.kop-instansi):not(.kop-alamat):not(.kop-laman):not(.doc-title), 
            #surat-tugas-printable li, 
            #surat-tugas-printable ol,
            #surat-tugas-printable .doc-subtitle,
            #surat-tugas-printable .sig-container {
              font-size: ${docFontSize} !important;
            }
          ` }} />
          
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
              <h1 className="kop-pemkab text-base md:text-lg font-normal tracking-wide uppercase m-0 leading-tight">
                PEMERINTAH KABUPATEN TABALONG
              </h1>
              <h2 className="kop-instansi text-lg md:text-2xl font-normal tracking-normal uppercase m-0 leading-tight mt-1">
                INSPEKTORAT DAERAH
              </h2>
              <p className="kop-alamat text-[11px] text-slate-850 m-0 mt-1 leading-normal animate-fadeIn">
                Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513
              </p>
              <p className="kop-laman text-[11px] text-slate-850 m-0 mt-0.5 leading-normal animate-fadeIn">
                Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id
              </p>
            </div>
          </div>

          {formatType === "standar" ? (
            /* FORMAT STANDAR (LAMA) */
            <>
              {/* TITLE */}
              <div className="text-center mb-6">
                <h3 className="doc-title text-base md:text-lg font-normal uppercase underline tracking-wide m-0">
                  SURAT TUGAS
                </h3>
                <p className="doc-subtitle text-xs md:text-sm m-0 mt-1">
                  NOMOR: {travel.taskLetterNumber}
                </p>
              </div>

              {/* DASAR / BACKGROUND */}
              <table className="dasar-table w-full text-xs md:text-sm border-collapse select-text">
                <tbody>
                  <tr>
                    <td className="w-16 md:w-20 py-1">Dasar</td>
                    <td className="w-3 py-1">:</td>
                    <td className="py-1 text-justify">
                      <ol className="list-decimal list-outside ml-4 p-0 space-y-2 text-justify text-slate-900">
                        {getFlattenedDasarList().map((item, index) => (
                          <li key={`st-dasar-${index}`}>
                            {renderFormattedDasarItem(item)}
                          </li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* MEMERINTAHKAN SECTION */}
              <div className="memperin text-center font-normal tracking-widest text-slate-900 border-y border-stone-300 py-1 my-4 text-sm">
                M E M E R I N T A H K A N :
              </div>

              {/* KEPADA SECTION */}
              <table className="participants-list-table w-full text-xs md:text-sm select-text">
                <tbody>
                  <tr>
                    <td className="w-16 md:w-20 py-1 align-top text-black">Kepada</td>
                    <td className="w-3 py-1 align-top text-black">:</td>
                    <td className="py-1">
                      <table className="w-full text-xs md:text-sm text-black border-none border-collapse text-left">
                        <tbody>
                          {participants.map((emp, index) => (
                            <React.Fragment key={`st-p-${emp.id}-${index}`}>
                              {/* Nama Row */}
                              <tr className="break-inside-avoid">
                                <td className="w-6 align-top py-0.5 text-black" rowSpan={4}>
                                  {index + 1}.
                                </td>
                                 <td className="w-32 align-top py-0 text-black">Nama</td>
                                <td className="w-4 align-top py-0 text-center text-black">:</td>
                                <td className="align-top py-0 text-black">{formatProperName(emp.name)}</td>
                              </tr>
                              {/* NIP Row */}
                              <tr className="break-inside-avoid">
                                <td className="align-top py-0 text-black">NIP</td>
                                <td className="align-top py-0 text-center text-black">:</td>
                                <td className="align-top py-0 font-mono text-black">
                                  {emp.nip !== "-" ? emp.nip : "-"}
                                </td>
                              </tr>
                              {/* Pangkat/Gol Row */}
                              <tr className="break-inside-avoid">
                                <td className="align-top py-0 text-black">Pangkat/Golongan</td>
                                <td className="align-top py-0 text-center text-black">:</td>
                                <td className="align-top py-0 text-black">
                                  {emp.pangkat !== "-" ? getFormattedPangkatGolongan(emp.pangkat) : "Non-Eselon / Non-ASN"}
                                </td>
                              </tr>
                              {/* Jabatan Row */}
                              <tr className="break-inside-avoid">
                                <td className="align-top py-0 text-black">Jabatan</td>
                                <td className="align-top py-0 text-center text-black">:</td>
                                <td className="align-top py-0 text-black">{formatProperJabatan(emp.jabatan)}</td>
                              </tr>
                              {/* Spacer row between participants */}
                              {index < participants.length - 1 && (
                                <tr>
                                  <td colSpan={4} className="h-1.5 border-b border-dashed border-stone-200"></td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* UNTUK SECTION */}
              <table className="dasar-table w-full text-xs md:text-sm border-collapse select-text">
                <tbody>
                  <tr>
                    <td className="w-16 md:w-20 py-2">Untuk</td>
                    <td className="w-3 py-2">:</td>
                    <td className="py-2">
                      <ol className="list-decimal list-outside ml-4 p-0 space-y-2 text-justify text-slate-900">
                        <li>
                          Melaksanakan Perjalanan Dinas dalam rangka: "{travel.purpose}".
                        </li>
                        <li>
                          Tujuan perjalanan dinas bertempat di {travel.destination}, berlokasi kedudukan awal di {travel.departurePlace}.
                        </li>
                        <li>
                          Tugas ini dilaksanakan selama {durationDays} hari kerja {travel.customDates && travel.customDates.length > 0 ? (
                            <>
                              yaitu pada tanggal{" "}
                              <span>
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
                              terhitung mulai tanggal {formatIndoDate(travel.departureDate)} s.d {formatIndoDate(travel.returnDate)}
                            </>
                          )} dengan mengendarai angkutan {travel.transportMode}.
                        </li>
                        <li>
                          Melaporkan secara tertulis pertanggungjawaban hasil pelaksanaan dinas dan mengumpulkan rincian biaya kepada Inspektur Daerah Kabupaten Tabalong melalui PPK setibanya kembali.
                        </li>
                        <li>
                          Segala biaya yang timbul akibat diterbitkannya Surat Tugas ini dibebankan pada APBD Kabupaten Tabalong melalui anggaran SKPD Inspektorat Daerah Kabupaten Tabalong, kode anggaran: <span className="font-mono text-xs bg-slate-50 p-0.5">{travel.budgetCode}</span>.
                        </li>
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SIGNATURE BLOCK */}
              <div className="mt-12 flex flex-col items-end break-inside-avoid">
                <div className="sig-container w-64 text-xs md:text-sm text-slate-900 text-left">
                  <p className="m-0 text-left">Dikeluarkan di : Tabalong</p>
                  <p className="m-0 text-left border-b border-black pb-1">Pada Tanggal : {formatIndoDate(travel.taskLetterDate)}</p>
                  
                  <div className="mt-3 text-left">
                    <p className="m-0 text-left">{formatProperJabatan(signatory?.jabatan || "Inspektur Daerah")},</p>
                    <div className="sig-box min-h-[110px] flex flex-col justify-center my-2" style={{ minHeight: '110px', height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {signSpecialCode ? (
                        <p className="m-0 font-mono text-slate-800 text-left" style={{ fontSize: signCodeSize, lineHeight: '1.2', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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
                    <p className="m-0 text-left" style={{ textDecoration: 'none' }}>{formatProperName(signatory?.name || "Diyanto, SE, MT")}</p>
                    {signatory?.nip && signatory.nip !== "-" && (
                      <p className="m-0 text-left text-xs">
                        Pangkat {getFormattedPangkatGolongan(signatory.pangkat)} <br/>
                        NIP {signatory.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="clear-both"></div>
            </>
          ) : (
            /* FORMAT BARU (SESUAI CONTOH NASKAH DINAS / PERBUP) */
            <>
              {/* TITLE */}
              <div className="text-center mb-6">
                <h3 className="doc-title text-base md:text-lg font-normal uppercase tracking-wide m-0" style={{ textDecoration: 'none' }}>
                  SURAT TUGAS
                </h3>
                <p className="doc-subtitle text-xs md:text-sm m-0 mt-1">
                  Nomor : {travel.taskLetterNumber}
                </p>
              </div>

              {/* DASAR SECTION */}
              <table className="w-full text-xs md:text-sm border-collapse select-text mb-4" style={{ fontFamily: 'inherit' }}>
                <tbody>
                  <tr>
                    <td className="align-top py-1 text-black whitespace-nowrap" style={{ width: '80px' }}>Dasar</td>
                    <td className="align-top py-1 text-center text-black" style={{ width: '20px' }}>:</td>
                    <td className="align-top py-1 text-justify text-black leading-relaxed">
                      {dasarTextFormatBaru || defaultDasarTextBaru}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* MEMERINTAHKAN SECTION */}
              <div className="text-center font-normal tracking-wide text-black my-5 text-xs md:text-sm">
                MEMERINTAHKAN :
              </div>

              {/* KEPADA SECTION */}
              <table className="w-full text-xs md:text-sm border-collapse select-text mb-4" style={{ fontFamily: 'inherit' }}>
                <tbody>
                  <tr>
                    <td className="align-top py-1 text-black whitespace-nowrap" style={{ width: '80px' }}>Kepada</td>
                    <td className="align-top py-1 text-center text-black" style={{ width: '20px' }}>:</td>
                    <td className="align-top py-1">
                      <table className="w-full text-xs md:text-sm text-black border-none border-collapse text-left">
                        <tbody>
                          {participants.map((emp, index) => (
                            <React.Fragment key={`new-p-${emp.id}-${index}`}>
                              {/* 1. Nama */}
                              <tr>
                                <td className="align-top py-0.5 text-black" style={{ width: '24px' }}>
                                  {participants.length > 1 ? `${index + 1}.` : "1."}
                                </td>
                                <td className="align-top py-0.5 text-black whitespace-nowrap" style={{ width: '135px' }}>
                                  Nama
                                </td>
                                <td className="align-top py-0.5 text-center text-black" style={{ width: '16px' }}>:</td>
                                <td className="align-top py-0.5 text-black">{formatProperName(emp.name)}</td>
                              </tr>
                              {/* Pangkat/Golongan */}
                              <tr>
                                <td className="align-top py-0.5 text-black"></td>
                                <td className="align-top py-0.5 text-black whitespace-nowrap">
                                  Pangkat/Golongan
                                </td>
                                <td className="align-top py-0.5 text-center text-black">:</td>
                                <td className="align-top py-0.5 text-black">
                                  {emp.pangkat !== "-" ? getFormattedPangkatGolongan(emp.pangkat) : "Non-Eselon / Non-ASN"}
                                </td>
                              </tr>
                              {/* NIP */}
                              <tr>
                                <td className="align-top py-0.5 text-black"></td>
                                <td className="align-top py-0.5 text-black whitespace-nowrap">
                                  NIP
                                </td>
                                <td className="align-top py-0.5 text-center text-black">:</td>
                                <td className="align-top py-0.5 font-mono text-black">
                                  {emp.nip !== "-" ? emp.nip : "-"}
                                </td>
                              </tr>
                              {/* Jabatan */}
                              <tr>
                                <td className="align-top py-0.5 text-black"></td>
                                <td className="align-top py-0.5 text-black whitespace-nowrap">
                                  Jabatan
                                </td>
                                <td className="align-top py-0.5 text-center text-black">:</td>
                                <td className="align-top py-0.5 text-black">{formatProperJabatan(emp.jabatan)}</td>
                              </tr>
                              {index < participants.length - 1 && (
                                <tr>
                                  <td colSpan={4} className="h-3 border-b border-dashed border-stone-200"></td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* UNTUK SECTION */}
              <table className="w-full text-xs md:text-sm border-collapse select-text mb-6" style={{ fontFamily: 'inherit' }}>
                <tbody>
                  <tr>
                    <td className="align-top py-1 text-black whitespace-nowrap" style={{ width: '80px' }}>Untuk</td>
                    <td className="align-top py-1 text-center text-black" style={{ width: '20px' }}>:</td>
                    <td className="align-top py-1 text-justify text-black leading-relaxed">
                      {untukTextFormatBaru || defaultUntukTextBaru}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SIGNATURE BLOCK (SESUAI CONTOH KANAN RATA KIRI) */}
              <div className="mt-10 flex flex-col items-end break-inside-avoid">
                <div className="sig-container w-72 text-xs md:text-sm text-black text-left">
                  <table className="border-none border-collapse mb-2 text-xs md:text-sm w-full text-left" style={{ fontFamily: 'inherit' }}>
                    <tbody>
                      <tr>
                        <td className="py-0.5 pr-1 text-left whitespace-nowrap" style={{ width: '105px' }}>Dikeluarkan di</td>
                        <td className="py-0.5 px-2 text-center" style={{ width: '15px' }}>:</td>
                        <td className="py-0.5 text-left">{issuedCity}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 pr-1 text-left whitespace-nowrap">Pada tanggal</td>
                        <td className="py-0.5 px-2 text-center">:</td>
                        <td className="py-0.5 text-left">{formatIndoDate(travel.taskLetterDate)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-3 text-left">
                    <p className="m-0 text-left leading-tight">{formatProperJabatan(signatory?.jabatan || "Inspektur Daerah")},</p>
                    
                    <div className="sig-box min-h-[95px] flex flex-col justify-center my-2" style={{ minHeight: '95px', height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {signSpecialCode ? (
                        <p className="m-0 font-mono text-slate-800 text-left" style={{ fontSize: signCodeSize, lineHeight: '1.2', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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

                    <p className="m-0 text-left leading-tight" style={{ textDecoration: 'none' }}>{formatProperName(signatory?.name || "Diyanto, SE, MT")}</p>
                    <p className="m-0 text-left leading-tight text-xs mt-0.5">
                      {getFormattedPangkatGolongan(signatory?.pangkat || "Pembina Utama Muda (IV/c)")}
                    </p>
                    {signatory?.nip && signatory.nip !== "-" && (
                      <p className="m-0 text-left leading-tight text-xs mt-0.5">
                        NIP {signatory.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="clear-both"></div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
