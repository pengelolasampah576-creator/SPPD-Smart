export interface Employee {
  id: string;
  name: string;
  nip: string;
  pangkat: string;
  jabatan: string;
}

export interface TravelExpense {
  employeeId: string;
  transportCost: number; // Biaya transportasi RIIL / perkiraan
  dailyAllowance: number; // Uang harian per hari
  lodgingCost: number; // Biaya penginapan per malam
  otherCost: number; // Biaya lainnya (representasi, taksi, dll)
  notes?: string;
}

export interface Travel {
  id: string;
  // Nomor-nomor dokumen
  notaNumber: string;
  notaDate: string;
  taskLetterNumber: string;
  taskLetterDate: string;
  spdNumberPrefix: string; // e.g., 800/012/SPD-INSP
  
  // Rincian Perjalanan
  purpose: string; // Maksud perjalanan dinas
  departurePlace: string; // Tempat berangkat, default "Tabalong" atau ibukota domisili
  destination: string; // Tempat tujuan
  departureDate: string; // Tanggal berangkat
  returnDate: string; // Tanggal kembali
  transportMode: string; // Alat angkutan yang digunakan (Pesawat Udara, Mobil Dinas, dsb)
  
  // Pembiayaan & Anggaran
  budgetSource: string; // Instansi Pembayar / Sumber Anggaran, e.g. "DPA-SKPD Inspektorat Daerah Kabupaten Tabalong"
  budgetCode: string; // Kode Rekening Anggaran, e.g. "5.1.02.04.01.0001"
  
  // Tanda Tangan & Pejabat
  signatoryId: string; // Pejabat penandatangan Surat Tugas (biasanya Inspektur)
  ppkId: string; // Pejabat Pembuat Komitmen yang menandatangani SPD
  
  // Peserta Perjalanan Dinas (IDs)
  employeeIds: string[];
  
  // Rincian Biaya per Peserta
  expenses: TravelExpense[];
  
  createdAt: string;
}
