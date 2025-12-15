import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Volume2,
  Settings,
  BookOpen,
  MessageCircle,
  Award,
  CheckCircle,
  Cpu,
  ArrowRight,
  FolderOpen,
  User,
  RotateCcw,
  MonitorPlay,
  Menu,
  X,
  StopCircle,
  AlertTriangle,
  PlayCircle,
  Info,
  Target,
  LayoutDashboard,
  HelpCircle,
  CheckSquare,
} from "lucide-react";

// --- Tipe Data & State ---
type Speaker = "ai" | "user";
type InteractionMode = "demo" | "ai-user" | "user-ai";

interface DialogueLine {
  role: "a" | "b";
  text: string;
  translation: string;
}

interface Message {
  id: number;
  speaker: Speaker;
  text: string;
  translation?: string;
  isCorrection?: boolean;
}

interface Vocabulary {
  word: string;
  meaning: string;
  audio?: string;
}

interface Scenario {
  id: string;
  chapter: string;
  title: string;
  description: string;
  roleA: string;
  roleB: string;
  learningOutcomes: string;
  learningObjectives: string;
  vocab: Vocabulary[];
  dialogue: DialogueLine[];
}

// --- HELPER: Validasi Cerdas & Proporsional ---
const normalizeArabic = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F]/g, "") // Hapus Harakat
    .replace(/[أإآ]/g, "ا") // Normalisasi Alif
    .replace(/ة/g, "ه") // Normalisasi Ta Marbutah
    .replace(/ى/g, "ي")
    .replace(/[^\w\s\u0600-\u06FF]/g, "") // Hapus tanda baca
    .trim();
};

const checkWordMatch = (target: string, input: string) => {
  const normTarget = normalizeArabic(target);
  const normInput = normalizeArabic(input);

  const targetWords = normTarget.split(/\s+/).filter((w) => w.length > 2);
  const inputWords = normInput.split(/\s+/);

  if (targetWords.length === 0) {
    return normInput.includes(normTarget) || normTarget.includes(normInput);
  }

  let matchCount = 0;

  targetWords.forEach((tWord) => {
    const bestMatchScore = inputWords.reduce((best, iWord) => {
      if (iWord === tWord) return 1.0;

      const lenDiff = Math.abs(iWord.length - tWord.length);
      if (lenDiff > 2) return best;

      let commonChars = 0;
      const minLen = Math.min(iWord.length, tWord.length);
      for (let i = 0; i < minLen; i++) {
        if (iWord[i] === tWord[i]) commonChars++;
      }

      const similarity = commonChars / Math.max(iWord.length, tWord.length);
      return Math.max(best, similarity);
    }, 0);

    if (bestMatchScore > 0.7) {
      matchCount++;
    }
  });

  const score = matchCount / targetWords.length;

  if (targetWords.length <= 3) {
    return score > 0.65;
  } else {
    return score >= 0.5;
  }
};

// --- Data Materi ---
const defaultScenarios: Scenario[] = [
  // --- MATERI 3 (Bagian 1) ---
  {
    id: "topic3_part1",
    chapter: "MATERI 3 (Bag 1)",
    title: "النظافة في الإسلام : أ- عِنْدَ الطَّبِيبَةِ",
    description: "Percakapan 1: Dokter & Faridah",
    roleA: "الطبيبة",
    roleB: "فريدة",
    learningOutcomes:
      "Peserta didik menerapkan percakapan terkait topik an-naẓāfah fī al-Islām. Peserta didik mensimulasikan dialog sederhana tentang: cara memberitahu dan menanyakan fakta, perasaan, dan sikap mengenai kebersihan dalam Islam.",
    learningObjectives:
      "Peserta didik mampu bercakap (berdialog) menggunakan bahasa Arab yang berkaitan dengan topik النظافة في الإسلام secara lisan, sederhana, dan sesuai kaidah.",
    vocab: [
      { word: "النظافة", meaning: "kebersihan" },
      { word: "المضْمَضَة", meaning: "berkumur" },
      { word: "السواك", meaning: "siwak / kayu pembersih gigi" },
      { word: "إِنَاءُ الطَّعَامِ", meaning: "wadah makanan" },
      { word: "مَكْشُوف", meaning: "terbuka" },
      { word: "الغبار", meaning: "debu" },
      { word: "الحشرات", meaning: "serangga" },
      {
        word: "مَاء دَائِم",
        meaning: "air yang tergenang / air yang tidak mengalir",
      },
      { word: "قَدَارَة", meaning: "kotoran / kenajisan" },
      { word: "دارج دُور", meaning: "rumah-rumah" },
      {
        word: "مَصْدَر (ج) مَصَادِر",
        meaning: "sumber (jamak: sumber-sumber)",
      },
      { word: "ماء (ج) مياه", meaning: "air (jamak: air-air)" },
      { word: "بئر (ج) آبار", meaning: "sumur (jamak: sumur-sumur)" },
      { word: "فناء (ج) أَفنية", meaning: "halaman (jamak: halaman-halaman)" },
    ],
    dialogue: [
      {
        role: "a",
        text: "مِمَّ تَشْكِينَ ؟",
        translation: "Apa yang kamu keluhkan?",
      },
      {
        role: "b",
        text: "عِنْدِي أَلَمْ خَفِيفٌ فِي الرَّأْسِ.",
        translation: "Saya sakit kepala ringan.",
      },
      {
        role: "a",
        text: "مَتَى شَعَرْتِ بِهَذَا الأَلم ؟",
        translation: "Kapan kamu merasakan sakit ini?",
      },
      {
        role: "b",
        text: "شَعَرْتُ بِهِ مُنْذُ أَرْبَعَةِ أَيَّامٍ .",
        translation: "Saya merasakannya sejak empat hari lalu.",
      },
      {
        role: "a",
        text: "هَلْ تَنَاوَلْتِ شَيْئًا ؟",
        translation: "Apakah kamu sudah minum sesuatu (obat)?",
      },
      {
        role: "b",
        text: "تَنَا وَلْتُ بَعْضَ الْحُبَّاتِ، وَلَمْ تَنْفَعُ .",
        translation: "Saya minum beberapa butir (pil), tapi tidak mempan.",
      },
      {
        role: "a",
        text: "تَفَضَّلِي لا تَسْتَلْقِينَ عَلَى السَّرِيرِ لِلْفَحْص. بَعْدَ الْفَحْصِ وَصَفَتِ الطَّبِيبَةُ الدَّوَاءَ ثُمَّ وَقَالَتْ : عِنْدَكِ إِنْفَلُويْنَنَا وَزُكَامٌ وَصُدَاعٌ وَالْتِهابُ فِي مَعِدَتِكِ وَهَذِهِ هِيَ الأَدويَة لَكِ إِنْ شَاءَ اللَّهُ، سَيَزُولُ أَلَمُكِ بَعْدَ أَن تَتَنَاوَلِي الْأَدْوِيَةَ.",
        translation:
          "Silakan berbaring di tempat tidur untuk pemeriksaan. (Setelah pemeriksaan dokter meresepkan obat lalu berkata): Kamu kena influenza, pilek, sakit kepala, dan radang lambung. Ini obat untukmu. Insya Allah, sakitmu akan hilang setelah minum obat.",
      },
    ],
  },

  // --- MATERI 3 (Bagian 2) ---
  {
    id: "topic3_part2",
    chapter: "MATERI 3 (Bag 2)",
    title: "النظافة في الإسلام : ب - عِنْدَ الطَّبِيب",
    description: "Percakapan 2: Ibu & Sulaiman",
    roleA: "الأم",
    roleB: "سليمان",
    learningOutcomes:
      "Peserta didik menerapkan percakapan terkait topik an-naẓāfah fī al-Islām. Peserta didik mensimulasikan dialog sederhana tentang: cara memberitahu dan menanyakan fakta, perasaan, dan sikap mengenai kebersihan dalam Islam.",
    learningObjectives:
      "Peserta didik mampu bercakap (berdialog) menggunakan bahasa Arab yang berkaitan dengan topik النظافة في الإسلام secara lisan, sederhana, dan sesuai kaidah.",
    vocab: [
      { word: "النظافة", meaning: "kebersihan" },
      { word: "المضْمَضَة", meaning: "berkumur" },
      { word: "السواك", meaning: "siwak" },
      { word: "إِنَاءُ الطَّعَامِ", meaning: "wadah makanan" },
      { word: "مَكْشُوف", meaning: "terbuka" },
      { word: "الغبار", meaning: "debu" },
      { word: "الحشرات", meaning: "serangga" },
      { word: "مَاء دَائِم", meaning: "air yang tergenang" },
    ],
    dialogue: [
      {
        role: "a",
        text: "مَاذَا بِكَ، يَا سُلَيْمَان ؟",
        translation: "Ada apa denganmu, wahai Sulaiman?",
      },
      {
        role: "b",
        text: "عِنْدِي أَلَمْ شَدِيدٌ فِي عَيْنِي الْيُمْنَى.",
        translation: "Saya sakit sekali di mata kanan saya.",
      },
      { role: "a", text: "مَاذَا حَدَثَ ؟", translation: "Apa yang terjadi?" },
      {
        role: "b",
        text: "كُنْتُ أَلْعَبُ كُرَةَ الْقَدَمِ مَعَ أَصْدِقَائِي، وَقَدْ أَصَابَتْنِي الْكُرَةُ فِي عَيْنِي الْيُمنى",
        translation:
          "Saya sedang bermain sepak bola bersama teman-teman, dan bola mengenai mata kanan saya.",
      },
      {
        role: "a",
        text: "هَلْ ذَهَبْتَ إِلَى الطَّبِيبِ ؟",
        translation: "Apakah kamu sudah pergi ke dokter?",
      },
      {
        role: "b",
        text: "نَعَمْ، ذَهَبْتُ إِلَيْهِ وَقَدْ فَحَصَنِي الطَّبِيبُ وَوَصَفَ الدَّوَاءَ، وَطَلَبَ مِنِّي أَنْ أَشْتَرِيَهُ في الصَّيْدَلِيَّةِ.",
        translation:
          "Ya, saya sudah pergi ke sana. Dokter memeriksa saya dan meresepkan obat, dan meminta saya membelinya di apotek.",
      },
      {
        role: "a",
        text: "وَهَلْ تَشْعُرُ بِأَلَم الآن ؟",
        translation: "Apakah kamu merasa sakit sekarang?",
      },
      {
        role: "b",
        text: "الحَمْدُ لله لا أَشْعُرُ بِأَيِّ أَيْمَ، وَلَكِنْ عَيْنِي الْيُسْرَى تَدْمَعُ قَلِيلاً .",
        translation:
          "Alhamdulillah saya tidak merasa sakit apa pun, tetapi mata kiri saya sedikit berair.",
      },
      {
        role: "a",
        text: "شَفَاكَ الله.",
        translation: "Semoga Allah menyembuhkanmu.",
      },
    ],
  },

  // --- MATERI 3 (Bagian 3) ---
  {
    id: "topic3_part3",
    chapter: "MATERI 3 (Bag 3)",
    title: "النظافة في الإسلام : ج - عِيَادَة الْمَرِيضِ",
    description: "Percakapan 3: Farid & Uthman",
    roleA: "فريد",
    roleB: "عثمان",
    learningOutcomes:
      "Peserta didik menerapkan percakapan terkait topik an-naẓāfah fī al-Islām. Peserta didik mensimulasikan dialog sederhana tentang: cara memberitahu dan menanyakan fakta, perasaan, dan sikap mengenai kebersihan dalam Islam.",
    learningObjectives:
      "Peserta didik mampu bercakap (berdialog) menggunakan bahasa Arab yang berkaitan dengan topik النظافة في الإسلام secara lisan, sederhana, dan sesuai kaidah.",
    vocab: [
      { word: "قَدَارَة", meaning: "kotoran / kenajisan" },
      { word: "دارج دُور", meaning: "rumah-rumah" },
      {
        word: "مَصْدَر (ج) مَصَادِر",
        meaning: "sumber (jamak: sumber-sumber)",
      },
      { word: "ماء (ج) مياه", meaning: "air (jamak: air-air)" },
      { word: "بئر (ج) آبار", meaning: "sumur (jamak: sumur-sumur)" },
      { word: "فناء (ج) أَفنية", meaning: "halaman (jamak: halaman-halaman)" },
    ],
    dialogue: [
      {
        role: "a",
        text: "عَبْدُ الْعَزِيزِ فِي الْمُسْتَشْفَى الْيَوْمَ",
        translation: "Abdul Aziz ada di rumah sakit hari ini.",
      },
      { role: "b", text: "لِمَاذَا ؟", translation: "Mengapa?" },
      {
        role: "a",
        text: "صَدَمَتْهُ الجَوالة أَمْسِ مَسَاءً عِنْدَ مَا يُرِيدُ الذَّهَابَ إِلَى الْبَيْتِ مِنَ الإِدَارَةِ",
        translation:
          "Dia ditabrak motor kemarin sore saat hendak pulang ke rumah dari kantor.",
      },
      {
        role: "b",
        text: "كَيْفَ حَالُهُ الْآنَ ؟",
        translation: "Bagaimana keadaannya sekarang?",
      },
      {
        role: "a",
        text: "هُوَ الآنَ بِخَيْرِ الْحَمْدُ للهِ .",
        translation: "Dia sekarang baik-baik saja, Alhamdulillah.",
      },
      {
        role: "b",
        text: "تَذْهَبُ الآن إِلَى الْمُسْتَشْفَى لِعِيَادَتِهِ.",
        translation: "Kamu pergi sekarang ke rumah sakit untuk menjenguknya.",
      },
      {
        role: "a",
        text: "هُوَ فِي غُرْفَة مَاوَارُ، رقم ١٦ في الدور الرابع.",
        translation: "Dia di ruang Mawar, nomor 16 di lantai empat.",
      },
    ],
  },

  // --- MATERI 2 (Bagian 1) ---
  {
    id: "topic2_part1",
    chapter: "MATERI 2 (Bag 1)",
    title: "الصحة والرعاية الصحية - ماذا تحب؟",
    description: "Percakapan Pertama (Mufrad)",
    roleA: "AI (Bertanya)",
    roleB: "Siswa (Menjawab)",
    learningOutcomes:
      "Peserta didik menerapkan percakapan terkait topik ash-shiḥḥah wa ar-ri‘āyah aṣ-ṣiḥḥiyyah. Peserta didik mensimulasikan dialog sederhana tentang: cara menyampaikan dan merespons fakta, perasaan, dan sikap terkait kesehatan.",
    learningObjectives:
      "Peserta didik mampu bercakap (hiwār) dengan bahasa Arab yang berkaitan dengan topik الصحة والرعاية الصحية, menggunakan ungkapan sederhana dan sesuai konteks komunikasi.",
    vocab: [
      { word: "الغذاء الطيب", meaning: "makanan yang baik / makanan bergizi" },
      {
        word: "المواد الضَّرُورِيَّة",
        meaning: "zat-zat yang diperlukan / bahan-bahan pokok",
      },
      { word: "حَدِيد", meaning: "zat besi" },
      { word: "البروتينات", meaning: "protein" },
      { word: "فِيْتَامِيْنَات", meaning: "vitamin" },
      { word: "الجري", meaning: "lari" },
      { word: "السباحة", meaning: "berenang" },
      { word: "مُبكرا", meaning: "lebih awal / pagi-pagi" },
    ],
    dialogue: [
      { role: "a", text: "ماذا تحب؟", translation: "Apa yang kamu sukai?" },
      {
        role: "b",
        text: "أحبُّ قراءةَ القِصَّةِ.",
        translation: "Saya suka membaca cerita.",
      },
      {
        role: "a",
        text: "ماذا تُفَضِّل؟",
        translation: "Apa yang kamu lebih sukai?",
      },
      {
        role: "b",
        text: "أُفَضِّلُ الجَرْيَ وَالسِّباحةَ.",
        translation: "Saya lebih suka lari dan berenang.",
      },
      { role: "a", text: "ماذا تَخْتار؟", translation: "Apa yang kamu pilih?" },
      {
        role: "b",
        text: "أَخْتارُ هذا الطَّعامَ.",
        translation: "Saya memilih makanan ini.",
      },
      { role: "a", text: "ماذا تأكُل؟", translation: "Apa yang kamu makan?" },
      {
        role: "b",
        text: "آكُلُ الغِذاءَ الطَّيِّبَ.",
        translation: "Saya makan makanan yang bergizi.",
      },
      { role: "a", text: "ماذا تَشْرَب؟", translation: "Apa yang kamu minum?" },
      { role: "b", text: "أَشْرَبُ العَصيرَ.", translation: "Saya minum jus." },
      {
        role: "a",
        text: "ماذا تَتَناوَل؟",
        translation: "Apa yang kamu konsumsi?",
      },
      {
        role: "b",
        text: "أَتَناوَلُ الدَّواءَ السَّائِلَ.",
        translation: "Saya minum obat cair.",
      },
    ],
  },

  // --- MATERI 2 (Bagian 2) ---
  {
    id: "topic2_part2",
    chapter: "MATERI 2 (Bag 2)",
    title: "الصحة والرعاية الصحية - ماذا تعملون؟",
    description: "Percakapan Kedua (Jamak)",
    roleA: "AI (Bertanya)",
    roleB: "Siswa (Menjawab)",
    learningOutcomes:
      "Peserta didik menerapkan percakapan terkait topik ash-shiḥḥah wa ar-ri‘āyah aṣ-ṣiḥḥiyyah. Peserta didik mensimulasikan dialog sederhana tentang: cara menyampaikan dan merespons fakta, perasaan, dan sikap terkait kesehatan.",
    learningObjectives:
      "Peserta didik mampu bercakap (hiwār) dengan bahasa Arab yang berkaitan dengan topik الصحة والرعاية الصحية, menggunakan ungkapan sederhana dan sesuai konteks komunikasi.",
    vocab: [
      {
        word: "رِيَاضَةُ النَّفْسِ",
        meaning: "latihan jiwa / pembinaan rohani",
      },
      { word: "نَوَافِل الصَّلَوَاتِ", meaning: "salat-salat sunah" },
      { word: "تِلاوَةُ الأذكار", meaning: "membaca zikir" },
      { word: "الرَّاحة الكافية", meaning: "istirahat yang cukup" },
      { word: "ضَرُورِي", meaning: "penting / wajib" },
      { word: "الطَّاقَة", meaning: "energi" },
      { word: "العَضَلات", meaning: "otot-otot" },
      { word: "أَوْقَات مُنَاسَبَة", meaning: "waktu-waktu yang sesuai" },
      {
        word: "العادات المفيدة",
        meaning: "kebiasaan-kebiasaan yang bermanfaat",
      },
    ],
    dialogue: [
      {
        role: "a",
        text: "ماذا تعملون؟",
        translation: "Apa yang kalian kerjakan?",
      },
      {
        role: "b",
        text: "نعمل الوَاجِبَ المَنْزِلِيَّ.",
        translation: "Kami mengerjakan PR.",
      },
      {
        role: "a",
        text: "ماذا تُشَاهِدُونَ؟",
        translation: "Apa yang kalian tonton?",
      },
      {
        role: "b",
        text: "نُشَاهِدُ الرِّيَاضَةَ البَدَنِيَّةَ.",
        translation: "Kami menonton olahraga fisik.",
      },
      {
        role: "a",
        text: "ماذا تَكْتُبُونَ؟",
        translation: "Apa yang kalian tulis?",
      },
      {
        role: "b",
        text: "نَكْتُبُ نَصَّ القِرَاءَةِ.",
        translation: "Kami menulis teks bacaan.",
      },
      {
        role: "a",
        text: "ماذا تَخْتَارُونَ؟",
        translation: "Apa yang kalian pilih?",
      },
      {
        role: "b",
        text: "نَخْتَارُ هذِهِ المَجَلَّاتِ.",
        translation: "Kami memilih majalah-majalah ini.",
      },
      {
        role: "a",
        text: "ماذا تَلْعَبُونَ؟",
        translation: "Apa yang kalian mainkan?",
      },
      {
        role: "b",
        text: "نَلْعَبُ كُرَةَ القَدَمِ.",
        translation: "Kami bermain sepak bola.",
      },
      {
        role: "a",
        text: "ماذا تُرِيدُونَ؟",
        translation: "Apa yang kalian inginkan?",
      },
      {
        role: "b",
        text: "نُرِيدُ المَأْكُولَاتِ الخَفِيفَةَ.",
        translation: "Kami ingin makanan ringan.",
      },
    ],
  },

  // --- MATERI 1 ---
  {
    id: "topic1",
    chapter: "MATERI 1",
    title: "آمَالُ الْمُرَاهِقِين",
    description: "Percakapan tentang cita-cita masa depan.",
    roleA: "Khalid (AI)",
    roleB: "Siswa",
    learningOutcomes:
      "Peserta didik menerapkan percakapan (hiwār) terkait topik Āmāl al-Murāhiqīn (cita-cita remaja). Peserta didik mendemonstrasikan dialog sederhana untuk: memberitahu dan menanyakan fakta, perasaan, dan sikap tentang cita-cita remaja.",
    learningObjectives:
      "Setelah melalui kegiatan mengamati, menanya, mengeksplorasi, mengasosiasi, dan mengomunikasikan, peserta didik mampu bercakap (berdialog) menggunakan bahasa Arab yang berkaitan dengan topik آمال المراهقين secara sederhana dan benar.",
    vocab: [
      { word: "رَضِيْعٌ", meaning: "Bayi (yang masih menyusu)" },
      { word: "طِفْلٌ", meaning: "Anak Kecil" },
      { word: "مُرَاهِقٌ", meaning: "Remaja (Laki-laki)" },
      { word: "مُرَاهِقَةٌ", meaning: "Remaja (Perempuan)" },
      { word: "رَاشِدٌ", meaning: "Dewasa / Matang" },
      { word: "مُسِنٌّ", meaning: "Lanjut Usia / Orang Tua" },
      { word: "مُهَنْدِسٌ", meaning: "Insinyur" },
      { word: "طَبِيْبَةٌ", meaning: "Dokter (Perempuan)" },
      { word: "مُبَلِّغٌ", meaning: "Penyampai Dakwah (Da’i)" },
    ],
    dialogue: [
      {
        role: "a",
        text: "هَلْ رِيد أَنْ تَكُونَ مُهَنْدِسًا ؟",
        translation: "Apakah kamu ingin menjadi insinyur?",
      },
      {
        role: "b",
        text: "نعم، لأبني البيوت والعِمَارَاتِ، وأَنتَ يَا خَالِد ؟",
        translation:
          "Ya, untuk membangun rumah dan gedung. Dan kamu wahai Khalid?",
      },
      {
        role: "a",
        text: "أتمنى أَنْ أَكُونَ طبيبًا لأعالج المَرْضَى وَأَنتِ يا فاطمة، ماذا تريدين؟",
        translation:
          "Aku berharap jadi dokter untuk mengobati pasien. Dan kamu Fatimah, apa yang kamu inginkan?",
      },
      {
        role: "b",
        text: "أَنَا أُفَصِّلُ أَنْ أَكُونَ دَاعِيَة",
        translation: "Aku lebih memilih menjadi pendakwah (Da'iyah).",
      },
      {
        role: "a",
        text: "هَذَا مُناسب، فالت ماهرة في الخطابة",
        translation: "Itu cocok, karena kamu mahir dalam berpidato.",
      },
      {
        role: "b",
        text: "أَمَّا أَنَا فَأُحِبٌ أَنْ أَكُونَ مُدَرِّسة.",
        translation: "Adapun aku, aku suka menjadi guru.",
      },
      {
        role: "a",
        text: "عظيم، التدريس مهنة نافعة جدا",
        translation: "Hebat, mengajar adalah profesi yang sangat bermanfaat.",
      },
    ],
  },
];

// --- Komponen Utama ---

const NatiqAI = () => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "roleplay" | "vocab" | "objectives" | "outcomes" | "tutorial"
  >("dashboard");
  const [currentScenario, setCurrentScenario] = useState<Scenario>(
    defaultScenarios[0]
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("ai-user");
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // --- Setup Speech Recognition & Inject Tailwind ---
  useEffect(() => {
    // Inject Tailwind
    if (!document.getElementById("tailwind-cdn")) {
      const script = document.createElement("script");
      script.id = "tailwind-cdn";
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }

    // Inject Font (Amiri for clearer Arabic)
    if (!document.getElementById("google-font")) {
      const link = document.createElement("link");
      link.id = "google-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Amiri:wght@400;700&display=swap";
      document.head.appendChild(link);
    }

    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "ar-SA";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentText = finalTranscript || interimTranscript;
        setLiveTranscript(currentText);
        setMicError(null);
      };

      recognitionRef.current.onerror = (event: any) => {
        // Silent error
      };
    } else {
      setMicError("Browser tidak mendukung Speech API.");
    }

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // --- Logic Functions ---
  const resetSession = (mode: InteractionMode) => {
    setInteractionMode(mode);
    setMessages([]);
    setConversationStep(0);
    setUserPrompt("");
    setIsDemoPlaying(false);
    setLiveTranscript("");
    setMicError(null);
    setSessionStarted(false);
    window.speechSynthesis.cancel();
    if (isListening) stopListening(false);
  };

  const proceedToStep = (
    stepIndex: number,
    mode: InteractionMode,
    sc: Scenario
  ) => {
    const lines = sc.dialogue;
    if (stepIndex >= lines.length) return;

    const currentLine = lines[stepIndex];
    let isAiTurn = false;

    if (mode === "demo") {
      isAiTurn = true;
    } else if (mode === "ai-user") {
      isAiTurn = currentLine.role === "a";
    } else if (mode === "user-ai") {
      isAiTurn = currentLine.role === "b";
    }

    if (isAiTurn) {
      const aiMsg: Message = {
        id: Date.now(),
        speaker: "ai",
        text: currentLine.text,
        translation: currentLine.translation,
      };
      setMessages((prev) => [...prev, aiMsg]);

      speakArabic(currentLine.text, () => {
        if (mode === "demo") {
          setTimeout(() => setConversationStep((prev) => prev + 1), 1000);
        } else {
          setConversationStep(stepIndex + 1);
        }
      });
    } else {
      setUserPrompt(currentLine.text);
    }
  };

  const handleStartSession = () => {
    setSessionStarted(true);
    proceedToStep(0, interactionMode, currentScenario);
  };

  // --- Effect: Reset ---
  useEffect(() => {
    resetSession("ai-user");
  }, [currentScenario]);

  // --- Effect: Flow ---
  useEffect(() => {
    if (!sessionStarted) return;

    if (interactionMode === "demo" && isDemoPlaying) {
      if (
        conversationStep < currentScenario.dialogue.length &&
        conversationStep > 0
      ) {
        proceedToStep(conversationStep, interactionMode, currentScenario);
      }
    } else if (
      interactionMode !== "demo" &&
      conversationStep > 0 &&
      conversationStep < currentScenario.dialogue.length
    ) {
      const nextLine = currentScenario.dialogue[conversationStep];
      let isAiTurnNext = false;
      if (interactionMode === "ai-user") isAiTurnNext = nextLine.role === "a";
      if (interactionMode === "user-ai") isAiTurnNext = nextLine.role === "b";

      if (isAiTurnNext) {
        proceedToStep(conversationStep, interactionMode, currentScenario);
      } else {
        setUserPrompt(nextLine.text);
      }
    }
  }, [conversationStep, isDemoPlaying, sessionStarted]);

  // --- Audio ---
  const speakArabic = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    setAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.9;
    utterance.onend = () => {
      setAiSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setAiSpeaking(false);
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  };

  // --- Mic Controls ---
  const startListening = () => {
    setLiveTranscript("");
    setMicError(null);
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  const stopListening = (shouldSubmit: boolean = true) => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (!shouldSubmit) return;

    // JIKA SUARA KOSONG
    if (!liveTranscript || liveTranscript.trim().length < 1) {
      setTimeout(() => {
        const newMessage: Message = {
          id: Date.now(),
          speaker: "user",
          text: userPrompt,
          translation: `(Suara tidak masuk, tapi kami anggap benar)`,
        };
        setMessages((prev) => [...prev, newMessage]);
        setUserPrompt("");
        setLiveTranscript("");
        setMicError(null);
        setConversationStep((prev) => prev + 1);
      }, 500);
      return;
    }

    // VALIDASI PROPORSIONAL (PERSENTASE KATA BENAR)
    const isCorrect = checkWordMatch(userPrompt, liveTranscript);

    if (isCorrect) {
      setTimeout(() => {
        const newMessage: Message = {
          id: Date.now(),
          speaker: "user",
          text: userPrompt,
          translation: `Anda: "${liveTranscript}" (Diterima)`,
        };
        setMessages((prev) => [...prev, newMessage]);
        setUserPrompt("");
        setLiveTranscript("");
        setMicError(null);
        setConversationStep((prev) => prev + 1);
      }, 500);
    } else {
      setMicError(
        `Salah/Kurang Tepat. Terdeteksi: "${liveTranscript}". Coba ulangi.`
      );
      // Tidak ada auto-skip jika salah, siswa harus mencoba sampai minimal 50%-65% benar
    }
  };

  const handleMicToggle = () => {
    if (!userPrompt) return;
    if (isListening) {
      stopListening(true);
    } else {
      startListening();
    }
  };

  const startDemoMode = () => {
    setInteractionMode("demo");
    setMessages([]);
    setConversationStep(0);
    setUserPrompt("");
    setIsDemoPlaying(true);
    setSessionStarted(true);
    setLiveTranscript("");
    window.speechSynthesis.cancel();

    setTimeout(() => {
      proceedToStep(0, "demo", currentScenario);
    }, 200);
  };

  const handleScenarioChange = (sc: Scenario) => {
    window.speechSynthesis.cancel();
    setCurrentScenario(sc);
    setActiveTab("roleplay");
    setShowSidebar(false);
  };

  return (
    <div
      className="min-h-screen font-sans selection:bg-cyan-500 selection:text-black overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#0f172a", fontFamily: "Amiri, serif" }}
    >
      {/* GLOBAL STYLE UNTUK MEMASTIKAN DARK MODE & FONT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body, html, #root {
          background-color: #0f172a !important;
          color: white;
          min-height: 100vh;
          margin: 0;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #334155; 
        }
        /* Custom Font Class */
        .font-arabic {
          font-family: 'Amiri', serif;
        }
      `,
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      <header className="relative z-20 border-b border-cyan-900/50 bg-slate-900/90 backdrop-blur-md p-3 md:p-4 flex justify-between items-center h-16 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden text-cyan-400 p-1 border border-cyan-900 rounded"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <Cpu size={20} className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1
              className="text-xl md:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              NATIQ AI
            </h1>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Home" },
            { id: "roleplay", icon: MessageCircle, label: "Praktek" },
            { id: "vocab", icon: BookOpen, label: "Kata" },
            { id: "objectives", icon: Target, label: "Tujuan" },
            { id: "outcomes", icon: Award, label: "Capaian" },
            { id: "tutorial", icon: HelpCircle, label: "Tutorial" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-cyan-500/10 border border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  : "text-slate-400 hover:text-cyan-300 hover:bg-white/5"
              }`}
            >
              <tab.icon size={16} />
              <span
                className="text-xs md:text-sm font-medium hidden md:inline"
                style={{ fontFamily: "sans-serif" }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto w-full p-4 flex gap-6 h-[calc(100vh-64px)] overflow-hidden">
        <aside
          className={`
            absolute lg:static top-0 left-0 h-full w-72 bg-slate-900/95 lg:bg-transparent z-50 transition-transform duration-300 border-r lg:border-none border-cyan-900/50 p-4 flex flex-col gap-4 backdrop-blur-xl lg:backdrop-blur-none
            ${
              showSidebar
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
        `}
        >
          <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 h-full flex flex-col shadow-xl lg:shadow-none">
            <h3
              className="text-sm text-cyan-500 font-bold mb-4 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-cyan-900/30"
              style={{ fontFamily: "sans-serif" }}
            >
              <FolderOpen size={16} /> Topik Materi
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {defaultScenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioChange(sc)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${
                    currentScenario.id === sc.id
                      ? "bg-cyan-950/50 border-cyan-500/50 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500/30 text-slate-400"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        currentScenario.id === sc.id
                          ? "bg-cyan-500 text-black"
                          : "bg-slate-700 text-slate-300"
                      }`}
                      style={{ fontFamily: "sans-serif" }}
                    >
                      {sc.chapter}
                    </span>
                    {currentScenario.id === sc.id && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                    )}
                  </div>
                  <div className="font-bold text-sm mb-1 truncate font-arabic">
                    {sc.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 bg-slate-900/60 border border-cyan-900/30 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden relative flex flex-col w-full">
          {activeTab === "dashboard" && (
            <div className="p-6 md:p-8 overflow-y-auto flex flex-col items-center justify-start h-full text-center w-full">
              <div className="mt-8 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border border-cyan-500 flex items-center justify-center mb-6 relative group">
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse"></div>
                <Award size={48} className="text-cyan-300 relative z-10" />
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                SELAMAT DATANG
              </h2>
              <p
                className="text-slate-400 max-w-lg mb-8 text-base md:text-lg"
                style={{ fontFamily: "sans-serif" }}
              >
                Silakan pilih materi di bawah ini atau dari menu sebelah kiri
                untuk memulai.
              </p>

              {/* CARD INFO MATERI AKTIF */}
              <div className="w-full max-w-3xl mb-8 bg-slate-800/60 border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-purple-500"></div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                    <Info className="text-cyan-400" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <div
                      className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      Materi Aktif
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 font-arabic">
                      {currentScenario.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <div
                          className="flex items-center gap-2 mb-2 text-purple-300 font-bold text-xs uppercase"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          <Target size={14} /> Capaian Pembelajaran
                        </div>
                        <p
                          className="text-xs text-slate-300 leading-relaxed truncate"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          {currentScenario.learningOutcomes}
                        </p>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <div
                          className="flex items-center gap-2 mb-2 text-green-300 font-bold text-xs uppercase"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          <CheckCircle size={14} /> Tujuan Pembelajaran
                        </div>
                        <p
                          className="text-xs text-slate-300 leading-relaxed truncate"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          {currentScenario.learningObjectives}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
                {defaultScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleScenarioChange(sc)}
                    className={`bg-slate-800/50 border hover:bg-slate-800/80 hover:-translate-y-1 p-5 rounded-xl transition-all group flex flex-col items-center text-center shadow-lg ${
                      currentScenario.id === sc.id
                        ? "border-cyan-500/50 ring-1 ring-cyan-500/30"
                        : "border-slate-700 hover:border-cyan-500"
                    }`}
                  >
                    <span
                      className="text-xs bg-cyan-900/50 text-cyan-400 px-2 py-1 rounded mb-2 border border-cyan-800"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      {sc.chapter}
                    </span>
                    <div className="text-xl font-bold text-white mb-2 font-arabic">
                      {sc.title}
                    </div>
                    <div
                      className="text-xs text-slate-500"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      {sc.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TUTORIAL PAGE */}
          {activeTab === "tutorial" && (
            <div
              className="p-8 overflow-y-auto h-full text-slate-200"
              style={{ fontFamily: "sans-serif" }}
            >
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                  <HelpCircle size={32} className="text-cyan-400" />
                  Panduan Penggunaan NATIQ AI
                </h2>

                <div className="grid gap-8">
                  <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-900 flex items-center justify-center text-sm border border-cyan-500">
                        1
                      </span>
                      Persiapan Awal
                    </h3>
                    <ul className="list-disc pl-10 space-y-2 text-sm text-slate-400">
                      <li>
                        Pastikan Anda menggunakan browser modern
                        (Chrome/Edge/Safari).
                      </li>
                      <li>
                        <strong>Izinkan akses mikrofon</strong> saat diminta
                        oleh browser.
                      </li>
                      <li>Pastikan volume perangkat Anda cukup terdengar.</li>
                    </ul>
                  </section>

                  <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-sm border border-purple-500">
                        2
                      </span>
                      Memulai Latihan
                    </h3>
                    <div className="space-y-4 text-sm text-slate-400 pl-4">
                      <p>
                        <strong className="text-white">Langkah 1:</strong> Pilih
                        materi yang ingin dipelajari dari menu "Home" atau
                        sidebar kiri.
                      </p>
                      <p>
                        <strong className="text-white">Langkah 2:</strong> Masuk
                        ke menu "Praktek".
                      </p>
                      <p>
                        <strong className="text-white">Langkah 3:</strong> Klik
                        tombol besar{" "}
                        <span className="text-cyan-400 font-bold">
                          MULAI PERCAKAPAN
                        </span>
                        . Ini penting agar suara AI bisa keluar otomatis.
                      </p>
                    </div>
                  </section>

                  <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-900 flex items-center justify-center text-sm border border-green-500">
                        3
                      </span>
                      Cara Berbicara (Mode Praktek)
                    </h3>
                    <div className="space-y-4 text-sm text-slate-400 pl-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Mic size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="mb-1 text-white font-bold">
                            Klik & Bicara:
                          </p>
                          <p>
                            Klik tombol mikrofon sekali untuk mulai merekam.
                            Ikon akan berubah menjadi merah dan berdenyut.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <StopCircle size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="mb-1 text-white font-bold">
                            Klik Selesai:
                          </p>
                          <p>
                            Setelah selesai bicara, klik tombol itu lagi untuk
                            mengirim jawaban.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <CheckSquare size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="mb-1 text-white font-bold">Validasi:</p>
                          <p>
                            AI akan mengecek jawaban Anda. Jika kurang tepat,
                            Anda akan diminta mengulang. Jika suara tidak
                            terdeteksi (masalah teknis), sistem akan otomatis
                            melanjutkan agar latihan tidak macet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-900 flex items-center justify-center text-sm border border-yellow-500">
                        4
                      </span>
                      Fitur Tambahan
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                      <li className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <strong className="block text-white mb-1">
                          Mode Demo
                        </strong>
                        <span className="text-xs text-slate-500">
                          Dengarkan percakapan penuh antara dua AI tanpa
                          interaksi.
                        </span>
                      </li>
                      <li className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <strong className="block text-white mb-1">
                          Mode Terbalik
                        </strong>
                        <span className="text-xs text-slate-500">
                          Anda yang bertanya, AI yang menjawab.
                        </span>
                      </li>
                      <li className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <strong className="block text-white mb-1">
                          Menu Kata
                        </strong>
                        <span className="text-xs text-slate-500">
                          Kamus visual untuk menghafal kosakata baru dalam bab
                          tersebut.
                        </span>
                      </li>
                      <li className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <strong className="block text-white mb-1">
                          Menu Tujuan & Capaian
                        </strong>
                        <span className="text-xs text-slate-500">
                          Lihat target akademis dari setiap materi.
                        </span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* HALAMAN TUJUAN & CAPAIAN */}
          {(activeTab === "objectives" || activeTab === "outcomes") && (
            <div
              className="p-8 overflow-y-auto h-full flex flex-col"
              style={{ fontFamily: "sans-serif" }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                <div
                  className={`p-3 rounded-lg border ${
                    activeTab === "objectives"
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-purple-500/20 border-purple-500/50"
                  }`}
                >
                  {activeTab === "objectives" ? (
                    <Target className="text-cyan-400" size={32} />
                  ) : (
                    <Award className="text-purple-400" size={32} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {activeTab === "objectives"
                      ? "Tujuan Pembelajaran"
                      : "Capaian Pembelajaran"}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {activeTab === "objectives"
                      ? "Target yang ingin dicapai dalam materi ini."
                      : "Indikator keberhasilan peserta didik."}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div
                  className={`bg-slate-800/50 border border-slate-600 p-8 rounded-2xl max-w-2xl shadow-xl relative overflow-hidden group transition-all ${
                    activeTab === "objectives"
                      ? "hover:border-cyan-500/50"
                      : "hover:border-purple-500/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {activeTab === "objectives" ? (
                      <Target size={120} />
                    ) : (
                      <CheckCircle size={120} />
                    )}
                  </div>
                  <h3
                    className={`text-xl font-bold mb-6 font-arabic ${
                      activeTab === "objectives"
                        ? "text-cyan-300"
                        : "text-purple-300"
                    }`}
                  >
                    {currentScenario.title}
                  </h3>
                  <p className="text-lg text-slate-200 leading-relaxed font-light">
                    "
                    {activeTab === "objectives"
                      ? currentScenario.learningObjectives
                      : currentScenario.learningOutcomes}
                    "
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "roleplay" && (
            <>
              <div className="absolute top-0 left-0 right-0 z-20">
                <div className="bg-slate-900/95 border-b border-cyan-900/30 p-3 flex flex-wrap gap-4 justify-between items-center backdrop-blur-md">
                  <div className="overflow-hidden">
                    <span
                      className="text-[10px] text-cyan-500 font-bold tracking-widest"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      {currentScenario.chapter}
                    </span>
                    <h3 className="text-sm text-white font-bold truncate max-w-[200px] md:max-w-none font-arabic">
                      {currentScenario.title}
                    </h3>
                  </div>

                  <div className="flex gap-1 md:gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
                    <button
                      onClick={() => startDemoMode()}
                      className={`px-2 py-1.5 rounded text-[10px] md:text-xs font-bold flex items-center gap-1 transition-all ${
                        interactionMode === "demo"
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <MonitorPlay size={12} />{" "}
                      <span
                        className="hidden sm:inline"
                        style={{ fontFamily: "sans-serif" }}
                      >
                        Demo
                      </span>
                    </button>
                    <button
                      onClick={() => resetSession("ai-user")}
                      className={`px-2 py-1.5 rounded text-[10px] md:text-xs font-bold flex items-center gap-1 transition-all ${
                        interactionMode === "ai-user"
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <Cpu size={12} /> <ArrowRight size={8} />{" "}
                      <User size={12} />
                    </button>
                    <button
                      onClick={() => resetSession("user-ai")}
                      className={`px-2 py-1.5 rounded text-[10px] md:text-xs font-bold flex items-center gap-1 transition-all ${
                        interactionMode === "user-ai"
                          ? "bg-purple-600 text-white"
                          : "text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <User size={12} /> <ArrowRight size={8} />{" "}
                      <Cpu size={12} />
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900/50 border-b border-cyan-900/20 px-4 py-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <div>
                    Peran A:{" "}
                    <span className="text-cyan-400 font-arabic">
                      {currentScenario.roleA}
                    </span>
                  </div>
                  <div>
                    Peran B:{" "}
                    <span className="text-purple-400 font-arabic">
                      {currentScenario.roleB}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-40 md:pt-44 space-y-6 scrollbar-thin scrollbar-thumb-cyan-900 scroll-smooth">
                {!sessionStarted ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
                      <PlayCircle size={64} className="text-cyan-400" />
                    </div>
                    <h2
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      Siap Memulai?
                    </h2>
                    <p
                      className="text-slate-400 text-center max-w-sm"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      Tekan tombol di bawah untuk memulai sesi percakapan.
                      Pastikan volume Anda aktif.
                    </p>
                    <button
                      onClick={handleStartSession}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      MULAI PERCAKAPAN
                    </button>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.speaker === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] relative group`}
                        >
                          {msg.speaker === "ai" && (
                            <div className="absolute -left-8 md:-left-10 top-0 w-8 h-8 rounded-full bg-cyan-900/50 border border-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                              <Cpu size={14} className="text-cyan-400" />
                            </div>
                          )}
                          {msg.speaker === "user" && (
                            <div className="absolute -right-8 md:-right-10 top-0 w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                              <User size={14} className="text-purple-400" />
                            </div>
                          )}

                          <div
                            className={`p-4 md:p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 shadow-lg ${
                              msg.speaker === "user"
                                ? "bg-purple-900/20 border-purple-500/40 text-right rounded-tr-none"
                                : "bg-cyan-900/10 border-cyan-500/40 text-left rounded-tl-none"
                            }`}
                          >
                            <p
                              className="text-xl md:text-3xl font-arabic leading-loose mb-2 text-white"
                              dir="rtl"
                            >
                              {msg.text}
                            </p>
                            {msg.translation && (
                              <p
                                className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/5 italic flex items-center gap-1"
                                style={{ fontFamily: "sans-serif" }}
                              >
                                {msg.speaker === "user" && (
                                  <span className="text-purple-400 font-bold text-[10px] bg-purple-900/30 px-1 rounded">
                                    TERDETEKSI
                                  </span>
                                )}
                                {msg.translation}
                              </p>
                            )}
                            <button
                              onClick={() => speakArabic(msg.text)}
                              className={`absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 p-2 bg-slate-900/80 rounded-full border border-slate-700 ${
                                msg.speaker === "user"
                                  ? "right-0 hover:text-purple-400"
                                  : "left-0 hover:text-cyan-400"
                              }`}
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isListening && (
                      <div className="flex justify-end">
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className="text-red-400 text-sm flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-full border border-red-500/30 animate-pulse"
                            style={{ fontFamily: "sans-serif" }}
                          >
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            Mendengarkan...
                          </div>
                          <div className="bg-slate-900/90 border border-cyan-500/50 px-4 py-2 rounded-lg text-lg text-white font-arabic min-w-[200px] text-center shadow-lg transition-all">
                            {liveTranscript || "..."}
                          </div>
                        </div>
                      </div>
                    )}

                    {aiSpeaking && (
                      <div className="flex justify-start pl-10">
                        <span
                          className="text-cyan-400 text-[10px] tracking-widest animate-pulse border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-900/20"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          AI SEDANG BERBICARA...
                        </span>
                      </div>
                    )}
                    <div className="h-56"></div>
                  </>
                )}
              </div>

              {sessionStarted && (
                <div className="absolute bottom-0 w-full bg-slate-900/95 border-t border-cyan-500/30 backdrop-blur-xl p-4 md:p-5 transition-all duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30">
                  {micError && (
                    <div
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-100 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-bounce"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <AlertTriangle size={14} />
                      {micError}
                    </div>
                  )}

                  {userPrompt && interactionMode !== "demo" ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1 w-full order-2 md:order-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] uppercase tracking-widest text-purple-400 font-bold bg-purple-900/20 px-2 py-1 rounded border border-purple-500/30"
                              style={{ fontFamily: "sans-serif" }}
                            >
                              Giliran Anda
                            </span>
                            <span
                              className="text-xs text-slate-500 hidden md:inline"
                              style={{ fontFamily: "sans-serif" }}
                            >
                              Baca teks Arab berikut:
                            </span>
                          </div>
                          <button
                            onClick={() => speakArabic(userPrompt)}
                            className="text-slate-500 hover:text-purple-400 transition-colors"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-purple-500/30 rounded-xl p-3 md:p-4 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                          <p
                            className="text-xl md:text-2xl font-arabic text-purple-100 leading-relaxed text-right drop-shadow-md"
                            dir="rtl"
                          >
                            {userPrompt}
                          </p>
                        </div>
                      </div>

                      <div className="order-1 md:order-2 flex flex-col items-center">
                        <button
                          onClick={handleMicToggle}
                          className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300 group shadow-lg ${
                            isListening
                              ? "bg-red-500/20 border-red-500 scale-100 animate-pulse"
                              : "bg-purple-500/10 border-purple-500 hover:bg-purple-500/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                          }`}
                        >
                          {isListening ? (
                            <StopCircle size={32} className="text-red-500" />
                          ) : (
                            <Mic
                              size={32}
                              className="text-purple-400 group-hover:text-purple-300"
                            />
                          )}
                        </button>
                        <span
                          className="text-[10px] uppercase tracking-widest mt-2 font-bold text-slate-400"
                          style={{ fontFamily: "sans-serif" }}
                        >
                          {isListening ? "Klik untuk Kirim" : "Klik & Bicara"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center h-20 text-slate-500 gap-3"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      {conversationStep >= currentScenario.dialogue.length ? (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <CheckCircle
                            className="text-green-500 mb-1"
                            size={24}
                          />
                          <span className="text-green-400 font-bold">
                            Sesi Selesai
                          </span>
                          <button
                            onClick={() => resetSession(interactionMode)}
                            className="text-xs flex items-center gap-1 mt-1 text-slate-400 hover:text-white"
                          >
                            <RotateCcw size={12} /> Ulangi
                          </button>
                        </div>
                      ) : interactionMode === "demo" ? (
                        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                          <MonitorPlay size={20} />
                          <span>Memainkan Demo Percakapan...</span>
                        </div>
                      ) : (
                        <span className="animate-pulse flex items-center gap-2">
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                          {aiSpeaking ? "Mendengarkan AI..." : "Menunggu..."}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "vocab" && (
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BookOpen className="text-purple-400" />
                  Kosakata:{" "}
                  <span className="font-arabic">{currentScenario.title}</span>
                </h2>
                <div className="text-xs bg-slate-800 px-3 py-1 rounded text-slate-400 border border-slate-700">
                  {currentScenario.vocab.length} Kata
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentScenario.vocab.map((v, idx) => (
                  <div
                    key={idx}
                    className="group relative h-48 perspective-1000"
                  >
                    <div
                      className="absolute inset-0 bg-slate-800/40 border border-cyan-500/30 rounded-xl backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:-translate-y-2 cursor-pointer"
                      onClick={() => speakArabic(v.word)}
                    >
                      <h3 className="text-3xl font-arabic text-cyan-100">
                        {v.word}
                      </h3>
                      <div className="h-px w-12 bg-cyan-500/50"></div>
                      <p
                        className="text-slate-400 text-sm font-medium tracking-wide"
                        style={{ fontFamily: "sans-serif" }}
                      >
                        {v.meaning}
                      </p>
                      <div className="mt-2 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                        <Volume2 size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer
        className="w-full bg-slate-950 border-t border-cyan-900/30 py-2 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest z-50 pointer-events-none shrink-0 gap-2"
        style={{ fontFamily: "sans-serif" }}
      >
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{" "}
            SYSTEM ONLINE
          </span>
        </div>
        <div className="text-center md:text-right font-medium text-slate-400">
          Natiq AI • Didesain & Dikembangkan oleh{" "}
          <span className="text-cyan-500">David Satria Kaunang</span> •
          Mahasiswa Bahasa Arab
        </div>
      </footer>
    </div>
  );
};

export default NatiqAI;
