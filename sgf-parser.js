/**
 * sgf-parser.js
 * ─────────────────────────────────────────────────────────────
 * SGF (Smart Game Format) koleksiyon parser'ı
 *
 * Desteklenen özellikler:
 *  - Tek problem ve koleksiyon (birden fazla (;...) bloğu)
 *  - AB/AW taş yerleştirme (başlangıç pozisyonu)
 *  - B/W hamle notasyonu
 *  - PL (oyuncu sırası)
 *  - SZ (tahta boyutu)
 *  - GN/C/PB/PW (başlık, açıklama, oyuncu adları)
 *  - Varyasyon ağacı (çözüm / yanlış hamle dalları)
 *  - LB etiketleri
 *
 * Kullanım:
 *   const text = await fetch('problems/tsumego.sgf').then(r=>r.text());
 *   const problems = SGFParser.parseCollection(text);
 *   // problems: [{ id, title, desc, size, turn, board, solution, wrong, hint }, ...]
 */

const SGFParser = (() => {

  /* ── Koordinat dönüşümü ──
     SGF: 'aa' = [0,0] sol-üst, 'a'=0, 'b'=1, ...
     Bizim format: [x, y] piksel koordinatı (0=sol, 0=üst)
  */
  function sgfCoordToXY(coord, size) {
    if (!coord || coord === '' || coord === 'tt') return null; // pas
    const x = coord.charCodeAt(0) - 97; // 'a'=0
    const y = coord.charCodeAt(1) - 97;
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return [x, y];
  }

  function xyToCoordStr(x, y) {
    return `${x},${y}`;
  }

  /* ── Token'ları ayıkla ──
     SGF prop değerlerini [val1, val2, ...] dizisine çevirir
  */
  function extractProps(nodeStr) {
    const props = {};
    // Regex: PROPNAME[value1][value2]...
    const re = /([A-Z]+)\s*((?:\[[^\]]*\]\s*)+)/g;
    let m;
    while ((m = re.exec(nodeStr)) !== null) {
      const key = m[1];
      const vals = [];
      const valRe = /\[([^\]]*)\]/g;
      let vm;
      while ((vm = valRe.exec(m[2])) !== null) {
        vals.push(vm[1].replace(/\\(.)/g, '$1')); // escape kaldır
      }
      props[key] = vals;
    }
    return props;
  }

  /* ── SGF ağacını düğümlere böl ──
     "(;...)" formatındaki ağacı recursive parse eder
     Döndürür: { props, children: [...] }
  */
  function parseTree(str, pos = { i: 0 }) {
    const node = { props: {}, children: [] };
    let nodeStr = '';

    while (pos.i < str.length) {
      const ch = str[pos.i];

      if (ch === '(') {
        // Alt dal başlıyor
        pos.i++;
        const child = parseTree(str, pos);
        node.children.push(child);
      } else if (ch === ')') {
        // Bu dal bitiyor
        pos.i++;
        break;
      } else if (ch === ';') {
        // Yeni node — mevcut nodeStr'yi işle
        if (nodeStr.trim()) {
          const p = extractProps(nodeStr);
          Object.assign(node.props, p);
        }
        nodeStr = '';
        pos.i++;
      } else {
        nodeStr += ch;
        pos.i++;
      }
    }

    // Kalan nodeStr
    if (nodeStr.trim()) {
      const p = extractProps(nodeStr);
      Object.assign(node.props, p);
    }

    return node;
  }

  /* ── Koleksiyondaki tüm oyunları bul ──
     "(;FF[4]...)(;FF[4]...)" → her biri ayrı problem
  */
  function splitCollection(text) {
    const games = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      // Köşeli parantez içini atla (escape'li içerikler)
      if (text[i] === '[') {
        i++;
        while (i < text.length && text[i] !== ']') {
          if (text[i] === '\\') i++;
          i++;
        }
        continue;
      }

      if (text[i] === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (text[i] === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          games.push(text.slice(start + 1, i)); // parantezler hariç
          start = -1;
        }
      }
    }

    return games;
  }

  /* ── Varyasyon ağacından çözüm ve yanlış hamleleri çıkar ──
     SGF'de:
       (;B[cd]) → siyah doğru hamle
       (;B[cd];W[de]) → siyah oynar, beyaz cevap verir
     Birden fazla varyasyon varsa ilki doğru, diğerleri yanlış kabul edilir
  */
  function extractSolutionFromTree(tree, size, turn) {
    const solutions = [];
    const wrongs    = [];

    function traverse(node, depth, isSolution) {
      const props = node.props;
      const moveKey = turn === 'black' ? 'B' : 'W';

      if (depth === 0 && props[moveKey]) {
        const coord = sgfCoordToXY(props[moveKey][0], size);
        if (coord) {
          if (isSolution) solutions.push(xyToCoordStr(coord[0], coord[1]));
          else wrongs.push(xyToCoordStr(coord[0], coord[1]));
        }
      }

      node.children.forEach((child, idx) => {
        traverse(child, depth + 1, isSolution && idx === 0);
      });
    }

    // Ana ağacın children'ları varyasyonlar
    tree.children.forEach((child, idx) => {
      traverse(child, 0, idx === 0);
    });

    return { solutions, wrongs };
  }

  /* ── Tek SGF oyununu problem nesnesine dönüştür ── */
  function gameToProblems(gameStr, collectionType, collectionLevel, index) {
    const pos  = { i: 0 };
    const tree = parseTree(gameStr + ')', pos); // kapanış parantezi ekle
    const props = tree.props;

    // Tahta boyutu
    const size = parseInt(props.SZ?.[0] || '19');

    // Oyuncu sırası
    let turn = 'black';
    if (props.PL) {
      turn = props.PL[0].toUpperCase() === 'W' ? 'white' : 'black';
    } else if (props.C) {
      const c = props.C[0].toLowerCase();
      if (c.includes('white') || c.includes('beyaz') || c.includes('w plays')) turn = 'white';
    }

    // Başlangıç taşları
    const board = [];
    (props.AB || []).forEach(coord => {
      const xy = sgfCoordToXY(coord, size);
      if (xy) board.push(`B:${xy[0]},${xy[1]}`);
    });
    (props.AW || []).forEach(coord => {
      const xy = sgfCoordToXY(coord, size);
      if (xy) board.push(`W:${xy[0]},${xy[1]}`);
    });

    // Çözüm ve yanlış hamleler
    const { solutions, wrongs } = extractSolutionFromTree(tree, size, turn);

    // Başlık & açıklama
    const title = props.GN?.[0] || props.PB?.[0] || `Problem ${index + 1}`;
    const desc  = props.C?.[0]?.slice(0, 200) || 'Doğru hamleyi bul.';
    const hint  = props.GC?.[0] || props.BL?.[0] || '';

    // Tür ve seviye — dosya adından veya props'tan
    const type  = collectionType  || guessType(props);
    const level = collectionLevel || guessLevel(props, solutions.length);

    return {
      id:       `sgf_${type}_${index}`,
      type,
      level,
      title:    cleanText(title),
      desc:     cleanText(desc),
      hint:     cleanText(hint),
      size,
      turn,
      board,
      solution: solutions,
      wrong:    wrongs,
      sgf:      true, // SGF'den geldiğini işaretle
    };
  }

  /* ── Tip tahmini (SGF props'tan) ── */
  function guessType(props) {
    const text = [
      props.GN?.[0] || '',
      props.C?.[0]  || '',
      props.EV?.[0] || '',
    ].join(' ').toLowerCase();

    if (text.includes('tsumego') || text.includes('life') || text.includes('death') ||
        text.includes('capture') || text.includes('yakalama') || text.includes('canlılık'))
      return 'tsumego';
    if (text.includes('joseki') || text.includes('corner') || text.includes('köşe'))
      return 'joseki';
    if (text.includes('tesuji') || text.includes('tactic') || text.includes('taktik'))
      return 'tesuji';
    if (text.includes('endgame') || text.includes('yose') || text.includes('bitiş'))
      return 'endgame';
    return 'tsumego'; // varsayılan
  }

  /* ── Seviye tahmini ── */
  function guessLevel(props, solutionCount) {
    const text = [props.GN?.[0] || '', props.C?.[0] || ''].join(' ').toLowerCase();

    if (text.includes('beginner') || text.includes('başlangıç') || text.includes('easy') || text.includes('kolay'))
      return 'beginner';
    if (text.includes('advanced') || text.includes('ileri') || text.includes('hard') || text.includes('zor'))
      return 'advanced';
    if (text.includes('intermediate') || text.includes('orta') || text.includes('medium'))
      return 'intermediate';

    // Çözüm sayısına göre tahmin
    if (solutionCount <= 1) return 'beginner';
    if (solutionCount <= 3) return 'intermediate';
    return 'advanced';
  }

  function cleanText(str) {
    return str.replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════ */

  /**
   * Tek SGF dosyasını parse et
   * @param {string} text - SGF dosyasının içeriği
   * @param {string} type - 'tsumego' | 'joseki' | 'tesuji' | 'endgame'
   * @param {string} level - 'beginner' | 'intermediate' | 'advanced' (opsiyonel)
   * @returns {Array} Problem nesneleri dizisi
   */
  function parseCollection(text, type = 'tsumego', level = null) {
    const games = splitCollection(text);
    const problems = [];

    games.forEach((gameStr, i) => {
      try {
        const p = gameToProblems(gameStr, type, level, i);
        if (p.board.length > 0 || p.solution.length > 0) {
          problems.push(p);
        }
      } catch (e) {
        console.warn(`SGF problem ${i} parse hatası:`, e);
      }
    });

    return problems;
  }

  /**
   * Birden fazla SGF koleksiyonu yükle
   * @param {Array} collections - [{url, type, level}, ...]
   * @returns {Promise<Array>} Tüm problemler birleşik
   */
  async function loadCollections(collections) {
    const allProblems = [];

    for (const col of collections) {
      try {
        const text = await fetch(col.url).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        });
        const problems = parseCollection(text, col.type, col.level);
        allProblems.push(...problems);
        console.log(`✓ ${col.url}: ${problems.length} problem yüklendi`);
      } catch (e) {
        console.warn(`✗ ${col.url} yüklenemedi:`, e.message);
      }
    }

    return allProblems;
  }

  /**
   * Tek SGF dosyası yükle
   * @param {string} url
   * @param {string} type
   * @param {string} level
   */
  async function loadSingle(url, type, level) {
    const text = await fetch(url).then(r => r.text());
    return parseCollection(text, type, level);
  }

  return { parseCollection, loadCollections, loadSingle, sgfCoordToXY, xyToCoordStr };

})();
