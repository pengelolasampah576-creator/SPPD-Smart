import { Employee, Travel } from "../types";
import { Printer, FileText } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";

interface DocumentNotaDinasProps {
  travel: Travel;
  employees: Employee[];
}

export default function DocumentNotaDinas({ travel, employees }: DocumentNotaDinasProps) {
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
    const printContent = document.getElementById("nota-dinas-printable")?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const printWindow = window.open("", "", "height=800,width=700");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Nota Dinas - ${travel.notaNumber.replace(/\//g, '_')}</title>
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
                  margin-bottom: 20px;
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
                
                /* Document Title */
                .doc-title {
                  font-size: 18px;
                  font-weight: bold;
                  text-decoration: underline;
                  margin-top: 15px;
                  margin-bottom: 5px;
                }
                .doc-subtitle {
                  font-size: 13px;
                  margin-bottom: 25px;
                }
                
                /* Metadata Table */
                .meta-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: 14px;
                }
                .meta-table td {
                  padding: 4px 6px;
                  vertical-align: top;
                }
                .line-divider {
                  border-top: 2px solid #000;
                  margin-bottom: 20px;
                }
                
                /* Main Body Table */
                .table-participants {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                  font-size: 14px;
                }
                .table-participants th, .table-participants td {
                  border: 1px solid #000;
                  padding: 6px 8px;
                  text-align: left;
                }
                .table-participants th {
                  background-color: #f2f2f2;
                  text-align: center;
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
          <FileText className="w-4 h-4 text-blue-600" />
          Preview Format Nota Dinas Resmi (Times New Roman Standard)
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak Nota Dinas
        </button>
      </div>

      {/* RENDER SHEET */}
      <div className="border border-slate-300 p-8 md:p-12 bg-white max-w-3xl mx-auto shadow-sm select-text overflow-x-auto min-w-[320px]">
        <div id="nota-dinas-printable" className="font-serif text-black leading-relaxed text-sm max-w-[650px] mx-auto bg-white">
          
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
            <h3 className="doc-title text-base font-bold uppercase underline tracking-wide m-0">
              NOTA DINAS
            </h3>
            <p className="doc-subtitle text-xs m-0 mt-1">
              NOMOR: {travel.notaNumber}
            </p>
          </div>

          {/* METADATA TABLES */}
          <table className="meta-table w-full text-xs md:text-sm border-collapse mb-4 select-text">
            <tbody>
              <tr>
                <td className="w-16 md:w-24 font-bold py-1">Kepada</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 font-bold">Bupati Tabalong <br/><span className="font-normal text-xs">u.p. Sekretaris Daerah Kabupaten Tabalong</span></td>
              </tr>
              <tr>
                <td className="font-bold py-1">Dari</td>
                <td className="py-1">:</td>
                <td className="py-1 font-bold">{signatory?.name || "Inspektur"} <br/><span className="font-normal text-xs">{signatory?.jabatan || "Inspektur Daerah"}</span></td>
              </tr>
              <tr>
                <td className="font-bold py-1">Tanggal</td>
                <td className="py-1">:</td>
                <td className="py-1">{formatIndoDate(travel.notaDate)}</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Sifat</td>
                <td className="py-1">:</td>
                <td className="py-1">Penting / Segera</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Lampiran</td>
                <td className="py-1">:</td>
                <td className="py-1">1 (satu) Berkas Berkas Tugas</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Hal</td>
                <td className="py-1">:</td>
                <td className="py-1 font-bold italic underline">
                  Permohonan Persetujuan Perjalanan Dinas {travel.destination}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="line-divider border-t-2 border-black mb-6"></div>

          {/* BODY */}
          <div className="space-y-4 text-xs md:text-sm text-justify">
            <p className="indent-8 text-slate-900 leading-relaxed">
              Bersama ini disampaikan dengan hormat kepada Bapak, bahwa dalam rangka pelaksanaan tugas kedinasan di lingkungan Inspektorat Daerah Kabupaten Tabalong, yaitu untuk melaksanakan kegiatan: 
              <span className="font-bold"> "{travel.purpose}"</span>.
            </p>

            <p className="text-slate-900 leading-relaxed">
              Sehubungan dengan hal tersebut di atas, kami merencanakan serta merekomendasikan penugasan personel Pegawai Negeri Sipil & Non-ASN di bawah ini untuk melaksanakan tugas dimaksud:
            </p>

            {/* TABEL PENERIMA TUGAS */}
            <table className="table-participants w-full border-collapse border border-black my-4 text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-black p-1.5 text-center w-8 font-bold">No</th>
                  <th className="border border-black p-1.5 font-bold">Nama / NIP</th>
                  <th className="border border-black p-1.5 font-bold">Pangkat / Gol</th>
                  <th className="border border-black p-1.5 font-bold">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((emp, index) => (
                  <tr key={`nd-p-${emp.id}-${index}`}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2">
                      <div className="font-bold">{emp.name}</div>
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                        {emp.nip !== "-" ? `NIP: ${emp.nip}` : "Pramubakti / Non-ASN"}
                      </div>
                    </td>
                    <td className="border border-black p-2">{emp.pangkat}</td>
                    <td className="border border-black p-2 text-slate-800 font-medium">{emp.jabatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="indent-8 text-slate-900 leading-relaxed">
              Adapun perjalanan dinas operasional ini direncakan akan diselenggarakan selama <span className="font-bold">{durationDays} hari kerja</span> terhitung mulai tanggal <span className="font-bold">{formatIndoDate(travel.departureDate)}</span> sampai dengan <span className="font-bold">{formatIndoDate(travel.returnDate)}</span> dengan menggunakan sarana angkutan <span className="font-bold">{travel.transportMode}</span> dari tempat kedudukan <span className="font-bold">{travel.departurePlace}</span> menuju kota <span className="font-bold">{travel.destination}</span>.
            </p>

            <p className="indent-8 text-slate-900 leading-relaxed">
              Seluruh beban anggaran biaya perjalanan dinas ini akan dibebankan sepenuhnya pada APBD Kabupaten Tabalong Tahun Anggaran 2026, yang termaktub di bawah mata anggaran belanja <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">{travel.budgetSource}</span> dengan rincian Kode Rekening Anggaran Kegiatan <span className="font-semibold text-xs">{travel.budgetCode}</span>.
            </p>

            <p className="indent-8 text-slate-900 leading-relaxed">
              Demikian Nota Dinas permohonan ini disampaikan ke hadapan Bapak, kiranya berkenan memberikan petunjuk serta persetujuan agar tugas ini dapat dioperasionalkan secara maksimal. Atas arahan dan perkenan yang Bapak berikan, kami haturkan terima kasih sebesar-besarnya.
            </p>
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="mt-8 flex justify-end">
            <div className="sig-container w-64 text-slate-900 text-xs md:text-sm">
              <p className="m-0 text-center font-bold uppercase">{signatory?.jabatan || "Inspektur"},</p>
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
          <div className="clear-both"></div>

        </div>
      </div>
    </div>
  );
}
