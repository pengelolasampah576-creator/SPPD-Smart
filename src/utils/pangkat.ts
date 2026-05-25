/**
 * Helper to map Indonesian Civil Service Pangkat (Rank) to include its corresponding Golongan (Grade/Class/Ruang)
 * e.g., "Pembina" -> "Pembina / IV/a"
 */
export const getFormattedPangkatGolongan = (pangkat: string): string => {
  if (!pangkat || pangkat === "-" || pangkat.trim() === "") return "-";
  
  // If the string already contains standard Roman numerals indicating division / class / room,
  // or contains standard dividers, return it as-is to avoid double-processing.
  if (
    pangkat.includes("/") || 
    pangkat.includes("(") || 
    /\b(I|II|III|IV)\b/.test(pangkat)
  ) {
    return pangkat;
  }
  
  const pLower = pangkat.toLowerCase().trim();
  switch (pLower) {
    case "pembina utama":
      return "Pembina Utama / IV/e";
    case "pembina utama madya":
      return "Pembina Utama Madya / IV/d";
    case "pembina utama muda":
      return "Pembina Utama Muda / IV/c";
    case "pembina tk. i":
    case "pembina tk i":
    case "pembina tingkat i":
      return "Pembina Tk. I / IV/b";
    case "pembina":
      return "Pembina / IV/a";
    case "penata tk. i":
    case "penata tk i":
    case "penata tingkat i":
      return "Penata Tk. I / III/d";
    case "penata":
      return "Penata / III/c";
    case "penata muda tk. i":
    case "penata muda tk i":
    case "penata muda tingkat i":
      return "Penata Muda Tk. I / III/b";
    case "penata muda":
      return "Penata Muda / III/a";
    case "pengatur tk. i":
    case "pengatur tk i":
    case "pengatur tingkat i":
      return "Pengatur Tk. I / II/d";
    case "pengatur":
      return "Pengatur / II/c";
    case "pengatur muda tk. i":
    case "pengatur muda tk i":
    case "pengatur muda tingkat i":
      return "Pengatur Muda Tk. I / II/b";
    case "pengatur muda":
      return "Pengatur Muda / II/a";
    case "juru tk. i":
    case "juru tk i":
    case "juru tingkat i":
      return "Juru Tk. I / I/d";
    case "juru":
      return "Juru / I/c";
    case "juru muda tk. i":
    case "juru muda tk i":
    case "juru muda tingkat i":
      return "Juru Muda Tk. I / I/b";
    case "juru muda":
      return "Juru Muda / I/a";
    default:
      return pangkat;
  }
};
