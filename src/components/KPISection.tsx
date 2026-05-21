import { Travel } from "../types";
import { Plane, Users2, Banknote, CalendarDays } from "lucide-react";

interface KPISectionProps {
  travels: Travel[];
}

export default function KPISection({ travels }: KPISectionProps) {
  const totalTrips = travels.length;

  // Calculate unique employees assigned
  const uniqueAttendees = Array.from(
    new Set(travels.flatMap((t) => t.employeeIds))
  ).length;

  // Calculate total budget consumed
  const totalBudget = travels.reduce((total, t) => {
    const travelTotal = t.expenses.reduce((sum, ex) => {
      // Calculate active days for daily allowance
      const duration = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      };
      const days = duration(t.departureDate, t.returnDate);
      const nights = days > 1 ? days - 1 : 0;

      const daily = ex.dailyAllowance * days;
      const lodging = ex.lodgingCost * nights;
      return sum + ex.transportCost + daily + lodging + ex.otherCost;
    }, 0);
    return total + travelTotal;
  }, 0);

  // Average duration
  const averageDays = travels.length > 0 
    ? (travels.reduce((sum, t) => {
        const diff = Math.abs(new Date(t.returnDate).getTime() - new Date(t.departureDate).getTime());
        return sum + Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      }, 0) / travels.length).toFixed(1)
    : "0";

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div id="kpi-statistics-rack" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* CARD 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-100 transition duration-150">
        <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Perjalanan</span>
          <span className="text-xl font-extrabold text-slate-800">{totalTrips}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Surat Perintah Aktif</span>
        </div>
      </div>

      {/* CARD 2 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-100 transition duration-150">
        <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
          <Users2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pegawai Terlibat</span>
          <span className="text-xl font-extrabold text-slate-800">{uniqueAttendees}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Mobilisasi Sumber Daya</span>
        </div>
      </div>

      {/* CARD 3 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-100 transition duration-150">
        <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600">
          <Banknote className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Realisasi Anggaran</span>
          <span className="text-base font-extrabold text-slate-800 line-clamp-1">{formatRupiah(totalBudget)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Pertanggungjawaban RIIL</span>
        </div>
      </div>

      {/* CARD 4 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-100 transition duration-150">
        <div className="p-3.5 rounded-xl bg-slate-50 text-slate-600">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Rata-rata Durasi</span>
          <span className="text-xl font-extrabold text-slate-800">{averageDays} <span className="text-xs text-slate-500 font-medium">Hari</span></span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Waktu penugasan lapangan</span>
        </div>
      </div>

    </div>
  );
}
