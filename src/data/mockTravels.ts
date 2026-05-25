import { Travel } from "../types";

export const MOCK_TRAVELS: Travel[] = [
  {
    id: "travel-1",
    notaNumber: "090/084/ND-INSP/2026",
    notaDate: "2026-05-28",
    taskLetterNumber: "094/112/ST-INSP/2026",
    taskLetterDate: "2026-05-30",
    spdNumberPrefix: "090/135-SPD/INSP/2026",
    purpose: "Koordinasi Pengawasan Penyelenggaraan Pemerintahan Daerah ke Inspektorat Jenderal Kementerian Dalam Negeri Republik Indonesia",
    departurePlace: "Tabalong",
    destination: "Jakarta Pusat, DKI Jakarta",
    departureDate: "2026-06-02",
    returnDate: "2026-06-05",
    transportMode: "Pesawat Udara (Komersil)",
    budgetSource: "DPA-SKPD Inspektorat Daerah Kabupaten Tabalong Tahun Anggaran 2026",
    budgetCode: "5.1.02.04.01.0003",
    signatoryId: "emp-1", // DIYANTO, SE, MT (Inspektur)
    ppkId: "emp-9", // HAIRUL FAHMI, SE (PPK / Kasubbag)
    employeeIds: ["emp-4", "emp-11", "emp-15"], // JAMALUDDIN, WINARDI, VALENDINA
    expenses: [
      {
        employeeId: "emp-4",
        transportCost: 3850000,
        dailyAllowance: 530000,
        lodgingCost: 850000,
        otherCost: 200000,
        notes: "Uang taxi bandara PP dan representasi eselon III"
      },
      {
        employeeId: "emp-11",
        transportCost: 3850000,
        dailyAllowance: 430000,
        lodgingCost: 650000,
        otherCost: 150000,
        notes: "Kuitansi tiket maskapai ekonomi"
      },
      {
        employeeId: "emp-15",
        transportCost: 3850000,
        dailyAllowance: 430000,
        lodgingCost: 650000,
        otherCost: 150000,
        notes: "Kuitansi tiket maskapai ekonomi"
      }
    ],
    createdAt: "2026-05-28T08:00:00Z"
  },
  {
    id: "travel-2",
    notaNumber: "090/102/ND-INSP/2026",
    notaDate: "2026-06-10",
    taskLetterNumber: "094/145/ST-INSP/2026",
    taskLetterDate: "2026-06-12",
    spdNumberPrefix: "090/180-SPD/INSP/2026",
    purpose: "Konsultasi Teknis Penguatan SPIP Terintegrasi dan Manajemen Risiko pada Deputi Bidang Pengawasan Penyelenggaraan Keuangan Daerah BPKP Pusat",
    departurePlace: "Tabalong",
    destination: "Cianjur, Jawa Barat",
    departureDate: "2026-06-15",
    returnDate: "2026-06-19",
    transportMode: "Mobil Dinas & Kereta Api",
    budgetSource: "DPA-SKPD Inspektorat Daerah Kabupaten Tabalong Tahun Anggaran 2026",
    budgetCode: "5.1.02.04.001.00001",
    signatoryId: "emp-1",
    ppkId: "emp-9",
    employeeIds: ["emp-5", "emp-8", "emp-28"], // SYAHRIADI, RINI HAYATI, MOHAMMAD JA'FAR
    expenses: [
      {
        employeeId: "emp-5",
        transportCost: 1200000,
        dailyAllowance: 430000,
        lodgingCost: 600000,
        otherCost: 100000,
        notes: "BBM & Tol operasional dinas"
      },
      {
        employeeId: "emp-8",
        transportCost: 1200000,
        dailyAllowance: 430000,
        lodgingCost: 500000,
        otherCost: 100000,
        notes: "Uang taxi dinas Cianjur"
      },
      {
        employeeId: "emp-28",
        transportCost: 1200000,
        dailyAllowance: 430000,
        lodgingCost: 500000,
        otherCost: 100000,
        notes: "Uang taxi dinas Cianjur"
      }
    ],
    createdAt: "2026-06-10T09:00:00Z"
  }
];
