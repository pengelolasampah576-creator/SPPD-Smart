import { Employee, Travel } from "../types";
import { Printer, FileBadge2 } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";

interface DocumentSuratTugasProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentSuratTugas({ travel, employees }: DocumentSuratTugasProps) {
  const signatory = employees.find(e => e.id === travel.signatoryId);
  const participants = travel.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

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

  const handlePrint = () => {
    const printContent = document.getElementById("surat-tugas-printable")?.innerHTML;
    if (printContent) {
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
                  height: 64px;
                  width: 56px;
                  object-fit: contain;
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
                  font-style: italic;
                  margin: 0;
                  margin-top: 4px;
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
                  margin: 20px 0;
                }

                /* Participants */
                .participants-list-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: 14px;
                }
                .participants-list-table td {
                  padding: 6px 4px;
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
                  height: 75px;
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
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <FileBadge2 className="w-4 h-4 text-blue-600" />
          Preview Format Surat Tugas Resmi Daerah (Standard Kepbup/Inpres)
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak Surat Tugas
        </button>
      </div>

      {/* RENDER SHEET */}
      <div className="border border-slate-300 p-8 md:p-12 bg-white max-w-3xl mx-auto shadow-sm select-text overflow-x-auto min-w-[320px]">
        <div id="surat-tugas-printable" className="font-serif text-black leading-relaxed text-sm max-w-[650px] mx-auto bg-white">
          
          {/* KOP SURAT */}
          <div className="kop-header relative border-b-4 border-double border-black pb-3 mb-6 min-h-[85px] flex items-center justify-center">
            <div className="kop-logo-container absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
              <img
                src={TABALONG_LOGO_BASE64}
                alt="Logo Kabupaten Tabalong"
                className="kop-logo h-16 w-14 object-contain"
              />
            </div>
            <div className="text-center w-full px-16">
              <h1 className="kop-pemkab text-base md:text-lg font-bold tracking-wide uppercase m-0 leading-tight">
                PEMERINTAH KABUPATEN TABALONG
              </h1>
              <h2 className="kop-instansi text-lg md:text-2xl font-bold tracking-normal uppercase m-0 leading-tight mt-1">
                INSPEKTORAT DAERAH
              </h2>
              <p className="kop-alamat text-[11px] text-slate-700 font-medium italic m-0 mt-1">
                Alamat: Jl. Pangeran Hidayatullah No. 4 Tabalong Pos 71513, Kalimantan Selatan
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
                  <ol className="list-decimal list-outside ml-4 p-0 space-y-2 text-slate-900">
                    <li>
                      Peraturan Daerah Kabupaten Tabalong Nomor 3 Tahun 2021 tentang Organisasi dan Tata Kerja Inspektorat Daerah Kabupaten Tabalong.
                    </li>
                    <li>
                      Nota Dinas {signatory?.name} ({signatory?.jabatan}) Inspektorat Daerah Kabupaten Tabalong Nomor <span className="font-mono bg-slate-50 px-0.5">{travel.notaNumber}</span> tanggal {formatIndoDate(travel.notaDate)} perihal Pengajuan Registrasi Perjalanan Dinas {travel.destination}.
                    </li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>

          {/* MEMERINTAHKAN SECTION */}
          <div className="memperin text-center font-bold tracking-widest text-slate-900 border-y border-stone-300 py-1 my-6 text-sm">
            M E M E R I N T A H K A N :
          </div>

          {/* KEPADA SECTION */}
          <table className="participants-list-table w-full text-xs md:text-sm select-text">
            <tbody>
              <tr>
                <td className="w-16 md:w-20 font-bold py-2">Kepada</td>
                <td className="w-3 py-2">:</td>
                <td className="py-2">
                  <div className="space-y-4">
                    {participants.map((emp, index) => (
                      <div key={`st-p-${emp.id}`} className="flex flex-col md:flex-row gap-1 border-b border-dashed border-stone-100 pb-2">
                        <div className="w-6 font-semibold flex-shrink-0">{index + 1}.</div>
                        <div className="grid grid-cols-1 md:grid-cols-12 w-full gap-x-2">
                          <div className="md:col-span-3 text-slate-500 font-semibold text-xs">Nama lengkap</div>
                          <div className="md:col-span-9 font-bold text-slate-900">{emp.name}</div>
                          
                          <div className="md:col-span-3 text-slate-500 text-xs">NIP</div>
                          <div className="md:col-span-9 font-mono text-xs">{emp.nip !== "-" ? emp.nip : "-"}</div>
                          
                          <div className="md:col-span-3 text-slate-500 text-xs">Pangkat/Golongan</div>
                          <div className="md:col-span-9 text-xs">{emp.pangkat !== "-" ? emp.pangkat : "Non-Eselon / Non-ASN"}</div>
                          
                          <div className="md:col-span-3 text-slate-500 text-xs">Dalam Jabatan</div>
                          <div className="md:col-span-9 text-xs font-semibold">{emp.jabatan}</div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      Tugas ini dilaksanakan selama <span className="font-bold">{durationDays} hari kerja</span> terhitung mulai tanggal <span className="font-bold">{formatIndoDate(travel.departureDate)}</span> s.d <span className="font-bold">{formatIndoDate(travel.returnDate)}</span> dengan mengendarai angkutan <span className="font-bold">{travel.transportMode}</span>.
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
          <div className="mt-12 flex flex-col items-end">
            <div className="w-64 text-xs md:text-sm text-slate-900">
              <p className="m-0">Dikeluarkan di : Tabalong</p>
              <p className="m-0 border-b border-black pb-1">Pada Tanggal : {formatIndoDate(travel.taskLetterDate)}</p>
              
              <div className="mt-3">
                <p className="m-0 text-center font-bold uppercase">{signatory?.jabatan || "Inspektur Daerah"},</p>
                <div className="sig-box h-20"></div>
                <p className="m-0 text-center font-bold underline uppercase">{signatory?.name || "DIYANTO, SE, MT"}</p>
                {signatory?.nip && signatory.nip !== "-" && (
                  <p className="m-0 text-center text-xs">
                    Pangkat: {signatory.pangkat} <br/>
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
