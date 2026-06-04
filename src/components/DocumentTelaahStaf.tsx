import React, { useState, useEffect } from "react";
import { StaffStudy, Employee } from "../types";
import { FileText, Sparkles, Plus, Trash2, Edit, Printer, ArrowLeft, Check, Loader2, AlertCircle, Bookmark, Calendar, User, Eye } from "lucide-react";
import { TABALONG_LOGO_BASE64 } from "./TabalongLogo";

interface DocumentTelaahStafProps {
  employees: Employee[];
}

const MOCK_TELAHAAN_INITIAL: StaffStudy[] = [
  {
    id: "ts-1",
    docNumber: "090/041/ND-INSP/2026",
    docDate: "2026-06-04",
    recipient: "Bupati Tabalong",
    sender: "Inspektur Daerah Kabupaten Tabalong",
    subject: "Akselerasi Pengawasan Preventif Penyalahgunaan Alokasi Dana Desa (ADD) Tahun 2026",
    background: "Bahwa Alokasi Dana Desa (ADD) Kabupaten Tabalong terus meningkat setiap tahun anggaran guna mendorong pembangunan infrastruktur dan pemberdayaan ekonomi pedesaan. Namun demikian, berdasarkan hasil evaluasi triwulanan Inspektorat Daerah, masih ditemukan kendala administratif berulang berupa keterlambatan penyampaian laporan pertanggungjawaban serta ketidaksesuaian klasifikasi belanja belanja barang dan jasa di beberapa pemukiman desa.",
    facts: "1. Berdasarkan data sistem pemantauan Inspektorat Daerah, sebanyak 28% desa di wilayah utara Kabupaten Tabalong masih terlambat menyerahkan SPJ triwulan I.\n2. Terjadi pergantian perangkat desa (Kaur Keuangan) secara masif pasca pemilihan kepala desa serentak yang menyebabkan penurunan pemahaman teknis tata kelola keuangan desa.\n3. Peraturan Bupati (Perbup) Nomor 12 Tahun 2025 tentang Pedoman Pengelolaan ADD menuntut pelaporan berbasis digital interaktif yang belum sepenuhnya dikuasai oleh aparatur desa.",
    analysis: "Untuk mengantisipasi terjadinya penyimpangan yang mengarah ke ranah hukum, diperlukan reorientasi model pengawasan dari semula represif (audit pasca-kejadian) menjadi preventif mendalam. Alternatif solusi terbaik yang dikaji adalah pembentukan 'Klinik Konsultasi Keuangan Desa Mandiri' di lingkup Inspektorat serta pelaksanaan bimbingan teknis kilat bermotif pendampingan lapangan langsung. Langkah preventif ini terhitung sangat cost-effective dibanding pembiayaan penanganan perkara penyimpangan anggaran pasca-audit.",
    conclusion: "Bahwa permasalahan keterlambatan dan kelemahan administrasi ADD bersumber utama pada rendahnya kapasitas teknis kaur keuangan desa yang baru menjabat. Reorientasi pengawasan preventif melalui Klinik Konsultasi Keuangan Desa Mandiri merupakan solusi taktis terintegrasi untuk menjamin kepatuhan regulasi sekaligus mempercepat serapan program pembangunan desa.",
    suggestion: "Disarankan kepada Bapak Bupati berkenan menyetujui rencana aksi pembentukan 'Klinik Konsultasi Keuangan Desa Mandiri' Inspektorat Daerah serta mengeluarkan Instruksi Bupati mengenai kewajiban mengikuti bimbingan kompetensi bersertifikat bagi seluruh Kaur Keuangan Desa se-Kabupaten Tabalong sebagai prasyarat pencairan ADD tahap berikutnya.",
    signatoryName: "Ir. H. Yuspian, M.A.",
    signatoryNip: "197110132005011005",
    signatoryTitle: "Inspektur Daerah Kabupaten Tabalong",
    createdAt: "2026-06-04T08:00:00.000Z"
  }
];

export default function DocumentTelaahStaf({ employees }: DocumentTelaahStafProps) {
  const [studies, setStudies] = useState<StaffStudy[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StaffStudy | null>(null);
  
  // Form input states
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [recipient, setRecipient] = useState("Bupati Tabalong");
  const [sender, setSender] = useState("Inspektur Daerah Kabupaten Tabalong");
  const [subject, setSubject] = useState("");
  const [background, setBackground] = useState("");
  const [facts, setFacts] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [suggestion, setSuggestion] = useState("");
  
  // Signatory selection
  const [selectedSignatoryId, setSelectedSignatoryId] = useState("");
  
  // AI assist input states
  const [aiTopic, setAiTopic] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiGoal, setAiGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("sppd_telaah_staf");
    if (stored) {
      try {
        setStudies(JSON.parse(stored));
      } catch (e) {
        setStudies(MOCK_TELAHAAN_INITIAL);
      }
    } else {
      setStudies(MOCK_TELAHAAN_INITIAL);
      localStorage.setItem("sppd_telaah_staf", JSON.stringify(MOCK_TELAHAAN_INITIAL));
    }
  }, []);

  const saveToStorage = (updatedList: StaffStudy[]) => {
    setStudies(updatedList);
    localStorage.setItem("sppd_telaah_staf", JSON.stringify(updatedList));
  };

  const handleCreateNew = () => {
    // Generate default document number
    const randNum = Math.floor(Math.random() * 200) + 1;
    const paddedNum = String(randNum).padStart(3, "0");
    const year = new Date().getFullYear();
    
    setDocNumber(`090/${paddedNum}/ND-INSP/${year}`);
    setDocDate(new Date().toISOString().split("T")[0]);
    setRecipient("Bupati Tabalong");
    setSender("Inspektur Daerah Kabupaten Tabalong");
    setSubject("");
    setBackground("");
    setFacts("");
    setAnalysis("");
    setConclusion("");
    setSuggestion("");
    
    // Choose default signatory (usually Inspector)
    if (employees.length > 0) {
      setSelectedSignatoryId(employees[0].id);
    } else {
      setSelectedSignatoryId("");
    }
    
    // Clear AI Assist fields
    setAiTopic("");
    setAiContext("");
    setAiGoal("");
    setAiError("");
    
    setSelectedStudy(null);
    setIsEditing(true);
  };

  const handleEditStudy = (study: StaffStudy) => {
    setSelectedStudy(study);
    setDocNumber(study.docNumber);
    setDocDate(study.docDate);
    setRecipient(study.recipient);
    setSender(study.sender);
    setSubject(study.subject);
    setBackground(study.background);
    setFacts(study.facts);
    setAnalysis(study.analysis);
    setConclusion(study.conclusion);
    setSuggestion(study.suggestion);
    
    // Match signatory from employees list
    const foundEmp = employees.find(e => e.name === study.signatoryName || e.nip === study.signatoryNip);
    if (foundEmp) {
      setSelectedSignatoryId(foundEmp.id);
    } else {
      setSelectedSignatoryId("");
    }
    
    setAiTopic("");
    setAiContext("");
    setAiGoal("");
    setAiError("");
    
    setIsEditing(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus dokumen Telaah Staf ini secara permanen?")) {
      const filtered = studies.filter(s => s.id !== id);
      saveToStorage(filtered);
      if (selectedStudy?.id === id) {
        setSelectedStudy(null);
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert("Harap masukkan Perihal / Pokok Bahasan!");
      return;
    }

    // Resolve signatory
    let sigName = "Ir. H. Yuspian, M.A.";
    let sigNip = "197110132005011005";
    let sigTitle = "Inspektur Daerah Kabupaten Tabalong";
    
    const matchedSig = employees.find(e => e.id === selectedSignatoryId);
    if (matchedSig) {
      sigName = matchedSig.name;
      sigNip = matchedSig.nip;
      sigTitle = matchedSig.jabatan;
    }

    const studyPayload: StaffStudy = {
      id: selectedStudy ? selectedStudy.id : "ts-" + Date.now(),
      docNumber,
      docDate,
      recipient,
      sender,
      subject,
      background,
      facts,
      analysis,
      conclusion,
      suggestion,
      signatoryName: sigName,
      signatoryNip: sigNip,
      signatoryTitle: sigTitle,
      createdAt: selectedStudy ? selectedStudy.createdAt : new Date().toISOString()
    };

    let updatedList: StaffStudy[];
    if (selectedStudy) {
      updatedList = studies.map(s => s.id === selectedStudy.id ? studyPayload : s);
    } else {
      updatedList = [studyPayload, ...studies];
    }

    saveToStorage(updatedList);
    setSelectedStudy(studyPayload);
    setIsEditing(false);
  };

  // call server-side gemini proxy to translate simple notes into elegant civil-service language
  const handleAiFormulation = async () => {
    if (!aiTopic.trim()) {
      setAiError("Mohon masukkan Pokok Masalah / Topik Utama terlebih dahulu!");
      return;
    }

    setIsGenerating(true);
    setAiError("");
    
    const steps = [
      "Mengontak Server AI...",
      "Menganalisis pokok masalah...",
      "Menyusun struktur naskah birokrasi...",
      "Memformulasikan klausul latar belakang formal...",
      "Merumuskan ulasan dampak & pembahasan kritis...",
      "Menyusun rekomendasi penutup..."
    ];

    let currentStepIdx = 0;
    setGenerationStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setGenerationStep(steps[currentStepIdx]);
      }
    }, 1200);

    try {
      const res = await fetch("/api/generate-telaah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          context: aiContext,
          goal: aiGoal
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal berkomunikasi dengan server AI");
      }

      const data = await res.json();
      
      // Successfully generated, load them into the form editors!
      setBackground(data.background || "");
      setFacts(data.facts || "");
      setAnalysis(data.analysis || "");
      setConclusion(data.conclusion || "");
      setSuggestion(data.suggestion || "");
      
      if (!subject) {
        setSubject(`Telaah Staf Mengenai ${aiTopic}`);
      }

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Terjadi kesalahan internal koneksi Gemini. Harap coba lagi.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handlePrint = (study: StaffStudy) => {
    const formattedDate = new Date(study.docDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (!printWindow) {
      alert("Popup blocker menghalangi pencetakan. Harap izinkan popup browser!");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Telaahan Staf</title>
          <style>
            @page {
              size: F4;
              margin: 2.2cm 2cm 2.2cm 2.5cm;
            }
            body {
              font-family: 'Bookman Old Style', 'Georgia', 'Times New Roman', serif;
              font-size: 14px;
              line-height: 1.6;
              color: #000;
              margin: 0;
              background-color: #fff;
            }
            .paper {
              width: 100%;
              padding: 0;
            }
            
            /* KOP SURAT */
            .kop-header {
              position: relative;
              border-bottom: 4px double #000;
              padding-bottom: 10px;
              margin-bottom: 22px;
              text-align: center;
              min-height: 80px;
              display: block;
            }
            .kop-logo-container {
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
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
              width: 100%;
              box-sizing: border-box;
              text-align: center;
            }
            .kop-pemkab {
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin: 0;
              line-height: 1.2;
              text-transform: uppercase;
            }
            .kop-instansi {
              font-size: 21px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin: 0;
              margin-top: 2px;
              line-height: 1.2;
              text-transform: uppercase;
            }
            .kop-alamat {
              font-size: 11px;
              margin: 0;
              margin-top: 3px;
              line-height: 1.3;
            }
            .kop-laman {
              font-size: 11px;
              margin: 0;
              margin-top: 1px;
              line-height: 1.3;
            }

            /* TITLE */
            .title-area {
              text-align: center;
              margin: 25px 0 20px 0;
            }
            .main-title {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              text-decoration: underline;
              margin: 0 0 3px 0;
              letter-spacing: 1px;
            }

            /* METADATA GRID */
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .meta-table td {
              padding: 3px 0;
              vertical-align: top;
              font-size: 14px;
            }
            .meta-label {
              width: 90px;
            }
            .meta-colon {
              width: 15px;
              text-align: center;
            }
            .double-line {
              border-top: 1.5px solid black;
              border-bottom: 1.5px solid black;
              height: 2px;
              margin: 8px 0 20px 0;
            }

            /* SECTION WRAPPERS */
            .contents-section {
              margin-bottom: 22px;
              text-align: justify;
            }
            .section-header {
              font-weight: bold;
              text-transform: uppercase;
              margin: 0 0 6px 0;
              display: block;
            }
            .section-body {
              margin-left: 28px;
              margin-top: 0;
              white-space: pre-wrap;
            }

            /* SIGNATURE ZONE */
            .sig-area {
              margin-top: 45px;
              width: 100%;
              page-break-inside: avoid;
            }
            .sig-table {
              width: 100%;
              border-collapse: collapse;
            }
            .sig-space {
              height: 75px;
            }
            .sig-name {
              font-weight: bold;
              text-decoration: underline;
            }

            /* UTILITIES */
            .break {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="paper">
            
            <!-- KOP SURAT -->
            <div class="kop-header relative border-b-4 border-double border-black pb-3 mb-6 min-h-[85px] flex items-center justify-center">
              <div class="kop-logo-container absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                <img
                  src="${TABALONG_LOGO_BASE64}"
                  alt="Logo Kabupaten Tabalong"
                  class="kop-logo"
                  style="height: 80px; width: 70px; object-fit: contain;"
                />
              </div>
              
              <div class="kop-text-container text-center w-full px-16 md:px-20">
                <h1 class="kop-pemkab">
                  PEMERINTAH KABUPATEN TABALONG
                </h1>
                <h2 class="kop-instansi">
                  INSPEKTORAT DAERAH
                </h2>
                <p class="kop-alamat">
                  Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513
                </p>
                <p class="kop-laman">
                  Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id
                </p>
              </div>
            </div>

            <!-- TITLE -->
            <div class="title-area">
              <div class="main-title">TELAAHAN STAF</div>
            </div>

            <!-- METADATA BOX -->
            <table class="meta-table">
              <tr>
                <td class="meta-label">Kepada Yth.</td>
                <td class="meta-colon">:</td>
                <td style="font-weight: bold;">${study.recipient}</td>
              </tr>
              <tr>
                <td class="meta-label">Dari</td>
                <td class="meta-colon">:</td>
                <td>${study.sender}</td>
              </tr>
              <tr>
                <td class="meta-label">Tanggal</td>
                <td class="meta-colon">:</td>
                <td>${formattedDate}</td>
              </tr>
              <tr>
                <td class="meta-label">Nomor</td>
                <td class="meta-colon">:</td>
                <td>${study.docNumber}</td>
              </tr>
              <tr>
                <td class="meta-label">Hal</td>
                <td class="meta-colon">:</td>
                <td style="font-weight: bold; text-transform: uppercase;">${study.subject}</td>
              </tr>
            </table>

            <div class="double-line"></div>

            <!-- CONTENTS -->
            <div class="contents-section">
              <div class="section-header">I. Persoalan</div>
              <div class="section-body">${study.background}</div>
            </div>

            <div class="contents-section">
              <div class="section-header">II. Fakta-Fakta Yang Mempengaruhi</div>
              <div class="section-body">${study.facts || '-'}</div>
            </div>

            <div class="contents-section">
              <div class="section-header">III. Analisis / Pembahasan</div>
              <div class="section-body">${study.analysis}</div>
            </div>

            <div class="contents-section">
              <div class="section-header">IV. Kesimpulan</div>
              <div class="section-body">${study.conclusion}</div>
            </div>

            <div class="contents-section">
              <div class="section-header">V. Saran / Rekomendasi Tindak Lanjut</div>
              <div class="section-body">${study.suggestion}</div>
            </div>

            <!-- SIGNATURE -->
            <div class="sig-area flex justify-end">
              <table class="sig-table">
                <tr>
                  <td style="width: 55%;"></td>
                  <td style="text-align: left; vertical-align: top;">
                    <div style="text-transform: capitalize;">${study.signatoryTitle},</div>
                    <div class="sig-space"></div>
                    <div class="sig-name">${study.signatoryName}</div>
                    <div>Pangkat/Golongan: Pembina Utama Muda (IV/c)</div>
                    <div>NIP. ${study.signatoryNip}</div>
                  </td>
                </tr>
              </table>
            </div>

          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
      
      {/* Upper header */}
      <div className="p-6 bg-slate-50 border-b border-slate-250 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-blue-105 text-blue-600 font-bold px-2.5 py-0.5 rounded-lg text-[10px] uppercase border border-blue-50 tracking-wider">
            Modul Administrasi Dinas
          </span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-1">
            <FileText className="w-5.5 h-5.5 text-blue-600" />
            Telaahan Staf (Staff Study)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat, kelola dan formulasikan telaah staf birokratis dengan asistensi Gemini AI dari point core pikiran Anda.
          </p>
        </div>
        
        {!isEditing && (
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-3 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Dokumen Telaah Baru
          </button>
        )}
      </div>

      {isEditing ? (
        // FORM EDITOR VIEW
        <form onSubmit={handleSaveForm} className="p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-600 hover:text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition bg-slate-100/50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Daftar
            </button>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
              {selectedStudy ? "Ubah Rincian Telaah Staf" : "Uraian Surat Telaah Baru"}
            </span>
          </div>

          {/* AI GENERATOR CARD COMPONENT */}
          <div className="bg-gradient-to-tr from-blue-50/50 via-slate-50 to-blue-50/20 p-5 rounded-2xl border border-blue-100 hover:border-blue-200 transition relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none p-3 text-blue-600">
              <Sparkles className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-2 border-b border-blue-50 pb-3 mb-4">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  Asisten AI Pintar (Gemini) 
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 font-bold rounded-md uppercase border border-emerald-100">
                    Sangat Presisi
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ketik gagasan pokok Anda, naskah telaah staf lengkap akan diformulasikan instan dalam bahasa kedinasan resmi!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-black tracking-wide uppercase block mb-1">
                  1. Pokok Masalah / Topik Dokumen *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Digitalisasi Arsip Keuangan atau Optimalisasi Audit Desa..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black tracking-wide uppercase block mb-1">
                  2. Latar Belakang / Kendala Lapangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pegawai kesulitan mencari berkas, sering salah arsip..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black tracking-wide uppercase block mb-1">
                  3. Tindakan / Alternatif Solusi Terbaik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Membeli server arsip terpusat dan melatih operator..."
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {aiError && (
              <div className="mt-3 bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAiFormulation}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{generationStep || "Mengolah Data Birokratis..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Konstruksi Kalimat Telaah dari Catatan Pokok</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BASIC METADATA WRAPPERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">
                NOMOR NASKAH DINAS
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">
                TANGGAL DOKUMEN
              </label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">
                KEPADA YTH. (PENERIMA)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">
                DENGAN HORMAT DARI
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* PERIHAL/HAL INPUT */}
          <div>
            <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1 tracking-wider">
              PERIHAL / HAL RINGKASAN TELAAH *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Usulan Digitalisasi Data Keuangan di Lingkup Inspektorat..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="h-px bg-slate-150 my-2"></div>

          {/* THE 5 SEGMENTS OF TELAAHAN STAF */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                  I. Persoalan / Latar Belakang Masalah
                </label>
              </div>
              <textarea
                rows={4}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Rumusan masalah utama yang diajukan dalam bahasa formal kedinasan..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide mb-1">
                <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                II. Fakta-fakta yang Mempengaruhi
              </label>
              <textarea
                rows={4}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder="Fakta-fakta penting di lapangan, peraturan perundang-undangan pendukung, atau data kuantitatif penunjang..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide mb-1">
                <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                III. Analisis & Pembahasan
              </label>
              <textarea
                rows={5}
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="Analisis pro dan kontra, implikasi biaya, risiko, and efektivitas solusi yang ditawarkan..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide mb-1">
                <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                IV. Kesimpulan
              </label>
              <textarea
                rows={3}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Kesimpulan ringkas yang logis dari hasil ulasan pembahasan..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide mb-1">
                <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">5</span>
                V. Saran / Rekomendasi Tindak Lanjut
              </label>
              <textarea
                rows={3}
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Saran operasional praktis pimpinan untuk menyetujui, mencairkan dana, mengubah regulasi dsb..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="h-px bg-slate-150 my-2"></div>

          {/* SIGNATORY SELECT */}
          <div className="p-4 bg-slate-55 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1">
                PEJABAT PENANDATANGAN TELAAHAN (DARI INTERNAL)
              </label>
              <select
                value={selectedSignatoryId}
                onChange={(e) => setSelectedSignatoryId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — NIP. {emp.nip} ({emp.jabatan})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 md:pt-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Simpan & Rekam Telaah
              </button>
            </div>
          </div>
        </form>
      ) : (
        // DOCUMENTS LIST AND DETAIL PANEL
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* LEFT LIST PANEL */}
          <div className="lg:col-span-5 border-r border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 px-1 border-b border-slate-100 pb-2">
              Daftar Naskah Dinas ({studies.length})
            </h3>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {studies.map(st => {
                const isSelected = selectedStudy?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudy(st)}
                    className={`p-4 rounded-xl border transition duration-150 cursor-pointer relative group flex justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-52/60 border-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-355 hover:bg-slate-50/55"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border text-slate-505 px-1.5 py-0.5 rounded">
                          {st.docNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">
                          {st.docDate}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                        {st.subject}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{st.recipient}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end shrink-0 select-none">
                      <button
                        onClick={(e) => handleDelete(st.id, e)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="Hapus Telaahan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-semibold text-blue-600 group-hover:scale-105 transition flex items-center">
                        Buka <Eye className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {studies.length === 0 && (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Belum Ada Telaah Staf</p>
                  <p className="text-xs mt-1">Silakan buat dokumen telaah baru dengan tombol di atas.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PREVIEW WORKSPACE */}
          <div className="lg:col-span-7 bg-slate-50/40 p-6 flex flex-col justify-between min-h-[500px]">
            {selectedStudy ? (
              <div className="space-y-6">
                
                {/* Upper Utility Action row */}
                <div className="flex justify-between items-center bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
                  <span className="text-xs font-black text-slate-500 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    BERKAS DIKUNCI / PREVIEW DRAFT
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditStudy(selectedStudy)}
                      className="p-2 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Isi Naskah
                    </button>
                    
                    <button
                      onClick={() => handlePrint(selectedStudy)}
                      className="p-2 px-3.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak / Print
                    </button>
                  </div>
                </div>

                {/* Simulated Document Layout Page (A4 Aspect/Look) */}
                <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm text-xs md:text-[13px] text-slate-800 leading-relaxed font-serif relative">
                  
                  {/* Decorative stamp-like mark */}
                  <div className="absolute right-5 top-5 border border-dashed border-slate-300 rounded font-mono p-1 px-2 text-[9px] text-slate-400 select-none uppercase tracking-wide">
                    Draft e-Perjadin
                  </div>

                  {/* KOP HEADER */}
                  <div className="relative border-b-4 border-double border-black pb-3 mb-6 min-h-[85px] flex items-center justify-center font-sans">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                      <img
                        src={TABALONG_LOGO_BASE64}
                        alt="Logo Kabupaten Tabalong"
                        className="h-16 w-14 md:h-18 md:w-[60px] object-contain"
                      />
                    </div>
                    
                    <div className="text-center w-full pl-14 pr-2">
                      <h1 className="text-xs md:text-[13px] font-bold tracking-tight uppercase m-0 leading-tight">
                        PEMERINTAH KABUPATEN TABALONG
                      </h1>
                      <h2 className="text-sm md:text-base font-extrabold tracking-normal uppercase m-0 leading-tight mt-1">
                        INSPEKTORAT DAERAH
                      </h2>
                      <p className="text-[9px] md:text-[10px] text-slate-700 m-0 mt-1 leading-normal font-sans font-medium">
                        Jalan Jaksa Agung Suprapto, Kel. Tanjung, Kec. Tanjung, Kode Pos 71513
                      </p>
                      <p className="text-[9px] md:text-[10px] text-slate-705 m-0 mt-0.5 leading-normal font-sans font-medium">
                        Laman: www.inspektorat.tabalongkab.go.id Pos el: inspektorat@tabalongkab.go.id
                      </p>
                    </div>
                  </div>

                  <div className="text-center font-bold text-sm tracking-wider uppercase underline mb-4">
                    TELAAHAN STAF
                  </div>

                  {/* TABLE METADATA GRID */}
                  <table className="w-full text-slate-850 font-sans mb-4 border-none border-collapse text-left">
                    <tbody>
                      <tr>
                        <td className="w-20 font-semibold py-0.5">Kepada Yth.</td>
                        <td className="w-4 text-center py-0.5">:</td>
                        <td className="font-bold py-0.5">{selectedStudy.recipient}</td>
                      </tr>
                      <tr>
                        <td className="w-20 font-semibold py-0.5">Dari</td>
                        <td className="w-4 text-center py-0.5">:</td>
                        <td className="py-0.5">{selectedStudy.sender}</td>
                      </tr>
                      <tr>
                        <td className="w-20 font-semibold py-0.5">Tanggal</td>
                        <td className="w-4 text-center py-0.5">:</td>
                        <td className="py-0.5">
                          {new Date(selectedStudy.docDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 font-semibold py-0.5">Nomor</td>
                        <td className="w-4 text-center py-0.5">:</td>
                        <td className="py-0.5 font-mono">{selectedStudy.docNumber}</td>
                      </tr>
                      <tr>
                        <td className="w-20 font-semibold py-0.5">Hal</td>
                        <td className="w-4 text-center py-0.5">:</td>
                        <td className="font-extrabold text-blue-900 py-0.5 uppercase">{selectedStudy.subject}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="border-t border-slate-300 my-3"></div>

                  {/* 5 POINTS DESCRIPTORS */}
                  <div className="space-y-4 text-justify">
                    <div>
                      <div className="font-bold font-sans text-slate-900">I. PERSOALAN</div>
                      <p className="mt-1 pl-4 text-slate-750 font-serif leading-relaxed">{selectedStudy.background}</p>
                    </div>

                    <div>
                      <div className="font-bold font-sans text-slate-900">II. FAKTA-FAKTA YANG MEMPENGARUHI</div>
                      <p className="mt-1 pl-4 text-slate-755 font-serif leading-relaxed whitespace-pre-wrap">{selectedStudy.facts || '-'}</p>
                    </div>

                    <div>
                      <div className="font-bold font-sans text-slate-900">III. ANALISIS / PEMBAHASAN</div>
                      <p className="mt-1 pl-4 text-slate-755 font-serif leading-relaxed whitespace-pre-wrap">{selectedStudy.analysis}</p>
                    </div>

                    <div>
                      <div className="font-bold font-sans text-slate-900">IV. KESIMPULAN</div>
                      <p className="mt-1 pl-4 text-slate-755 font-serif leading-relaxed">{selectedStudy.conclusion}</p>
                    </div>

                    <div>
                      <div className="font-bold font-sans text-slate-900">V. SARAN / REKOMENDASI TINDAK LANJUT</div>
                      <p className="mt-1 pl-4 text-slate-755 font-serif leading-relaxed">{selectedStudy.suggestion}</p>
                    </div>
                  </div>

                  {/* SIGN ZONE */}
                  <div className="mt-6 flex justify-end font-sans">
                    <div className="text-left w-64 text-xs">
                      <div>{selectedStudy.signatoryTitle},</div>
                      <div className="h-16"></div>
                      <div className="font-bold underline text-slate-900">{selectedStudy.signatoryName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">NIP. {selectedStudy.signatoryNip}</div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <FileText className="w-14 h-14 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700">Tidak ada dokumen yang dipilih</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Silakan pilih salah satu Telaah Staf di sebelah kiri untuk meninjau rincian naskah birokrasinya, atau klik "Dokumen Telaah Baru" untuk membuat analisis baru.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
