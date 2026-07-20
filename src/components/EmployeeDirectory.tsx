import React, { useState } from "react";
import { Employee } from "../types";
import { Search, UserPlus, FileSpreadsheet, Trash2, Edit3, Clipboard, Check, Filter, Sparkles, RefreshCw } from "lucide-react";

// Helper to convert names with academic degrees and titles to proper/title case
export function convertToTitleCaseWithTitles(name: string): string {
  if (!name) return name;
  
  const titleMap: { [key: string]: string } = {
    "se": "SE",
    "s.e": "S.E.",
    "s.e.": "S.E.",
    "mt": "MT",
    "m.t": "M.T.",
    "m.t.": "M.T.",
    "s.sos": "S.Sos",
    "s.sos.": "S.Sos.",
    "m.si": "M.Si",
    "m.si.": "M.Si.",
    "dr": "Dr.",
    "dr.": "Dr.",
    "sh": "SH",
    "s.h": "S.H.",
    "s.h.": "S.H.",
    "mh": "MH",
    "m.h": "M.H.",
    "m.h.": "M.H.",
    "h": "H.",
    "h.": "H.",
    "hj": "Hj.",
    "hj.": "Hj.",
    "mm": "MM",
    "m.m": "M.M.",
    "m.m.": "M.M.",
    "s.kep": "S.Kep",
    "s.kep.": "S.Kep.",
    "ns": "Ns",
    "ns.": "Ns.",
    "a.md.ak": "A.Md.Ak.",
    "a.md.ak.": "A.Md.Ak.",
    "a.md": "A.Md",
    "a.md.": "A.Md.",
    "s.ap": "S.AP",
    "s.ap.": "S.AP.",
    "s.ip": "S.IP",
    "s.ip.": "S.IP.",
    "s.ak": "S.Ak",
    "s.ak.": "S.Ak.",
    "s.hut": "S.Hut",
    "s.hut.": "S.Hut.",
    "s.stp": "S.STP",
    "s.stp.": "S.STP.",
    "s.s.t": "S.S.T",
    "s.s.t.": "S.S.T.",
    "s.tr.m": "S.Tr.M",
    "s.tr.m.": "S.Tr.M.",
    "s.tr.i.p": "S.Tr.I.P.",
    "s.tr.i.p.": "S.Tr.I.P.",
    "s.ab": "S.AB",
    "s.ab.": "S.AB.",
    "s.a.b": "S.A.B",
    "s.a.b.": "S.A.B."
  };

  const parts = name.split(",");
  let namePart = parts[0].trim();
  const nameWords = namePart.split(/\s+/).map(word => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
    const lowerWordWithDot = word.toLowerCase();
    if (titleMap[lowerWordWithDot]) return titleMap[lowerWordWithDot];
    if (titleMap[cleanWord]) return titleMap[cleanWord];
    
    if (word.includes("'")) {
      return word.split("'").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase()).join("'");
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  parts[0] = nameWords.join(" ");

  for (let i = 1; i < parts.length; i++) {
    const titlePart = parts[i].trim();
    const words = titlePart.split(/\s+/).map(word => {
      const lowerWord = word.toLowerCase();
      if (titleMap[lowerWord]) return titleMap[lowerWord];
      
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
      if (titleMap[cleanWord]) return titleMap[cleanWord];

      if (word.includes(".") || word.length <= 3) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    parts[i] = words.join(" ");
  }

  return parts.join(", ");
}

interface EmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
}

export default function EmployeeDirectory({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onUpdateEmployees,
}: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPangkat, setFilterPangkat] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formPangkat, setFormPangkat] = useState("");
  const [formJabatan, setFormJabatan] = useState("");

  const handleCopyNip = (nip: string, id: string) => {
    if (nip === "-") return;
    navigator.clipboard.writeText(nip.replace(/\s+/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.pangkat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPangkat =
      filterPangkat === "" || emp.pangkat.toLowerCase().includes(filterPangkat.toLowerCase());

    return matchesSearch && matchesPangkat;
  });

  // Extract unique pangkat values for filtering
  const uniquePangkatList = Array.from(
    new Set(employees.map((emp) => emp.pangkat).filter((p) => p !== "-"))
  ).sort();

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setFormId("");
    setFormName("");
    setFormNip("");
    setFormPangkat("");
    setFormJabatan("");
    setShowForm(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setIsEditing(true);
    setFormId(emp.id);
    setFormName(emp.name);
    setFormNip(emp.nip);
    setFormPangkat(emp.pangkat);
    setFormJabatan(emp.jabatan);
    setShowForm(true);
  };

  const [showBulkSuccess, setShowBulkSuccess] = useState(false);

  const handleBulkFormatTitleCase = () => {
    if (!onUpdateEmployees) return;
    const formatted = employees.map(emp => ({
      ...emp,
      name: convertToTitleCaseWithTitles(emp.name)
    }));
    onUpdateEmployees(formatted);
    setShowBulkSuccess(true);
    setTimeout(() => {
      setShowBulkSuccess(false);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const employeeData: Employee = {
      id: isEditing ? formId : `emp-${Date.now()}`,
      name: formName.trim(), // Preserve exact case typed by the user
      nip: formNip || "-",
      pangkat: formPangkat || "-",
      jabatan: formJabatan,
    };

    if (isEditing) {
      onEditEmployee(employeeData);
    } else {
      onAddEmployee(employeeData);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pegawai ini dari basis data?")) {
      onDeleteEmployee(id);
    }
  };

  return (
    <div id="employee-directory-section" className="space-y-6">
      {showBulkSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Berhasil memformat semua nama pegawai menjadi huruf kecil teratur (Title Case) dengan penulisan gelar tetap terjaga!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Database Pegawai Inspektorat
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar master pegawai aktif yang terintegrasi dengan pembuatan Nota Dinas, Surat Tugas, dan SPD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onUpdateEmployees && (
            <button
              id="btn-format-names-case"
              onClick={handleBulkFormatTitleCase}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-200 transition duration-150 cursor-pointer shadow-xs"
              title="Ubah semua nama pegawai yang huruf kapital menjadi huruf teratur secara otomatis"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Format Title Case (Huruf Teratur)
            </button>
          )}
          <button
            id="btn-add-employee"
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-150 shadow-sm cursor-pointer ml-auto sm:ml-0"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pegawai Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            id="employee-search"
            type="text"
            placeholder="Cari pegawai berdasarkan Nama, NIP, Jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs text-slate-800"
          />
        </div>

        {/* Pangkat Filter */}
        <div className="md:col-span-4 relative">
          <Filter className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <select
            id="filter-pangkat"
            value={filterPangkat}
            onChange={(e) => setFilterPangkat(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs text-slate-800 appearance-none cursor-pointer"
          >
            <option value="">Semua Pangkat / Golongan</option>
            <option value="pembina">Pembina</option>
            <option value="penata">Penata</option>
            <option value="pengatur">Pengatur</option>
            <option value="pramubakti">Pramubakti / -</option>
            {uniquePangkatList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Total Count Display */}
        <div className="md:col-span-2 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm py-3 px-4 font-semibold">
          Total: {filteredEmployees.length} Pegawai
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden transform transition duration-200">
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5 text-white">
              <h3 className="text-lg font-bold">
                {isEditing ? "Edit Profil Pegawai" : "Tambah Data Pegawai Baru"}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Pastikan data yang diinput sesuai dengan SK Kepegawaian resmi.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nama Lengkap (Serta Gelar)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NUR RAHMANTO, SE., M.M."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 19870605 201101 1 008"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Kosongkan/isi "-" untuk Non-ASN</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pembina / Penata Muda"
                    value={formPangkat}
                    onChange={(e) => setFormPangkat(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Kosongkan/isi "-" untuk Non-ASN</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Jabatan Dinas
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditor Ahli Utama / Kasubbag Perencanaan"
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition duration-150"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition duration-150 shadow-sm"
                >
                  {isEditing ? "Simpan Perubahan" : "Simpan Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.slice(0, 100).map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-200 transition duration-150 flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="bg-slate-50 p-2 rounded-xl text-blue-600 font-mono text-[10px] uppercase font-bold tracking-wider">
                  {emp.pangkat !== "-" ? emp.pangkat : "Non-ASN"}
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition duration-150 gap-1">
                  <button
                    onClick={() => handleOpenEditForm(emp)}
                    title="Edit Pegawai"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    title="Hapus Pegawai"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mt-3 group-hover:text-blue-600 transition line-clamp-1">
                {emp.name}
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 min-h-[32px] line-clamp-2">
                {emp.jabatan}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono">NIP:</span>
              {emp.nip !== "-" ? (
                <button
                  onClick={() => handleCopyNip(emp.nip, emp.id)}
                  className="text-xs font-mono font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5 group/nip"
                >
                  <span className="group-hover/nip:underline">{emp.nip}</span>
                  {copiedId === emp.id ? (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Clipboard className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover/nip:opacity-100 transition" />
                  )}
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-400 italic">Pramubakti / Non-ASN</span>
              )}
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Pegawai tidak ditemukan</p>
            <p className="text-slate-400 text-xs mt-1">
              Coba gunakan kata kunci pencarian lain atau klik tombol tambah untuk merekam pegawai baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
