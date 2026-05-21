import { useState } from "react";
import { Employee, Travel } from "../types";
import { Printer, FileSignature, ArrowRight, UserCheck } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";

interface DocumentSPDProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentSPD({ travel, employees }: DocumentSPDProps) {
  const participants = travel.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];
  
  // Choose which employee to view SPD for (default: first participant)
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(travel.employeeIds[0] || "");

  const activeEmployee = employees.find(e => e.id === activeEmployeeId) || participants[0];
  const ppk = employees.find(e => e.id === travel.ppkId);
  
  // Calculate index of active traveler in list to generate unique serial child SPD number
  const activeIndex = travel.employeeIds.indexOf(activeEmployeeId);
  const serialNo = activeIndex !== -1 ? `${activeIndex + 1}`.padStart(2, '0') : "01";
  const fullSpdNumber = `${travel.spdNumberPrefix}/${serialNo}`;

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

  const durationDays = calculateDays(travel.departureDate, travel.returnDate);

  // Determine Level of Cost ("Tingkat Biaya Perjalanan Dinas")
  const getTingkatBiaya = (pangkat: string) => {
    if (pangkat.toLowerCase().includes("pembina")) return "Tingkat A";
    if (pangkat.toLowerCase().includes("penata")) return "Tingkat B";
    if (pangkat.toLowerCase().includes("pengatur")) return "Tingkat C";
    return "Tingkat D / Non-Eselon";
  };

  const handlePrint = () => {
    const printContent = document.getElementById("spd-printable")?.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "", "height=850,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SPD - ${fullSpdNumber.replace(/\//g, '_')}</title>
              <style>
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.3;
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
                
                /* Kop */
                .kop-header {
                  position: relative;
                  border-bottom: 3px double #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                  text-align: center;
                  min-height: 80px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
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
                  height: 56px;
                  width: 48px;
                  object-fit: contain;
                }
                .kop-pemkab {
                  font-size: 15px;
                  font-weight: bold;
                  margin: 0;
                }
                .kop-instansi {
                  font-size: 20px;
                  font-weight: bold;
                  margin: 0;
                  margin-top: 4px;
                }
                .kop-alamat {
                  font-size: 10px;
                  font-style: italic;
                  margin: 0;
                  margin-top: 4px;
                }
                
                /* Title Box */
                .title-box {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .title-label {
                  font-size: 16px;
                  font-weight: bold;
                  text-decoration: underline;
                }
                .number-label {
                  font-size: 12px;
                }
                
                /* SPD Main Table */
                .spd-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  font-size: 12px;
                  margin-bottom: 25px;
                }
                .spd-table th, .spd-table td {
                  border: 1px solid #000;
                  padding: 6px 8px;
                  vertical-align: top;
                }
                
                /* Side note block */
                .sig-block {
                  margin-top: 30px;
                  float: right;
                  width: 250px;
                  font-size: 12px;
                }
                .sig-box {
                  height: 60px;
                }
                
                @media print {
                  body { padding: 15px; }
                  @page { size: portrait; margin: 1.5cm; }
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
      {/* Top Traveler Switcher bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase">Pilih Peserta Perjalanan Dinas:</span>
            <select
              id="select-spd-traveler"
              value={activeEmployeeId}
              onChange={(e) => setActiveEmployeeId(e.target.value)}
              className="bg-white border border-slate-200 mt-0.5 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 cursor-pointer"
            >
              {participants.map((p) => (
                <option key={`spd-opt-${p.id}`} value={p.id}>
                  {p.name} ({p.pangkat !== "-" ? p.pangkat : "Non-ASN"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs cursor-pointer w-full md:w-auto justify-center"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak SPD ({activeEmployee?.name ? activeEmployee.name.split(',')[0] : 'Pegawai'})
        </button>
      </div>

      {activeEmployee ? (
        <div className="border border-slate-300 p-8 md:p-12 bg-white max-w-3xl mx-auto shadow-sm select-text overflow-x-auto min-w-[320px]">
          <div id="spd-printable" className="font-serif text-black leading-snug text-xs md:text-sm max-w-[650px] mx-auto bg-white">
            
            {/* HEAD KOP */}
            <div className="kop-header relative border-b-4 border-double border-black pb-2 mb-4 min-h-[80px] flex items-center justify-center">
              <div className="kop-logo-container absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                <img
                  src={TABALONG_LOGO_BASE64}
                  alt="Logo Kabupaten Tabalong"
                  className="kop-logo h-14 w-12 object-contain"
                />
              </div>
              <div className="text-center w-full px-14">
                <h1 className="kop-pemkab text-sm md:text-base font-bold tracking-wide uppercase m-0 leading-tight">
                  PEMERINTAH KABUPATEN TABALONG
                </h1>
                <h2 className="kop-instansi text-base md:text-xl font-bold uppercase m-0 leading-tight mt-1">
                  INSPEKTORAT DAERAH
                </h2>
                <p className="kop-alamat text-[10px] text-stone-700 font-medium italic m-0">
                  Alamat: Jl. Pangeran Hidayatullah No. 4 Tabalong Pos 71513, Kalimantan Selatan
                </p>
              </div>
            </div>

            {/* TITLE & SERIAL */}
            <div className="title-box text-center mb-4">
              <h3 className="title-label text-sm md:text-base font-bold uppercase underline m-0">
                SURAT PERJALANAN DINAS (SPD)
              </h3>
              <p className="number-label text-xs m-0 mt-0.5">
                Nomor Lembar : {fullSpdNumber}
              </p>
            </div>

            {/* MAIN SPD TABLE */}
            <table className="spd-table w-full border-collapse border border-black mb-6 text-xs select-text">
              <tbody>
                <tr>
                  <td className="w-8 text-center p-2 font-bold">1.</td>
                  <td className="w-56 p-2 font-bold">Pejabat Pembuat Komitmen</td>
                  <td className="p-2 text-slate-900 font-semibold">{ppk?.name || "HAIRUL FAHMI, SE"} <span className="font-normal text-[10px] block">({ppk?.jabatan || "Kepala Subbagian Administrasi Umum"})</span></td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">2.</td>
                  <td className="p-2 font-bold">Nama / NIP Pegawai yang diperintah</td>
                  <td className="p-2 font-bold text-slate-900">
                    <div className="text-sm">{activeEmployee.name}</div>
                    <div className="text-xs font-mono font-medium mt-0.5 text-slate-700">
                      {activeEmployee.nip !== "-" ? `NIP. ${activeEmployee.nip}` : "Pramubakti / Non-ASN"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">3.</td>
                  <td className="p-2 font-bold">
                    a. Pangkat dan Golongan ruang gaji <br/>
                    b. Jabatan / Instansi <br/>
                    c. Tingkat Biaya Perjalanan Dinas
                  </td>
                  <td className="p-2 text-slate-900">
                    a. {activeEmployee.pangkat !== "-" ? activeEmployee.pangkat : "-"} <br/>
                    b. {activeEmployee.jabatan !== "-" ? activeEmployee.jabatan : "Inspektorat Kabupaten Tabalong"} <br/>
                    c. {getTingkatBiaya(activeEmployee.pangkat)}
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">4.</td>
                  <td className="p-2 font-bold">Maksud Perjalanan Dinas</td>
                  <td className="p-2 text-justify text-slate-950 font-medium">{travel.purpose}</td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">5.</td>
                  <td className="p-2 font-bold">Alat angkutan yang dipergunakan</td>
                  <td className="p-2 text-slate-800 font-semibold">{travel.transportMode}</td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">6.</td>
                  <td className="p-2 font-bold">
                    a. Tempat Berangkat <br/>
                    b. Tempat Tujuan
                  </td>
                  <td className="p-2">
                    a. <span className="font-bold">{travel.departurePlace}</span> <br/>
                    b. <span className="font-bold">{travel.destination}</span>
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">7.</td>
                  <td className="p-2 font-bold">
                    a. Lamanya Perjalanan Dinas <br/>
                    b. Tanggal Berangkat <br/>
                    c. Tanggal harus kembali
                  </td>
                  <td className="p-2 text-slate-900">
                    a. <span className="font-bold">{durationDays} (Tiga) Hari Kerja</span> <br/>
                    b. {formatIndoDate(travel.departureDate)} <br/>
                    c. {formatIndoDate(travel.returnDate)}
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">8.</td>
                  <td className="p-2 font-bold">Pengikut / Peserta Pengiring</td>
                  <td className="p-2 select-text">
                    {participants.filter(p => p.id !== activeEmployeeId).length > 0 ? (
                      <ol className="list-decimal ml-4">
                        {participants.filter(p => p.id !== activeEmployeeId).map(p => (
                          <li key={`spd-fol-${p.id}`} className="py-0.5">
                            <span className="font-bold">{p.name}</span> <span className="text-[10px] text-slate-500">({p.jabatan})</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Melaksanakan tugas mandiri / nihil pengikut</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">9.</td>
                  <td className="p-2 font-bold">
                    Pembebanan Anggaran <br/>
                    a. Instansi <br/>
                    b. Mata Anggaran / Kode Rekening
                  </td>
                  <td className="p-2 italic text-xs">
                    a. SKPD Inspektorat Daerah Kabupaten Tabalong <br/>
                    b. <span className="font-mono bg-stone-50 p-0.5 text-stone-900 not-italic font-semibold">{travel.budgetCode}</span>  {travel.budgetSource}
                  </td>
                </tr>
                <tr>
                  <td className="text-center p-2 font-bold">10.</td>
                  <td className="p-2 font-bold">Keterangan lain-lain</td>
                  <td className="p-2 text-xs italic text-slate-500 font-medium">
                    Surat perintah diterbitkan dalam rangkap tindak administratif kedisplinan keuangan daerah Tabalong.
                  </td>
                </tr>
              </tbody>
            </table>

            {/* FOOTER SIGNATURE DETAIL */}
            <div className="mt-6 flex flex-col items-end">
              <div className="w-72 text-xs text-slate-900 select-text">
                <p className="m-0">Dikeluarkan di : Tabalong</p>
                <p className="m-0 border-b border-black pb-1">Pada Tanggal : {formatIndoDate(travel.taskLetterDate)}</p>
                
                <div className="mt-3 text-center">
                  <p className="m-0 font-bold uppercase">{ppk?.jabatan || "Pejabat Pembuat Komitmen"},</p>
                  <p className="m-0 text-[10px] text-slate-500 italic">Inspektorat Daerah Kabupaten Tabalong</p>
                  <div className="sig-box h-16"></div>
                  <p className="m-0 font-bold underline uppercase">{ppk?.name || "HAIRUL FAHMI, SE"}</p>
                  {ppk?.nip && ppk.nip !== "-" && (
                    <p className="m-0 text-[10px]">
                      Pangkat: {ppk.pangkat} <br/>
                      NIP. {ppk.nip}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="clear-both"></div>

          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-500">
          Pilih atau tambahkan pegawai pada perjalanan dinas untuk menggenerasi SPD.
        </div>
      )}
    </div>
  );
}
