import { useState, useEffect } from "react";
import { Employee, Travel, TravelExpense } from "../types";
import { Printer, PiggyBank, Edit3, Save, CheckCircle2, RefreshCw } from "lucide-react";

interface DocumentRincianBiayaProps {
  travel: Travel;
  employees: Employee[];
  onUpdateExpenses: (updatedExpenses: TravelExpense[]) => void;
}

export default function DocumentRincianBiaya({
  travel,
  employees,
  onUpdateExpenses,
}: DocumentRincianBiayaProps) {
  const participants = travel.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];
  const ppk = employees.find(e => e.id === travel.ppkId);

  // Active traveler selector state
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(travel.employeeIds[0] || "");
  const activeEmployee = employees.find(e => e.id === activeEmployeeId) || participants[0];

  // Selected traveler expense state
  const [transportCost, setTransportCost] = useState(0);
  const [dailyAllowance, setDailyAllowance] = useState(0);
  const [lodgingCost, setLodgingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays;
  };

  const durationDays = calculateDays(travel.departureDate, travel.returnDate);
  const lodgingNights = durationDays > 1 ? durationDays - 1 : 0;

  // Load active employee values
  useEffect(() => {
    if (!activeEmployeeId) return;
    const expense = travel.expenses.find(ex => ex.employeeId === activeEmployeeId);
    if (expense) {
      setTransportCost(expense.transportCost);
      setDailyAllowance(expense.dailyAllowance);
      setLodgingCost(expense.lodgingCost);
      setOtherCost(expense.otherCost);
      setNotes(expense.notes || "");
    } else {
      setTransportCost(0);
      setDailyAllowance(0);
      setLodgingCost(0);
      setOtherCost(0);
      setNotes("");
    }
  }, [activeEmployeeId, travel]);

  // Handle Save
  const handleSaveExpenses = () => {
    const updated = travel.expenses.map(ex => {
      if (ex.employeeId === activeEmployeeId) {
        return {
          ...ex,
          transportCost: Number(transportCost),
          dailyAllowance: Number(dailyAllowance),
          lodgingCost: Number(lodgingCost),
          otherCost: Number(otherCost),
          notes,
        };
      }
      return ex;
    });

    onUpdateExpenses(updated);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2500);
  };

  // Preset default recommended budgets
  const handleLoadDefaults = () => {
    const isEchelon = activeEmployee?.jabatan.toLowerCase().includes("inspektur") || 
                      activeEmployee?.jabatan.toLowerCase().includes("sekretaris") ||
                      activeEmployee?.jabatan.toLowerCase().includes("kepala");
    
    if (isEchelon) {
      setDailyAllowance(530000);
      setLodgingCost(850000);
      setTransportCost(3850000);
      setOtherCost(250000);
      setNotes("Uang harian standar Eselon III / Inspektur");
    } else {
      setDailyAllowance(430000);
      setLodgingCost(650000);
      setTransportCost(1500000);
      setOtherCost(150000);
      setNotes("Uang harian standar Jabatan Fungsional Madya / Pertama");
    }
  };

  // Helper formatting numbers
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const totalDaily = dailyAllowance * durationDays;
  const totalLodging = lodgingCost * lodgingNights;
  const grandTotal = Number(transportCost) + totalDaily + totalLodging + Number(otherCost);

  // Print function
  const handlePrint = () => {
    const printContent = document.getElementById("expense-printable")?.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "", "height=850,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Rincian Biaya SPD - ${activeEmployee?.name ? activeEmployee.name.split(',')[0] : ''}</title>
              <style>
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.4;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  padding: 40px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-justify { text-align: justify; }
                .font-bold { font-weight: bold; }
                
                .header-title {
                  font-size: 15px;
                  font-weight: bold;
                  text-align: center;
                  text-decoration: underline;
                  margin-bottom: 3px;
                }
                .header-subtitle {
                  font-size: 11px;
                  text-align: center;
                  margin-bottom: 25px;
                }
                
                table.calc-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                  font-size: 13px;
                }
                table.calc-table td, table.calc-table th {
                  border: 1px solid #000;
                  padding: 8px 10px;
                  vertical-align: top;
                }
                table.calc-table th {
                  text-align: center;
                  font-weight: bold;
                  background-color: #f5f5f5;
                }
                
                /* Footer signature */
                .sig-box {
                  height: 60px;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-text">
      
      {/* 1. INPUT PANELS */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <PiggyBank className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Input Anggaran Biaya</h3>
            <p className="text-[11px] text-slate-500">Sesuaikan jatah / realisasi dana masing-masing</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">PILIH PEGAWAI</label>
          <select
            value={activeEmployeeId}
            onChange={(e) => setActiveEmployeeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 cursor-pointer"
          >
            {participants.map((p) => (
              <option key={`exp-opt-${p.id}`} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              BIAYA TRANSPORTASI RIIL (Rp) - Pergi Pulang
            </label>
            <input
              type="number"
              value={transportCost}
              onChange={(e) => setTransportCost(Number(e.target.value))}
              placeholder="e.g. 3850000"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                UANG HARIAN / HARI (Rp)
              </label>
              <input
                type="number"
                value={dailyAllowance}
                onChange={(e) => setDailyAllowance(Number(e.target.value))}
                placeholder="430000"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block italic">Jatah: {durationDays} Hari</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                HOTEL / MALAM (Rp)
              </label>
              <input
                type="number"
                value={lodgingCost}
                onChange={(e) => setLodgingCost(Number(e.target.value))}
                placeholder="650000"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block italic">Jatah: {lodgingNights} Malam</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              BIAYA LAIN-LAIN / RIIL (Rp) - Taxi/Tol/dll
            </label>
            <input
              type="number"
              value={otherCost}
              onChange={(e) => setOtherCost(Number(e.target.value))}
              placeholder="150000"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              KETERANGAN / CATATAN BELANJA
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Kuitansi tiket pesawat Lion Air PP"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Saved feedback */}
        {showSavedNotification && (
          <div className="p-2.5 bg-blue-50 text-blue-800 text-xs rounded-xl flex items-center gap-2 border border-blue-100 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Rincian anggaran peserta tersimpan!
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleLoadDefaults}
            type="button"
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Set Standar
          </button>
          <button
            onClick={handleSaveExpenses}
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Anggaran
          </button>
        </div>
      </div>

      {/* 2. PRINTABLE REPORT VIEW */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block">
            Lembar Pertanggungjawaban Rincian Perhitungan Biaya Ramah Printer (A4)
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Biaya Rincian
          </button>
        </div>

        {activeEmployee ? (
          <div className="border border-slate-300 p-8 md:p-12 bg-white mx-auto shadow-sm overflow-x-auto">
            <div id="expense-printable" className="font-serif text-black leading-relaxed text-xs md:text-sm max-w-[650px] mx-auto bg-white">
              
              <div className="header-title text-center text-sm font-bold uppercase underline">
                RINCIIAN PERHITUNGAN BIAYA PERJALANAN DINAS (RIIL)
              </div>
              <div className="header-subtitle text-center text-[11px] mb-6">
                Lampiran Lembar SPD Nomor: {travel.spdNumberPrefix}/0{(travel.employeeIds.indexOf(activeEmployeeId) + 1)}
              </div>

              {/* METADATA RAMP */}
              <table className="w-full text-xs font-medium border-collapse border-b border-black pb-4 mb-4">
                <tbody>
                  <tr>
                    <td className="w-40 py-1 font-bold">Nama Pegawai Terperintah</td>
                    <td className="w-3 py-1">:</td>
                    <td className="py-1 font-bold">{activeEmployee.name}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">NIP / Pangkat / Jabatan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">
                      {activeEmployee.nip !== "-" ? `${activeEmployee.nip}` : "Non-ASN"} / {activeEmployee.pangkat} / {activeEmployee.jabatan}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Tujuan / Maksud Perjalanan</td>
                    <td className="py-1">:</td>
                    <td className="py-1 text-slate-800">
                      {travel.destination} / {travel.purpose}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Tanggal Dinas / Durasi</td>
                    <td className="py-1">:</td>
                    <td className="py-1">
                      {travel.departureDate} s.d {travel.returnDate} ({durationDays} Hari kerja)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* CALCULATION TABULATION */}
              <table className="calc-table w-full border-collapse border border-black text-xs my-4 text-slate-900">
                <thead>
                  <tr className="bg-stone-50">
                    <td className="border border-black p-2 text-center w-8 font-bold">No</td>
                    <td className="border border-black p-2 font-bold">Rincian Komponen Biaya Belanja</td>
                    <td className="border border-black p-2 text-right w-36 font-bold">Jumlah Uang (Rp)</td>
                    <td className="border border-black p-2 font-bold w-40">Keterangan / Dokumen Sumber</td>
                  </tr>
                </thead>
                <tbody>
                  {/* Transport */}
                  <tr>
                    <td className="border border-black p-2 text-center">1</td>
                    <td className="border border-black p-2 text-justify font-bold">
                      Biaya Transportasi Pergi Pulang (PP) <br/>
                      <span className="text-[10px] text-slate-500 font-normal">Sesuai akomodasi: {travel.transportMode}</span>
                    </td>
                    <td className="border border-black p-2 text-right font-semibold">
                      {formatRupiah(transportCost)}
                    </td>
                    <td className="border border-black p-2 text-stone-600">
                      {notes || "Sifat pengeluaran riil"}
                    </td>
                  </tr>
                  {/* Daily */}
                  <tr>
                    <td className="border border-black p-2 text-center">2</td>
                    <td className="border border-black p-2 text-justify font-bold">
                      Uang Harian Kedinasan Daerah <br/>
                      <span className="text-[10px] text-slate-500 font-normal">Ketentuan: {durationDays} Hari x {formatRupiah(dailyAllowance)} / Hari</span>
                    </td>
                    <td className="border border-black p-2 text-right font-semibold">
                      {formatRupiah(totalDaily)}
                    </td>
                    <td className="border border-black p-2 text-stone-600">
                      Surat Tugas resmi Kabupaten
                    </td>
                  </tr>
                  {/* Lodging */}
                  <tr>
                    <td className="border border-black p-2 text-center">3</td>
                    <td className="border border-black p-2 text-justify font-bold">
                      Akomodasi Penginapan / Hotel <br/>
                      <span className="text-[10px] text-slate-500 font-normal">Ketentuan: {lodgingNights} Malam x {formatRupiah(lodgingCost)} / Malam</span>
                    </td>
                    <td className="border border-black p-2 text-right font-semibold">
                      {formatRupiah(totalLodging)}
                    </td>
                    <td className="border border-black p-2 text-stone-600">
                      Kuitansi penginapan terlampir
                    </td>
                  </tr>
                  {/* Orher */}
                  <tr>
                    <td className="border border-black p-2 text-center">4</td>
                    <td className="border border-black p-2 text-justify font-bold">
                      Biaya Representatif & Taksi / Lainnya <br/>
                      <span className="text-[10px] text-slate-500 font-normal">Operasional penjelajahan lokasi</span>
                    </td>
                    <td className="border border-black p-2 text-right font-semibold">
                      {formatRupiah(otherCost)}
                    </td>
                    <td className="border border-black p-2 text-stone-600">
                      Biaya operasional taksi/riil
                    </td>
                  </tr>
                  {/* TOTAL */}
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="border border-black p-2.5 text-right font-bold uppercase text-stone-900">
                      Jumlah anggaran yang dibayarkan
                    </td>
                    <td className="border border-black p-2.5 text-right font-extrabold text-[#000] text-sm underline md:no-underline">
                      {formatRupiah(grandTotal)}
                    </td>
                    <td className="border border-black p-2.5 bg-white text-stone-500 select-all font-mono text-[10px]">
                      Kode Rek: {travel.budgetCode}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 text-justify font-medium text-xs leading-relaxed">
                Telah dibayarkan tunai / ganti uang persediaan kepada yang bersangkutan sebesar <span className="font-bold underline text-stone-950">{formatRupiah(grandTotal)}</span>, sesuai perhitungan anggaran riil biaya perjalanan dinas yang disahkan.
              </div>

              {/* TWIN SIGNATURE BLOCKS */}
              <div className="mt-8 grid grid-cols-2 gap-4 text-xs select-text">
                <div className="text-center">
                  <p className="m-0">Telah menerima jumlah uang di atas,</p>
                  <p className="m-0 font-bold">YANG MENERIMA / PESERTA</p>
                  <div className="sig-box h-12"></div>
                  <p className="m-0 font-bold underline uppercase">{activeEmployee.name}</p>
                  {activeEmployee.nip !== "-" && <p className="m-0 text-[10px]">NIP. {activeEmployee.nip}</p>}
                </div>

                <div className="text-center">
                  <p className="m-0">Mengetahui & menyetujui,</p>
                  <p className="m-0 font-bold lowercase uppercase">PEJABAT PEMBUAT KOMITMEN (PPK)</p>
                  <div className="sig-box h-12"></div>
                  <p className="m-0 font-bold underline uppercase">{ppk?.name || "HAIRUL FAHMI, SE"}</p>
                  {ppk?.nip && ppk.nip !== "-" && <p className="m-0 text-[10px]">NIP. {ppk.nip}</p>}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 bg-white border rounded-xl">
            Pilih pegawai untuk memuat sheet rincian biaya.
          </div>
        )}
      </div>

    </div>
  );
}
