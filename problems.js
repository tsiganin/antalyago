// problems.js — Go Problem Veritabanı
// Her problem SGF benzeri format:
// board: ['B:D4', 'W:C4', ...] — başlangıç taşları
// turn: 'black' | 'white' — kimin oynayacağı
// solution: [[x,y], ...] — doğru hamle(ler)
// wrong: [[x,y], ...] — yanlış hamleler (opsiyonel)
// size: tahta boyutu
// type: 'tsumego' | 'joseki' | 'tesuji' | 'endgame'
// level: 'beginner' | 'intermediate' | 'advanced'

const PROBLEMS = [

  /* ═══════════════════════════════
     TSUMEGO — Başlangıç
  ═══════════════════════════════ */
  {
    id: 't1',
    type: 'tsumego',
    level: 'beginner',
    title: 'Atari!',
    desc: 'Beyaz taşı yakala.',
    size: 9,
    turn: 'black',
    board: [
      'W:4,4',
      'B:3,4', 'B:4,3', 'B:5,4',
    ],
    solution: [['4,5']],
    hint: 'Beyaz taşın son libertysi nerede?',
  },
  {
    id: 't2',
    type: 'tsumego',
    level: 'beginner',
    title: 'Köşe Tuzağı',
    desc: 'Beyaz grubu yakala.',
    size: 9,
    turn: 'black',
    board: [
      'W:1,1', 'W:2,1',
      'B:1,2', 'B:2,2', 'B:3,1',
    ],
    solution: [['1,0']],
    hint: 'Köşe avantajını kullan.',
  },
  {
    id: 't3',
    type: 'tsumego',
    level: 'beginner',
    title: 'Snapback',
    desc: 'Siyah geri çekme tuzağını kur.',
    size: 9,
    turn: 'black',
    board: [
      'W:4,3', 'W:5,3', 'W:4,4',
      'B:3,3', 'B:3,4', 'B:4,5', 'B:5,4', 'B:6,3',
    ],
    solution: [['5,4']],
    hint: 'Önce kurban ver.',
  },
  {
    id: 't4',
    type: 'tsumego',
    level: 'intermediate',
    title: 'İki Göz',
    desc: 'Beyazın iki göz yapmasını engelle.',
    size: 9,
    turn: 'black',
    board: [
      'W:3,3', 'W:4,3', 'W:5,3',
      'W:3,4',           'W:5,4',
      'W:3,5', 'W:4,5', 'W:5,5',
      'B:2,3', 'B:2,4', 'B:2,5',
      'B:6,3', 'B:6,4', 'B:6,5',
      'B:3,2', 'B:4,2', 'B:5,2',
      'B:3,6', 'B:4,6', 'B:5,6',
    ],
    solution: [['4,4']],
    hint: 'Merkezi kontrol et.',
  },
  {
    id: 't5',
    type: 'tsumego',
    level: 'intermediate',
    title: 'Ko Tehdidi',
    desc: 'Ko savaşı başlat.',
    size: 9,
    turn: 'black',
    board: [
      'W:4,4', 'W:5,4',
      'W:4,5',
      'B:3,4', 'B:4,3', 'B:6,4',
      'B:3,5', 'B:5,5', 'B:4,6',
    ],
    solution: [['5,5']],
    hint: 'Ko pozisyonu oluştur.',
  },
  {
    id: 't6',
    type: 'tsumego',
    level: 'advanced',
    title: 'Çift Tehdit',
    desc: 'İki yönden aynı anda tehdit et.',
    size: 9,
    turn: 'black',
    board: [
      'W:3,3', 'W:4,3', 'W:5,3',
      'W:3,4',           'W:5,4',
      'B:2,3', 'B:6,3',
      'B:2,4', 'B:6,4',
      'B:3,2', 'B:4,2', 'B:5,2',
      'B:3,5', 'B:4,5', 'B:5,5',
    ],
    solution: [['4,4']],
    hint: 'Vital nokta nerede?',
  },

  /* ═══════════════════════════════
     JOSEKİ — Köşe Açılışları
  ═══════════════════════════════ */
  {
    id: 'j1',
    type: 'joseki',
    level: 'beginner',
    title: '3-4 Noktası Tepkisi',
    desc: 'Beyazın köşe hamlesine doğru joseki devamını oyna.',
    size: 9,
    turn: 'black',
    board: [
      'W:3,3',
      'B:6,3',
    ],
    solution: [['3,6'], ['3,5'], ['2,3']],
    hint: 'Köşeyi sıkıştır veya uzat.',
  },
  {
    id: 'j2',
    type: 'joseki',
    level: 'beginner',
    title: 'Shimari — Köşe Kapama',
    desc: 'Köşeni en verimli şekilde kapat.',
    size: 9,
    turn: 'black',
    board: [
      'B:3,3',
    ],
    solution: [['5,3'], ['3,5']],
    hint: 'Köşeyi iki taraftan koru.',
  },
  {
    id: 'j3',
    type: 'joseki',
    level: 'intermediate',
    title: 'Kakari — Köşe Saldırısı',
    desc: 'Beyazın köşesine en iyi şekilde saldır.',
    size: 9,
    turn: 'black',
    board: [
      'W:3,3',
      'B:3,7', 'B:7,3',
    ],
    solution: [['5,3'], ['3,5']],
    hint: 'Köşeyi dışarıdan bask altına al.',
  },
  {
    id: 'j4',
    type: 'joseki',
    level: 'intermediate',
    title: 'Hasami — Sıkıştırma',
    desc: 'Beyazın taşını iki taraftan sıkıştır.',
    size: 9,
    turn: 'black',
    board: [
      'W:4,4',
      'B:4,7',
    ],
    solution: [['4,2'], ['7,4']],
    hint: 'Sıkıştırmak için hangi mesafe?',
  },

  /* ═══════════════════════════════
     TESUJİ — Taktik Hamleler
  ═══════════════════════════════ */
  {
    id: 'te1',
    type: 'tesuji',
    level: 'beginner',
    title: 'Uzatma',
    desc: 'Taşlarını bağla, kesmeyi engelle.',
    size: 9,
    turn: 'black',
    board: [
      'B:3,4', 'B:5,4',
      'W:4,3', 'W:4,5',
    ],
    solution: [['4,4']],
    hint: 'Boşluğu doldur.',
  },
  {
    id: 'te2',
    type: 'tesuji',
    level: 'beginner',
    title: 'Köprü Altı',
    desc: 'Beyazın altından geç.',
    size: 9,
    turn: 'black',
    board: [
      'W:3,3', 'W:5,3',
      'B:4,5',
    ],
    solution: [['4,3']],
    hint: 'İki beyaz taş arasından geç.',
  },
  {
    id: 'te3',
    type: 'tesuji',
    level: 'intermediate',
    title: 'Merdiven Kaçışı',
    desc: 'Merdiven tuzağından kaç.',
    size: 9,
    turn: 'black',
    board: [
      'B:5,5',
      'W:4,5', 'W:5,4',
      'W:6,5', 'W:5,6',
    ],
    solution: [['6,4']],
    hint: 'Köşegen hareketi dene.',
  },
  {
    id: 'te4',
    type: 'tesuji',
    level: 'intermediate',
    title: 'Çengel',
    desc: 'Beyaz grubunu çengelle.',
    size: 9,
    turn: 'black',
    board: [
      'W:4,3', 'W:5,3', 'W:6,3',
      'B:3,3', 'B:3,4',
    ],
    solution: [['4,4']],
    hint: 'Grubun hareketini engelle.',
  },
  {
    id: 'te5',
    type: 'tesuji',
    level: 'advanced',
    title: 'Boomerang',
    desc: 'Kurban vererek büyük kazanım sağla.',
    size: 9,
    turn: 'black',
    board: [
      'B:4,4', 'B:5,4', 'B:4,5',
      'W:5,5', 'W:6,4', 'W:4,3', 'W:3,4',
      'W:6,5', 'W:5,6', 'W:3,5',
    ],
    solution: [['5,3']],
    hint: 'Fedakarlık yap.',
  },

  /* ═══════════════════════════════
     ENDGAME — Yapı Bitirme
  ═══════════════════════════════ */
  {
    id: 'e1',
    type: 'endgame',
    level: 'beginner',
    title: 'Son Hamle',
    desc: 'En büyük endgame hamlesini bul.',
    size: 9,
    turn: 'black',
    board: [
      'B:1,1', 'B:2,1', 'B:3,1',
      'B:1,2', 'B:2,2', 'B:3,2',
      'W:5,5', 'W:6,5', 'W:7,5',
      'W:5,6', 'W:6,6', 'W:7,6',
    ],
    solution: [['4,1'], ['4,2']],
    hint: 'Sınırı netleştir.',
  },
  {
    id: 'e2',
    type: 'endgame',
    level: 'beginner',
    title: 'Seki Tanıma',
    desc: 'Bu pozisyon seki mi? Dokunma!',
    size: 9,
    turn: 'black',
    board: [
      'B:3,3', 'B:4,2', 'B:2,4',
      'W:3,2', 'W:2,3', 'W:4,3', 'W:3,4',
    ],
    solution: [['5,3'], ['3,5'], ['1,3'], ['3,1']],
    hint: 'Bu seki — içerideki noktalara dokunma.',
  },
  {
    id: 'e3',
    type: 'endgame',
    level: 'intermediate',
    title: 'Gote vs Sente',
    desc: 'Sente endgame hamlesini oyna.',
    size: 9,
    turn: 'black',
    board: [
      'B:1,4', 'B:2,4', 'B:3,4', 'B:4,4',
      'B:4,3', 'B:4,2', 'B:4,1',
      'W:1,5', 'W:2,5', 'W:3,5', 'W:4,5',
      'W:5,5', 'W:5,4', 'W:5,3',
    ],
    solution: [['5,1'], ['5,2']],
    hint: 'Rakibi cevap vermek zorunda bırak.',
  },
  {
    id: 'e4',
    type: 'endgame',
    level: 'advanced',
    title: 'Çift Sente',
    desc: 'Çift sente hamlesini bul.',
    size: 9,
    turn: 'black',
    board: [
      'B:2,2', 'B:3,2', 'B:4,2',
      'B:2,3',           'B:4,3',
      'W:2,4', 'W:3,4', 'W:4,4',
      'W:2,5',           'W:4,5',
      'W:1,2', 'W:1,3',
      'B:5,4', 'B:5,5',
    ],
    solution: [['3,3']],
    hint: 'Her iki taraf için de önemli.',
  },
];

// Filtreleme yardımcıları
function getByType(type) {
  return PROBLEMS.filter(p => p.type === type);
}

function getByLevel(level) {
  return PROBLEMS.filter(p => p.level === level);
}

function getByTypeAndLevel(type, level) {
  return PROBLEMS.filter(p => p.type === type && p.level === level);
}

function getRandom(type, level) {
  const pool = type && level
    ? getByTypeAndLevel(type, level)
    : type ? getByType(type)
    : level ? getByLevel(level)
    : PROBLEMS;
  if (!pool.length) return PROBLEMS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
