import React, { useState, useEffect } from "react";
import { Employee, Travel } from "../types";
import { Printer, FileBadge2, Settings } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";
import { getFormattedPangkatGolongan } from "../utils/pangkat";

interface DocumentSuratTugasProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentSuratTugas({ travel, employees }: DocumentSuratTugasProps) {
  const signatory = employees.find(e => e.id === travel.signatoryId);
  const participants = travel.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

  const [showConfig, setShowConfig] = useState(false);
  const [signSpecialCode, setSignSpecialCode] = useState("");
  const [signCodeCase, setSignCodeCase] = useState<"as-is" | "uppercase" | "lowercase">("as-is");
  const [signCodeSize, setSignCodeSize] = useState<"9px" | "11px" | "13px" | "15px">("11px");
  const [dasarList, setDasarList] = useState<string[]>([]);

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

  const [prevTravelId, setPrevTravelId] = useState<string | null>(null);

  // Synchronize or initialize default Dasar lists based on active travel and signatory configuration
  useEffect(() => {
    if (travel.id !== prevTravelId) {
      setPrevTravelId(travel.id);
      setDasarList([
        "Peraturan Daerah Kabupaten Tabalong Nomor 3 Tahun 2021 tentang Organisasi dan Tata Kerja Inspektorat Daerah Kabupaten Tabalong.",
        `Nota Dinas ${signatory?.name || "DIYANTO, SE, MT, FRMP"} (${signatory?.jabatan || "Inspektur"}) Inspektorat Daerah Kabupaten Tabalong Nomor ${travel.notaNumber || ""} tanggal ${formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas ${travel.destination || ""}.`
      ]);
    }
  }, [travel.id, travel.notaNumber, travel.notaDate, travel.destination, signatory?.id, signatory?.name, signatory?.jabatan, prevTravelId]);

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

    return <span className="text-justify block text-slate-900 leading-relaxed font-serif">{cleanItem}</span>;
  };

  const handlePrint = () => {
    const docContainer = document.getElementById("surat-tugas-printable");
    if (docContainer) {
      // Clone the element to avoid mutating live screen DOM
      const clone = docContainer.cloneNode(true) as HTMLElement;
      
      // Remove any print-hidden or print:hidden elements
      const hiddenElements = clone.querySelectorAll(".print-hidden, .print\\:hidden, [class*='print-hidden'], [class*='print:hidden']");
      hiddenElements.forEach(el => el.remove());

      const printContent = clone.innerHTML;
      const printWindow = window.open("", "", "height=800,width=700");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Surat Tugas - ${travel.taskLetterNumber.replace(/\//g, '_')}</title>
              <style>
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.5;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  padding: 40px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-justify { text-align: justify; }
                .font-bold { font-weight: bold; }
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
                  font-weight: bold;
                  letter-spacing: 1px;
                  margin: 0;
                }
                .kop-instansi {
                  font-size: 21px;
                  font-weight: bold;
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
                  font-weight: bold;
                  text-decoration: underline;
                  margin-top: 15px;
                  margin-bottom: 4px;
                }
                .doc-subtitle {
                  font-size: 14px;
                  margin-bottom: 25px;
                }
                
                /* Dasar Block */
                .dasar-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: 14px;
                }
                .dasar-table td {
                  padding: 4px 6px;
                  vertical-align: top;
                }
                
                /* Memerintahkan */
                .memperin {
                  font-size: 15px;
                  font-weight: bold;
                  letter-spacing: 1px;
                  text-align: center;
                  margin: 12px 0 10px 0;
                }

                /* Participants */
                .participants-list-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 12px;
                  font-size: 14px;
                }
                .participants-list-table td {
                  padding: 3px 4px;
                  vertical-align: top;
                }

                /* Goals / Untuk */
                .untuk-list {
                  margin-left: 20px;
                  padding-left: 0;
                  font-size: 14px;
                  text-align: justify;
                }
                .untuk-list li {
                  margin-bottom: 8px;
                }
                
                /* Signature block */
                .sig-container {
                  margin-top: 40px;
                  float: right;
                  width: 250px;
                  font-size: 14px;
                }
                .sig-box {
                  min-height: 110px;
                  height: auto;
                  margin-bottom: 12px;
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
        <span className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <FileBadge2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Preview Format Surat Tugas Resmi Daerah (Standard Kepbup/Inpres)</span>
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

          {/* EDIT REDAKSI DASAR SURAT TUGAS */}
          <div className="bg-white p-4 rounded-lg border border-slate-150 space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <label className="text-[10px] text-blue-600 font-extrabold block uppercase tracking-wider">
                Edit Redaksi Dasar Surat Tugas
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
        </div>
      )}

      {/* RENDER SHEET */}
      <div className="border border-slate-300 p-8 md:p-12 bg-white max-w-3xl mx-auto shadow-sm select-text overflow-x-auto min-w-[320px]">
        <div id="surat-tugas-printable" className="font-serif text-black leading-relaxed text-sm max-w-[650px] mx-auto bg-white">
          
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
              <h1 className="kop-pemkab text-base md:text-lg font-bold tracking-wide uppercase m-0 leading-tight">
                PEMERINTAH KABUPATEN TABALONG
              </h1>
              <h2 className="kop-instansi text-lg md:text-2xl font-bold tracking-normal uppercase m-0 leading-tight mt-1">
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

          {/* TITLE */}
          <div className="text-center mb-6">
            <h3 className="doc-title text-base md:text-lg font-bold uppercase underline tracking-wide m-0">
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
                <td className="w-16 md:w-20 font-bold py-1">Dasar</td>
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
          <div className="memperin text-center font-bold tracking-widest text-slate-900 border-y border-stone-300 py-1 my-4 text-sm">
            M E M E R I N T A H K A N :
          </div>

          {/* KEPADA SECTION */}
          <table className="participants-list-table w-full text-xs md:text-sm select-text">
            <tbody>
              <tr>
                <td className="w-16 md:w-20 font-bold py-1 align-top text-black">Kepada</td>
                <td className="w-3 py-1 align-top text-black">:</td>
                <td className="py-1">
                  <table className="w-full text-xs md:text-sm text-black border-none border-collapse text-left">
                    <tbody>
                      {participants.map((emp, index) => (
                        <React.Fragment key={`st-p-${emp.id}-${index}`}>
                          {/* Nama Row */}
                          <tr className="break-inside-avoid">
                            <td className="w-6 font-bold align-top py-0.5 text-black" rowSpan={4}>
                              {index + 1}.
                            </td>
                            <td className="w-32 align-top py-0 text-black">Nama</td>
                            <td className="w-4 align-top py-0 text-center text-black">:</td>
                            <td className="align-top py-0 font-bold text-black">{emp.name}</td>
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
                            <td className="align-top py-0 text-black font-semibold">{emp.jabatan}</td>
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
                <td className="w-16 md:w-20 font-bold py-2">Untuk</td>
                <td className="w-3 py-2">:</td>
                <td className="py-2">
                  <ol className="list-decimal list-outside ml-4 p-0 space-y-2 text-justify text-slate-900">
                    <li>
                      Melaksanakan Perjalanan Dinas dalam rangka: <span className="font-bold">"{travel.purpose}"</span>.
                    </li>
                    <li>
                      Tujuan perjalanan dinas bertempat di <span className="font-bold">{travel.destination}</span>, berlokasi kedudukan awal di <span className="font-bold">{travel.departurePlace}</span>.
                    </li>
                    <li>
                      Tugas ini dilaksanakan selama <span className="font-bold">{durationDays} hari kerja</span> {travel.customDates && travel.customDates.length > 0 ? (
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
                          terhitung mulai tanggal <span className="font-bold">{formatIndoDate(travel.departureDate)}</span> s.d <span className="font-bold">{formatIndoDate(travel.returnDate)}</span>
                        </>
                      )} dengan mengendarai angkutan <span className="font-bold">{travel.transportMode}</span>.
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
            <div className="sig-container w-64 text-xs md:text-sm text-slate-900">
              <p className="m-0">Dikeluarkan di : Tabalong</p>
              <p className="m-0 border-b border-black pb-1">Pada Tanggal : {formatIndoDate(travel.taskLetterDate)}</p>
              
              <div className="mt-3">
                <p className="m-0 text-center font-bold uppercase">{signatory?.jabatan || "Inspektur Daerah"},</p>
                <div className="sig-box min-h-[110px] flex flex-col justify-center my-2" style={{ minHeight: '110px', height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {signSpecialCode ? (
                    <p className="m-0 font-mono text-slate-800 font-semibold text-center" style={{ fontSize: signCodeSize, lineHeight: '1.2', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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
                <p className="m-0 text-center font-bold underline uppercase">{signatory?.name || "DIYANTO, SE, MT"}</p>
                {signatory?.nip && signatory.nip !== "-" && (
                  <p className="m-0 text-center text-xs">
                    Pangkat: {getFormattedPangkatGolongan(signatory.pangkat)} <br/>
                    NIP. {signatory.nip}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="clear-both"></div>

        </div>
      </div>
    </div>
  );
}
