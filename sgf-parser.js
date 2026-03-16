/**
 * sgf-parser.js
 * ─────────────────────────────────────────────────────────────
 * SGF parser — iki format destekler:
 *
 * FORMAT A: Ayrı problem blokları (tsumego tarzı)
 *   (;FF[4]SZ[9]PL[B]AB[cd]AW[ef](;B[fg]))
 *   (;FF[4]SZ[9]...)
 *
 * FORMAT B: Tek büyük ağaç (Kogo Joseki Dictionary tarzı)
 *   (;GM[1]FF[4]SZ[19]...
 *     (;B[qc]LB[pd:a][od:b]C[açıklama]
 *       (;W[pd]...)
 *       (;W[od]...)
 *     )
 *   )
 */

const SGFParser = (() => {

  /* ── Koordinat dönüşümleri ── */
  function sgfCoordToXY(coord, size) {
    if (!coord || coord === '' || coord === 'tt' || coord === 'pass') return null;
    const x = coord.charCodeAt(0) - 97;
    const y = coord.charCodeAt(1) - 97;
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return [x, y];
  }

  function xyToCoordStr(x, y) { return `${x},${y}`; }

  /* ── Props ayıkla ── */
  function extractProps(nodeStr) {
    const props = {};
    const re = /([A-Z]+)\s*((?:\[[^\]]*\]\s*)+)/g;
    let m;
    while ((m = re.exec(nodeStr)) !== null) {
      const key = m[1];
      const vals = [];
      const valRe = /\[([^\]]*)\]/g;
      let vm;
      while ((vm = valRe.exec(m[2])) !== null) {
        vals.push(vm[1].replace(/\\(.)/g, '$1'));
      }
      props[key] = vals;
    }
    return props;
  }

  /* ── SGF tokenizer — parantez dikkate alarak böl ── */
  function tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
      if (str[i] === '(') { tokens.push({ type: 'OPEN' }); i++; }
      else if (str[i] === ')') { tokens.push({ type: 'CLOSE' }); i++; }
      else if (str[i] === ';') {
        // Node içeriğini topla
        let content = '';
        i++;
        while (i < str.length && str[i] !== ';' && str[i] !== '(' && str[i] !== ')') {
          if (str[i] === '[') {
            content += str[i++];
            while (i < str.length && str[i] !== ']') {
              if (str[i] === '\\') { content += str[i++]; }
              content += str[i++];
            }
            if (i < str.length) content += str[i++]; // kapanan ]
          } else {
            content += str[i++];
          }
        }
        tokens.push({ type: 'NODE', content });
      } else {
        i++;
      }
    }
    return tokens;
  }

  /* ── Token dizisinden ağaç kur ── */
  function buildTree(tokens, pos = { i: 0 }) {
    const node = { props: {}, children: [] };
    let currentProps = {};

    while (pos.i < tokens.length) {
      const tok = tokens[pos.i];

      if (tok.type === 'OPEN') {
        pos.i++;
        const child = buildTree(tokens, pos);
        node.children.push(child);
      } else if (tok.type === 'CLOSE') {
        pos.i++;
        break;
      } else if (tok.type === 'NODE') {
        const p = extractProps(tok.content);
        Object.assign(node.props, p);
        pos.i++;
      } else {
        pos.i++;
      }
    }

    return node;
  }

  /* ── Koleksiyondaki oyunları böl ── */
  function splitCollection(text) {
    const games = [];
    let depth = 0, start = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '[') {
        i++;
        while (i < text.length && text[i] !== ']') {
          if (text[i] === '\\') i++;
          i++;
        }
        continue;
      }
      if (text[i] === '(') { if (depth === 0) start = i; depth++; }
      else if (text[i] === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          games.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
    return games;
  }

  /* ════════════════════════════════════════
     FORMAT A: Ayrı problem blokları
  ════════════════════════════════════════ */
  function parseSeparateProblems(text, type, level) {
    const games = splitCollection(text);
    const problems = [];

    games.forEach((gameStr, i) => {
      try {
        const tokens = tokenize(gameStr);
        const pos = { i: 0 };
        if (tokens[0]?.type === 'OPEN') pos.i++;
        const tree = buildTree(tokens, pos);
        const props = tree.props;

        const size = parseInt(props.SZ?.[0] || '19');
        let turn = 'black';
        if (props.PL) turn = props.PL[0].toUpperCase() === 'W' ? 'white' : 'black';

        const board = [];
        (props.AB || []).forEach(c => {
          const xy = sgfCoordToXY(c, size);
          if (xy) board.push(`B:${xy[0]},${xy[1]}`);
        });
        (props.AW || []).forEach(c => {
          const xy = sgfCoordToXY(c, size);
          if (xy) board.push(`W:${xy[0]},${xy[1]}`);
        });

        // Çözüm: ilk child'daki hamle
        const solutions = [];
        const wrongs = [];
        const moveKey = turn === 'black' ? 'B' : 'W';

        tree.children.forEach((child, idx) => {
          const mv = child.props[moveKey]?.[0];
          if (mv) {
            const xy = sgfCoordToXY(mv, size);
            if (xy) {
              if (idx === 0) solutions.push(xyToCoordStr(xy[0], xy[1]));
              else wrongs.push(xyToCoordStr(xy[0], xy[1]));
            }
          }
        });

        if (board.length === 0 && solutions.length === 0) return;

        problems.push({
          id:    `sgf_${type}_${i}`,
          type:  type || 'tsumego',
          level: level || guessLevel(solutions.length),
          title: cleanText(props.GN?.[0] || props.PB?.[0] || `Problem ${i + 1}`),
          desc:  cleanText(props.C?.[0] || 'Doğru hamleyi bul.'),
          hint:  cleanText(props.GC?.[0] || ''),
          size, turn, board, solution: solutions, wrong: wrongs, sgf: true,
        });
      } catch (e) {
        console.warn(`Problem ${i} parse hatası:`, e);
      }
    });

    return problems;
  }

  /* ════════════════════════════════════════
     FORMAT B: Tek büyük ağaç (Kogo tarzı)
     Her LB etiketi olan düğüm = problem
  ════════════════════════════════════════ */
  function parseTreeFormat(text, type, level) {
    const problems = [];
    const games = splitCollection(text);
    if (!games.length) return problems;

    const tokens = tokenize(games[0]);
    const pos = { i: 0 };
    if (tokens[0]?.type === 'OPEN') pos.i++;
    const root = buildTree(tokens, pos);

    const rootProps = root.props;
    const size = parseInt(rootProps.SZ?.[0] || '19');

    let counter = 0;

    // Ağacı dolaş, LB veya C içeren düğümleri problem yap
    function traverse(node, moveStack, boardState) {
      const props = node.props;

      // Mevcut hamleyi stack'e ekle
      const newStack = [...moveStack];
      const newBoard = boardState.map(r => [...r]);

      // AB/AW başlangıç taşları (kök düğümde)
      if (props.AB || props.AW) {
        (props.AB || []).forEach(c => {
          const xy = sgfCoordToXY(c, size);
          if (xy) newBoard[xy[1]][xy[0]] = 'B';
        });
        (props.AW || []).forEach(c => {
          const xy = sgfCoordToXY(c, size);
          if (xy) newBoard[xy[1]][xy[0]] = 'W';
        });
      }

      // B/W hamle
      const bMove = props.B?.[0];
      const wMove = props.W?.[0];
      if (bMove) {
        const xy = sgfCoordToXY(bMove, size);
        if (xy) { newBoard[xy[1]][xy[0]] = 'B'; newStack.push({ color: 'black', xy }); }
      }
      if (wMove) {
        const xy = sgfCoordToXY(wMove, size);
        if (xy) { newBoard[xy[1]][xy[0]] = 'W'; newStack.push({ color: 'white', xy }); }
      }

      // LB veya C içeriyorsa ve birden fazla child varsa → problem
      const hasLB = props.LB && props.LB.length > 0;
      const hasC  = props.C && props.C[0] && props.C[0].length > 20;
      const hasMultiChild = node.children.length > 1;

      if ((hasLB || hasC) && hasMultiChild && newStack.length > 0) {
        // Mevcut board durumunu problem başlangıcı say
        const lastMove = newStack[newStack.length - 1];
        const turn = lastMove.color === 'black' ? 'white' : 'black';
        const moveKey = turn === 'black' ? 'B' : 'W';

        // Board'dan taşları çıkar
        const board = [];
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            if (newBoard[y][x] === 'B') board.push(`B:${x},${y}`);
            else if (newBoard[y][x] === 'W') board.push(`W:${x},${y}`);
          }
        }

        // Child'lardan çözüm hamleleri al
        const solutions = [];
        const wrongs    = [];
        node.children.forEach((child, idx) => {
          const mv = child.props[moveKey]?.[0];
          if (mv) {
            const xy = sgfCoordToXY(mv, size);
            if (xy) {
              if (idx === 0) solutions.push(xyToCoordStr(xy[0], xy[1]));
              else wrongs.push(xyToCoordStr(xy[0], xy[1]));
            }
          }
        });

        if (solutions.length > 0 && board.length > 0 && counter < 500) {
          const desc = cleanText(props.C?.[0] || 'Doğru devamı bul.');
          const title = desc.slice(0, 60).split('\n')[0] || `${type} Problem ${counter + 1}`;

          problems.push({
            id:       `sgf_${type}_${counter}`,
            type:     type || 'joseki',
            level:    level || 'beginner',
            title:    cleanText(title),
            desc:     desc.slice(0, 200),
            hint:     '',
            size, turn, board,
            solution: solutions,
            wrong:    wrongs,
            sgf: true,
          });
          counter++;
        }
      }

      // Alt dallara devam et (max derinlik 30)
      if (moveStack.length < 30) {
        node.children.forEach(child => {
          traverse(child, newStack, newBoard);
        });
      }
    }

    const emptyBoard = Array.from({ length: size }, () => Array(size).fill(null));
    traverse(root, [], emptyBoard);

    console.log(`Ağaç formatı: ${counter} problem bulundu`);
    return problems;
  }

  /* ── Yardımcılar ── */
  function guessLevel(solutionCount) {
    if (solutionCount <= 1) return 'beginner';
    if (solutionCount <= 3) return 'intermediate';
    return 'advanced';
  }

  function cleanText(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  /* ── Format algılama ── */
  function detectFormat(text) {
    const games = splitCollection(text);
    if (games.length > 1) return 'separate'; // Birden fazla blok = FORMAT A
    // Tek blok ama LB içeriyor = FORMAT B (Kogo tarzı)
    if (text.includes('LB[') || text.includes(']C[')) return 'tree';
    return 'separate';
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════ */

  function parseCollection(text, type = 'tsumego', level = null) {
    const format = detectFormat(text);
    console.log(`SGF format: ${format}`);

    if (format === 'tree') {
      return parseTreeFormat(text, type, level);
    } else {
      return parseSeparateProblems(text, type, level);
    }
  }

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

  async function loadSingle(url, type, level) {
    const text = await fetch(url).then(r => r.text());
    return parseCollection(text, type, level);
  }

  return { parseCollection, loadCollections, loadSingle, sgfCoordToXY, xyToCoordStr };

})();
