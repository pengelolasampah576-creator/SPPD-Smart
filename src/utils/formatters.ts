/**
 * Formatting utilities for Indonesian government documents and text representations.
 * Ensures proper case (Sentence/Title case) without forcing all-caps (UPPERCASE),
 * preserves civil service titles, academic degrees, and standard acronyms.
 */

// Common academic degrees, certifications, and titles
const DEGREE_MAP: Record<string, string> = {
  "s.sos": "S.Sos",
  "s.sos.": "S.Sos",
  "ssos": "S.Sos",
  "m.si": "M.Si",
  "m.si.": "M.Si",
  "msi": "M.Si",
  "s.kom": "S.Kom",
  "s.kom.": "S.Kom",
  "skom": "S.Kom",
  "m.kom": "M.Kom",
  "s.pd": "S.Pd",
  "s.pd.": "S.Pd",
  "spd": "S.Pd",
  "m.pd": "M.Pd",
  "s.ked": "S.Ked",
  "s.kep": "S.Kep",
  "s.pt": "S.Pt",
  "s.hut": "S.Hut",
  "s.st": "S.ST",
  "s.tr": "S.Tr",
  "s.e": "SE",
  "se": "SE",
  "m.t": "MT",
  "mt": "MT",
  "m.m": "MM",
  "mm": "MM",
  "m.a": "M.A.",
  "ma": "M.A.",
  "m.ak": "M.Ak",
  "mak": "M.Ak",
  "s.h": "SH",
  "sh": "SH",
  "s.ip": "S.IP",
  "sip": "S.IP",
  "frmp": "FRMP",
  "frmp.": "FRMP",
  "cpa": "CPA",
  "cpa.": "CPA",
  "ca": "CA",
  "ca.": "CA",
  "cia": "CIA",
  "cia.": "CIA",
  "qia": "QIA",
  "qia.": "QIA",
  "cgcae": "CGCAE",
  "cgcae.": "CGCAE",
  "crgp": "CRGP",
  "crgp.": "CRGP",
  "csep": "CSEP",
  "csep.": "CSEP",
  "qrsa": "QRSA",
  "qrsa.": "QRSA",
  "cisa": "CISA",
  "cisa.": "CISA",
  "crmo": "CRMO",
  "crmo.": "CRMO",
  "cfe": "CFE",
  "cfe.": "CFE",
};

// Known professional certifications that must always be uppercase
const KNOWN_CERTIFICATIONS = new Set([
  "FRMP", "CRGP", "CRMO", "CGCAE", "CPA", "CA", "CIA", "QIA", "CSEP", 
  "QRSA", "CISA", "CFE", "CSFA", "ASEAN ENG", "CFRM", "CPRM"
]);

// Common prefixes/honorifics
const PREFIX_MAP: Record<string, string> = {
  "dr.": "Dr.",
  "dr": "Dr.",
  "drs.": "Drs.",
  "drs": "Drs.",
  "dra.": "Dra.",
  "dra": "Dra.",
  "ir.": "Ir.",
  "ir": "Ir.",
  "prof.": "Prof.",
  "prof": "Prof.",
  "h.": "H.",
  "h": "H.",
  "hj.": "Hj.",
  "hj": "Hj.",
};

// Common lowercase conjunctions/prepositions in Indonesian
const LOWERCASE_WORDS = new Set(["dan", "di", "ke", "dari", "pada", "untuk", "dengan", "atas", "oleh", "yang", "atau", "sebagai"]);

// Known acronyms that should remain uppercase (Note: KAB/KAB. is excluded because Kabupaten is abbreviated as 'Kab.')
const ACRONYMS = new Set([
  "SKPD", "ASN", "PNS", "PPPK", "NIP", "SPD", "PPTK", "PA", "KPA", "PPK", 
  "DPA", "APBD", "APBN", "BAPEDA", "BPK", "BPKP", "KPK", "BKPSDM", 
  "RI", "UPTD", "OPD", "SOP", "KPI", "IT", "HRD"
]);

/**
 * Formats a full name with academic degrees properly.
 * E.g. "DIYANTO, SE, MT, FRMP" -> "Diyanto, SE, MT, FRMP"
 * "DRS. H. AHMAD SYAHRANI, M.SI" -> "Drs. H. Ahmad Syahrani, M.Si"
 */
export const formatProperName = (fullName?: string): string => {
  if (!fullName || typeof fullName !== "string") return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(",");
  const baseName = parts[0].trim();
  const degrees = parts.slice(1).map(d => d.trim()).filter(Boolean);

  const formattedBase = baseName
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase();
      if (PREFIX_MAP[lower]) {
        return PREFIX_MAP[lower];
      }
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  if (degrees.length === 0) {
    return formattedBase;
  }

  const formattedDegrees = degrees.map(deg => {
    const clean = deg.trim();
    if (!clean) return "";

    const cleanNoTrailingDot = clean.replace(/\.+$/, "").trim();
    const key = clean.toLowerCase().replace(/\s+/g, "");
    const keyNoDots = clean.toLowerCase().replace(/[\s.]+/g, "");

    // 1. Direct match in DEGREE_MAP (with or without dots)
    if (DEGREE_MAP[key]) return DEGREE_MAP[key];
    if (DEGREE_MAP[clean.toLowerCase()]) return DEGREE_MAP[clean.toLowerCase()];
    if (DEGREE_MAP[keyNoDots]) return DEGREE_MAP[keyNoDots];
    if (DEGREE_MAP[cleanNoTrailingDot.toLowerCase()]) return DEGREE_MAP[cleanNoTrailingDot.toLowerCase()];

    // 2. Known professional certifications (FRMP, CRGP, CGCAE, CPA, CIA, etc.) -> ALWAYS UPPERCASE
    const upperNoDots = keyNoDots.toUpperCase();
    if (KNOWN_CERTIFICATIONS.has(upperNoDots)) {
      return upperNoDots;
    }

    // 3. Known acronym degrees like SE, MT, MM, SH, ST, SI, MH, MP, MS, etc.
    if (/^(se|mt|mm|sh|st|si|mh|mp|ms|ak|apt|frmp|crgp|crmo|cgcae|cpa|ca|cia|qia|csep|qrsa|cisa|cfe)$/i.test(keyNoDots)) {
      return keyNoDots.toUpperCase();
    }

    // 4. Mixed case already (e.g. S.Sos, M.Si, S.Kom, S.Pd)
    if (/[a-z]/.test(clean) && /[A-Z]/.test(clean)) {
      if (KNOWN_CERTIFICATIONS.has(cleanNoTrailingDot.toUpperCase())) {
        return cleanNoTrailingDot.toUpperCase();
      }
      return clean;
    }

    // 5. If short (<= 4 chars without dots)
    if (keyNoDots.length <= 4) {
      return clean.toUpperCase();
    }

    // 6. Fallback: Title Case
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  });

  return `${formattedBase}, ${formattedDegrees.join(", ")}`;
};

/**
 * Formats an Indonesian government job title (jabatan) into Proper Title Case.
 * E.g. "INSPEKTUR DAERAH" -> "Inspektur Daerah"
 * "KASUBBAG UMUM DAN KEPEGAWAIAN" -> "Kasubbag Umum dan Kepegawaian"
 * "Inspektur Daerah Kab. Tabalong" -> "Inspektur Daerah Kab. Tabalong"
 */
export const formatProperJabatan = (jabatan?: string): string => {
  if (!jabatan || typeof jabatan !== "string") return "Inspektur Daerah";
  const trimmed = jabatan.trim();
  if (!trimmed) return "Inspektur Daerah";

  return trimmed
    .split(/\s+/)
    .map((w, idx) => {
      const lower = w.toLowerCase().replace(/[.,/()]/g, "");
      const lowerWithDot = w.toLowerCase().replace(/[/()]/g, "");
      const upper = w.toUpperCase();
      
      // Special handles - evaluated BEFORE ACRONYMS so 'Kab.' is never forced to all-caps 'KAB.'
      if (lower === "kab" || lowerWithDot === "kab." || w.toLowerCase() === "kab" || w.toLowerCase() === "kab.") {
        return "Kab.";
      }
      if (lower === "kasubbag") return "Kasubbag";
      if (lower === "kasubbid") return "Kasubbid";
      if (lower === "sekda") return "Sekda";

      // Keep known acronyms
      if (ACRONYMS.has(upper) || ACRONYMS.has(w)) {
        return upper;
      }
      // Roman numerals
      if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) {
        return w.toUpperCase();
      }
      // Lowercase conjunctions if not first word
      if (idx > 0 && LOWERCASE_WORDS.has(lower)) {
        return w.toLowerCase();
      }

      // Normal capitalize
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
};

/**
 * Converts any generic text into proper case sentence/title,
 * ensuring no shouting all-caps text.
 */
export const formatProperText = (text?: string): string => {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  // If text is fully UPPERCASE or mostly shouting
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
    return trimmed
      .split(/\s+/)
      .map((w, idx) => {
        const upper = w.toUpperCase();
        if (ACRONYMS.has(upper)) return upper;
        if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return upper;
        if (idx > 0 && LOWERCASE_WORDS.has(w.toLowerCase())) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");
  }
  return text;
};

/**
 * Formats NIP line without trailing dot, e.g. "NIP 1971..." instead of "NIP. 1971..."
 */
export const formatNipLabel = (nip?: string): string => {
  if (!nip || nip === "-") return "-";
  return `NIP ${nip.trim()}`;
};
