(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = new Date(); today.setHours(0,0,0,0);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseYmd = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const WD = ['일','월','화','수','목','금','토'];
  const fmtDate = (d) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  const fmtKo = (d) => `${d.getMonth()+1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
  let toastTimer;
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 2400); };

  /* ---------- 예시 영화 (등록된 영화가 하나도 없을 때만 보임) ---------- */
  const EXAMPLES = [
    { id: 'm1', title: '서울 하이스트', en: 'SEOUL HEIST', rate: '15', genre: '범죄, 액션', run: 126, rel: -12, c: ['#1B2A4A', '#C0392B'], dir: '한도윤',
      syn: '은퇴를 앞둔 금고털이 전문가가 마지막으로 서울 한복판의 국제 경매장을 노린다. 완벽해 보이던 계획은 팀 안에 숨어든 내부 고발자 때문에 하룻밤 사이에 뒤틀리기 시작한다.',
      cast: [['강태준', '진혁'], ['오세린', '하나'], ['문재호', '박 반장']] },
    { id: 'm2', title: '심해의 문', en: 'THE ABYSS GATE', rate: '12', genre: 'SF, 어드벤처', run: 142, rel: -5, c: ['#05445E', '#189AB4'], dir: '서지안',
      syn: '수심 1만 미터 해구에서 정체불명의 구조물이 발견된다. 탐사대를 이끄는 해양학자 유진은 구조물 안에서 30년 전 실종된 아버지의 기록을 찾아낸다.',
      cast: [['윤하경', '유진'], ['박도현', '선장 민혁'], ['정아름', '엔지니어 소라']] },
    { id: 'm3', title: '별을 그리는 고양이', en: 'STAR PAINTER', rate: 'all', genre: '애니메이션, 가족', run: 96, rel: -8, c: ['#F49D1A', '#8E44AD'], dir: '김하늘',
      syn: '밤마다 지붕 위에서 별을 그리던 고양이 모모는 어느 날 하늘의 별이 하나씩 사라지는 것을 알아챈다.',
      cast: [['한소리', '모모 (목소리)'], ['장민재', '두부 (목소리)']] },
    { id: 'm5', title: '검은 겨울', en: 'BLACK WINTER', rate: '19', genre: '스릴러', run: 111, rel: -3, c: ['#111111', '#4A6670'], dir: '조현석',
      syn: '폭설로 고립된 산골 마을에서 연쇄 실종 사건이 일어난다. 휴가 중이던 형사 은수는 마을 사람 모두가 무언가를 숨기고 있다는 사실을 깨닫는다.',
      cast: [['차은수', '형사 은수'], ['임태성', '이장']] },
    { id: 'm7', title: '파도 위의 집', en: 'HOUSE ON THE WAVES', rate: '15', genre: '로맨스', run: 109, rel: 3, c: ['#3D5A80', '#EE6C4D'], dir: '안소희',
      syn: '제주 바닷가의 낡은 집을 고치러 온 건축가와 그 집에서 평생을 산 서퍼가 한 계절 동안 함께 집을 고치며 서로의 상처를 마주한다.',
      cast: [['진서준', '건축가 태오'], ['하윤슬', '서퍼 바다']] },
    { id: 'm8', title: '레드 시그널', en: 'RED SIGNAL', rate: '15', genre: '액션', run: 131, rel: 6, c: ['#2B0F0F', '#D62828'], dir: '마준혁',
      syn: '도심 전체의 신호 체계를 장악한 해커 집단이 24시간의 카운트다운을 시작한다.',
      cast: [['강태준', '관제 요원 도경'], ['신예린', '해커 제로']] }
  ].map(m => ({ ...m, example: true, date: ymd(addDays(today, m.rel)), cast: m.cast.map(([name, role]) => ({ name, role })), trailer: '' }));

  /* ---------- 콘서트 (data.js 의 SMO_CONCERTS) ---------- */
  const CONCERT_BASE = window.SMO_CONCERTS || [];
  let concertDocs = [], concertState = 'off', CONCERTS = [];
  const toLines = (v) => Array.isArray(v) ? v : (v ? String(v).split('\n') : []);
  function decorateConcert(c) {
    const dateObj = parseYmd(c.date) || today;
    const endObj = c.end ? parseYmd(c.end) : null;
    const d = Math.round((dateObj - today) / 86400000);
    const dEnd = endObj ? Math.round((endObj - today) / 86400000) : d;
    return { ...c, c: c.c || palette(c.id), dateObj, endObj, d, dEnd, tm: c.tm || '',
      lineup: toLines(c.lineup).map(x => typeof x === 'string' ? { name: x, role: '' } : x).filter(x => x && x.name),
      setlist: toLines(c.setlist).map(s => String(s).trim()).filter(Boolean),
      seats: toLines(c.seats).map(x => typeof x === 'string' ? { g: x, p: '' } : x).filter(x => x && x.g) };
  }
  function refreshConcerts() { CONCERTS = (concertState === 'ready' && concertDocs.length ? concertDocs : CONCERT_BASE).map(decorateConcert); }
  refreshConcerts();

  /* ---------- 상태 ---------- */
  let db = null, user = null, assets = null, myId = null, isOwner = false, isAdmin = false;
  let registered = [];            // db에 등록된 영화
  let movieState = 'loading';     // loading | ready | off
  let reviewDocs = [];
  let storeState = 'loading';     // loading | ready | slow | off | error
  let canWrite = true;

  function decorate(m) {
    const relDate = parseYmd(m.date) || today;
    const rel = Math.round((relDate - today) / 86400000);
    return { ...m, relDate, rel, c: m.c || palette(m.id) };
  }
  function palette(id) {
    const r = seeded(id); const h = Math.floor(r() * 360);
    return [`hsl(${h} 45% 14%)`, `hsl(${(h + 40) % 360} 60% 42%)`];
  }
  function allMovies() {
    if (movieState === 'ready' && registered.length) return registered.map(decorate);
    if (movieState === 'loading') return [];
    return EXAMPLES.map(decorate);
  }
  const showingExamples = () => movieState !== 'loading' && !(movieState === 'ready' && registered.length);
  const findMovie = (id) => allMovies().find(m => m.id === id);

  /* ---------- 이미지 ---------- */
  const rateLabel = (r) => r === 'all' ? '전체관람가' : r === '19' ? '청소년관람불가' : `${r}세 이상 관람가`;
  function seeded(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const posterSrc = (m) => m.poster || (m.posterId ? '/_blob/' + m.posterId : '');
  function frame(item, kind, n, opts = {}) {
    const src = opts.src || posterSrc(item);
    if (src) {
      // 이미지를 못 불러오면 검은 칸 대신 제목이 적힌 그라데이션이 보이도록 뒤에 깔아 둠
      const cc = item.c || palette(item.id);
      return `<div class="frame ${kind} ${opts.blur ? 'blur' : ''}" style="--p-bg:linear-gradient(160deg, ${cc[0]}, ${cc[1]})">${kind === 'poster' ? `<span class="fe">${esc(item.en || '')}</span><span class="ft">${esc(item.title)}</span>` : ''}<img src="${esc(src)}" alt="${kind === 'poster' ? esc(item.title) + ' 포스터' : ''}" loading="lazy" onerror="this.remove()"></div>`;
    }
    const r = seeded(item.id + n);
    const angle = Math.floor(r() * 360);
    const c = item.c || palette(item.id);
    const shapes = [0, 1, 2].map(() => { const s = 30 + r() * 80; return `<span class="shape" style="width:${s}%;aspect-ratio:1;left:${r() * 90 - 25}%;top:${r() * 80 - 20}%;background:${r() > .5 ? c[1] : 'rgba(255,255,255,.12)'}"></span>`; }).join('');
    const text = kind === 'poster' ? `<span class="fe">${esc(item.en || '')}</span><span class="ft">${esc(item.title)}</span>` : '';
    return `<div class="frame ${kind}" style="--p-bg:linear-gradient(${angle}deg, ${c[0]}, ${c[1]})">${shapes}${text}</div>`;
  }

  /* ---------- 유튜브 ---------- */
  function ytId(u) {
    try {
      const x = new URL(String(u).trim());
      const h = x.hostname.replace(/^(www|m|music)\./, '');
      let id = null;
      if (h === 'youtu.be') id = x.pathname.slice(1).split('/')[0];
      else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
        if (x.pathname === '/watch') id = x.searchParams.get('v');
        else { const m = x.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]+)/); if (m) id = m[2]; }
      }
      return id && /^[\w-]{6,20}$/.test(id) ? id : null;
    } catch { return null; }
  }
  const ytUrl = (id) => 'https://www.youtube.com/watch?v=' + id;

  const avgOf = (id) => { const list = reviewsFor(id); return list.length ? (list.reduce((s, x) => s + x.rating, 0) / list.length) : null; };

  /* ---------- 페이지: 영화 목록 ---------- */
  function movieWork(m) {
    const avg = avgOf(m.id);
    const soon = m.rel > 0;
    const hn = hypeCount(m.id);
    const right = soon ? `D-${m.rel}${hn ? ` · 🍿 ${hn}` : ''}` :(avg ? `★ ${avg.toFixed(1)}` : (m.rel === 0 ? '오늘 개봉' : ''));
    return `<a class="work" href="#movie-${m.id}">${frame(m, 'poster', 1)}<div class="work-head"><span class="t fit" data-min="9">${esc(m.title)}</span><span class="muted">${right}</span></div></a>`;
  }
  function pageMovies() {
    const all = allMovies();
    const now = all.filter(m => m.rel <= 0).sort((a, b) => b.rel - a.rel);
    const soon = all.filter(m => m.rel > 0).sort((a, b) => a.rel - b.rel);
    const adminBar = isAdmin ? `<div class="admin-bar"><a class="link" href="#movie-new">+ 영화 등록</a></div>` : '';
    const exNote = showingExamples() ? (isAdmin ? ' 지금은 예시 영화가 보여요. 첫 영화를 등록하면 예시는 사라져요.' : ' 지금 보이는 영화는 예시예요.') : '';
    if (movieState === 'loading') return `<div class="intro"><h1>영화</h1><p>영화 목록을 불러오는 중이에요…</p></div>`;
    return `<div class="intro"><h1>영화 (${all.length})</h1><div><p>상영중인 영화와 개봉 예정작이에요. 포스터를 누르면 시놉시스, 예고편, 정보, 리뷰를 볼 수 있어요.${exNote}</p>${adminBar}</div></div>
      ${subNav('movies')}
      <div class="group-label" id="grp-now"><span>상영중</span><span>${now.length}</span></div>
      ${now.length ? `<div class="works">${now.map(movieWork).join('')}</div>` : `<div class="muted">상영중인 영화가 없어요.</div>`}
      <div class="group-label" id="grp-soon"><span>개봉 예정</span><span>${soon.length}</span></div>
      ${soon.length ? `<div class="works">${soon.map(movieWork).join('')}</div>` : `<div class="muted">개봉 예정인 영화가 없어요.</div>`}`;
  }

  /* ---------- 페이지: 영화 상세 ---------- */
  function trailerBlock(m) {
    const id = ytId(m.trailer);
    const bg = posterSrc(m) ? frame(m, 'still', 2, { blur: true }) : frame(m, 'still', 2);
    if (id) {
      return `<a class="trailer" href="${ytUrl(id)}" target="_blank" rel="noopener" aria-label="${esc(m.title)} 예고편 YouTube에서 보기">${bg}
        <span class="play"><b>▶</b><span>YouTube에서 예고편 보기 ↗</span></span></a>
        <div class="trailer-note muted">예고편은 YouTube 새 탭에서 재생돼요.</div>`;
    }
    const search = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(m.title + ' 예고편');
    return `<a class="trailer" href="${search}" target="_blank" rel="noopener" aria-label="${esc(m.title)} 예고편 YouTube에서 찾기">${bg}
        <span class="play"><b>▶</b><span>YouTube에서 예고편 찾기 ↗</span></span></a>
        <div class="trailer-note muted">${m.example ? '예시 영화라 실제 예고편은 없어요.' : (isAdmin ? '아직 예고편 주소가 없어서 YouTube 검색으로 연결돼요. 수정에서 예고편 주소를 넣어 주세요.' : '등록된 예고편이 없어서 YouTube 검색으로 연결돼요.')}</div>`;
  }

  function pageMovie(m) {
    const soon = m.rel > 0;
    const admin = isAdmin && !m.example ? `<div class="admin-bar"><a class="link" href="#edit-${m.id}">수정</a>
      ${confirmDelMovie === m.id ? `<span class="muted">이 영화와 포스터를 삭제할까요?</span><button class="link danger" data-movie-act="del-yes">삭제</button><button class="link" data-movie-act="del-no">취소</button>`
        : `<button class="link danger" data-movie-act="del">삭제</button>`}</div>` : '';
    return `<div class="detail-top">
        <div><h1 class="fit" data-min="18">${esc(m.title)}</h1><div class="sub">${m.en ? esc(m.en) + ' · ' : ''}${soon ? `개봉 예정 D-${m.rel}` : '상영중'}${m.example ? ' · 예시' : ''}</div>${admin}${soon ? '<div id="hype-box"></div>' : '<div id="rating-box"></div>'}</div>
        <div class="detail-poster">${frame(m, 'poster', 1)}</div>
      </div>

      <div class="group-label"><span>정보</span><span>01</span></div>
      <div class="rows">
        <div class="r"><span>개봉일</span><span>${fmtDate(m.relDate)}${soon ? ` · D-${m.rel}` : ''}</span></div>
        ${m.genre ? `<div class="r"><span>장르</span><span>${esc(m.genre)}</span></div>` : ''}
        ${m.rate || m.run ? `<div class="r"><span>등급 / 시간</span><span>${m.rate ? rateLabel(m.rate) : ''}${m.rate && m.run ? ' · ' : ''}${m.run ? m.run + '분' : ''}</span></div>` : ''}
        ${m.dir ? `<div class="r"><span>감독</span><span>${esc(m.dir)}</span></div>` : ''}
        ${m.cast && m.cast.length ? `<div class="r"><span>출연</span><span class="list">${m.cast.map(c => `<span><span>${esc(c.name)}</span><span class="muted">${esc(c.role || '')}</span></span>`).join('')}</span></div>` : ''}
        ${perksOf(m).length ? `<div class="r"><span>특전</span>${perkRowHTML(m)}</div>` : ''}
        ${soon ? '' : `<div class="r"><span>예매</span><span class="links">
          <a class="link" href="https://www.cgv.co.kr/" target="_blank" rel="noopener">CGV ↗</a>
          <a class="link" href="https://www.lottecinema.co.kr/" target="_blank" rel="noopener">롯데시네마 ↗</a>
          <a class="link" href="https://www.megabox.co.kr/" target="_blank" rel="noopener">메가박스 ↗</a></span></div>`}
      </div>

      ${m.stats ? `<div class="group-label"><span>예매 현황</span><span>📊</span></div>${statsHTML(m)}` : ''}

      <div class="tr-rv">
        <div class="tr-col"><div class="group-label"><span>예고편</span><span>02</span></div>${trailerBlock(m)}</div>
        <div class="rv-col"><div class="group-label"><span>리뷰</span><span>03</span></div>
          ${soon ? `<div class="note">리뷰는 개봉 후에 남길 수 있어요. 개봉을 기다린다면 위의 🍿 기대돼요를 눌러 주세요.</div>` : `<section id="review-summary"></section>`}</div>
      </div>

      <div class="group-label"><span>시놉시스</span><span>04</span></div>
      ${m.syn ? `<p class="syn-big">${esc(m.syn)}</p>` : `<div class="muted">등록된 시놉시스가 없어요.</div>`}
      <div class="section-gap"><a class="link muted" href="#movies">← 영화 목록</a></div>`;
  }

  /* ---------- 페이지: 리뷰 ---------- */
  function pageReviews(m) {
    return `<div class="detail-top">
        <div><div class="sub" style="margin:0 0 14px">리뷰</div><h1 class="fit" data-min="18">${esc(m.title)}</h1><div class="sub">${m.en ? esc(m.en) + ' · ' : ''}${fmtDate(m.relDate)} 개봉</div></div>
        <div class="detail-poster small">${frame(m, 'poster', 1)}</div>
      </div>
      <div class="group-label"><span>관람객 리뷰</span><span>👍 · 👎</span></div>
      ${m.rel > 0 ? `<div class="note">리뷰는 개봉 후에 남길 수 있어요.</div>` : `<section id="reviews"></section>`}
      <div class="section-gap"><a class="link muted" href="#movie-${m.id}">← 영화 정보로 돌아가기</a></div>`;
  }

  /* ---------- 페이지: 영화 등록 / 수정 (관리자) ---------- */
  const ed = { id: null, file: null, previewUrl: '', busy: false, msg: '', err: false };
  function pageEditor(m) {
    const v = m || { title: '', en: '', date: ymd(today), rate: '12', genre: '', run: '', dir: '', cast: [], syn: '', trailer: '' };
    const castText = (v.cast || []).map(c => c.role ? `${c.name} / ${c.role}` : c.name).join('\n');
    const previewItem = { id: v.id || 'new', title: v.title || '포스터', en: v.en, posterId: v.posterId };
    const preview = ed.previewUrl ? frame(previewItem, 'poster', 1, { src: ed.previewUrl }) : frame(previewItem, 'poster', 1);
    return `<div class="intro"><h1>${m ? '영화 수정' : '영화 등록'}</h1><p>포스터와 영화 정보를 입력해 주세요. 페이지 주인과 편집자만 볼 수 있는 화면이에요.</p></div>
      <form class="editor" id="movie-form" autocomplete="off">
        <div class="r"><label>포스터 이미지</label><div class="poster-pick"><div id="poster-preview">${preview}</div>
          <div><label class="file-btn">이미지 고르기<input type="file" id="f-poster" accept="image/png,image/jpeg,image/webp,image/gif"></label>
          <div class="hint">JPG, PNG, WEBP 파일, 20MB 이하. 세로 2:3 비율이 가장 잘 맞아요.${v.posterId ? '<br>새 이미지를 고르면 기존 포스터는 바뀌어요.' : ''}</div></div></div></div>
        <div class="r"><label class="req" for="f-title">제목</label><input type="text" id="f-title" maxlength="80" value="${esc(v.title)}" required></div>
        <div class="r"><label for="f-en">영문 제목</label><input type="text" id="f-en" maxlength="80" value="${esc(v.en)}"></div>
        <div class="r"><label class="req" for="f-date">개봉일</label><div><input type="date" id="f-date" value="${esc(v.date)}" required><div class="hint">오늘보다 뒤면 ‘개봉 예정’, 오늘이거나 지났으면 ‘상영중’에 나와요.</div></div></div>
        <div class="r"><label for="f-rate">등급 / 상영 시간</label><div class="two">
          <select id="f-rate">${[['','등급 미정'],['all','전체관람가'],['12','12세 이상'],['15','15세 이상'],['19','청소년관람불가']].map(([k,l]) => `<option value="${k}" ${(v.rate || '') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <input type="number" id="f-run" min="1" max="600" placeholder="분" value="${esc(v.run)}"></div></div>
        <div class="r"><label for="f-genre">장르</label><input type="text" id="f-genre" maxlength="40" placeholder="예: 드라마, 스릴러" value="${esc(v.genre)}"></div>
        <div class="r"><label for="f-dir">감독</label><input type="text" id="f-dir" maxlength="60" value="${esc(v.dir)}"></div>
        <div class="r"><label for="f-cast">출연</label><div><textarea id="f-cast" rows="4" placeholder="이름 / 배역&#10;예: 송강호 / 기택">${esc(castText)}</textarea><div class="hint">한 줄에 한 명씩, ‘이름 / 배역’으로 적어 주세요. 배역은 생략해도 돼요.</div></div></div>
        <div class="r"><label for="f-syn">시놉시스</label><textarea id="f-syn" rows="5" maxlength="1500">${esc(v.syn)}</textarea></div>
        <div class="r"><label for="f-trailer">예고편 (YouTube 주소)</label><div><input type="url" id="f-trailer" placeholder="https://www.youtube.com/watch?v=..." value="${esc(v.trailer)}"><div class="hint" id="trailer-hint">YouTube에서 예고편 영상을 열고 주소창의 주소나 ‘공유’ 링크를 붙여 넣어 주세요.</div></div></div>
        <div class="r"><label for="f-perks">특전</label><div><textarea id="f-perks" rows="3" maxlength="600" placeholder="예: 1주차 A3 포스터 (CGV)&#10;2주차 아트카드 (메가박스)">${esc(perksOf(v).map(p => p.text).join('\n'))}</textarea><div class="hint">한 줄에 하나씩 적어 주세요. 상단 메뉴의 ‘특전’에 표시돼요.</div></div></div>
        <div class="editor-actions">
          <span class="msg ${ed.err ? 'err' : ''}" id="ed-msg">${esc(ed.msg)}</span>
          <span style="display:flex;gap:14px;align-items:center"><a class="link muted" href="${m ? '#movie-' + m.id : '#movies'}">취소</a><button type="submit" class="submit" id="ed-submit">${m ? '변경 저장' : '영화 등록'}</button></span>
        </div>
      </form>`;
  }
  function editorMsg(text, err) { ed.msg = text; ed.err = !!err; const el = $('ed-msg'); if (el) { el.textContent = text; el.className = 'msg' + (err ? ' err' : ''); } }
  const newId = () => 'mv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  async function saveMovie() {
    if (ed.busy) return;
    const title = $('f-title').value.trim();
    const date = $('f-date').value;
    const trailerRaw = $('f-trailer').value.trim();
    if (!title) return editorMsg('제목을 입력해 주세요.', true);
    if (!parseYmd(date)) return editorMsg('개봉일을 입력해 주세요.', true);
    const tid = trailerRaw ? ytId(trailerRaw) : null;
    if (trailerRaw && !tid) return editorMsg('예고편 주소를 확인해 주세요. YouTube 영상 주소만 넣을 수 있어요.', true);
    const cast = $('f-cast').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30).map(l => { const [name, ...rest] = l.split(/\s*[\/|]\s*/); return { name: name.slice(0, 40), role: rest.join(' / ').slice(0, 60) }; });
    const existing = ed.id ? registered.find(x => x.id === ed.id) : null;
    const id = ed.id || newId();
    const body = {
      title, en: $('f-en').value.trim(), date, rate: $('f-rate').value, run: Math.max(0, parseInt($('f-run').value, 10) || 0) || '',
      genre: $('f-genre').value.trim(), dir: $('f-dir').value.trim(), cast, syn: $('f-syn').value.trim(),
      trailer: tid ? ytUrl(tid) : '', perks: ($('f-perks')?.value || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10).map(t => {
        const old = existing ? perksOf(existing).find(p => p.text === t) : null;   // 글을 그대로 두면 출처 링크·사진도 유지
        return old && (old.link || old.img) ? { text: t, link: old.link || '', img: old.img || '' } : t;
      }), posterId: existing?.posterId || '', createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now()
    };
    ed.busy = true; $('ed-submit').disabled = true;
    let uploadedId = null;
    try {
      if (ed.file) {
        if (!assets) throw { code: 'no_assets' };
        editorMsg('포스터를 올리는 중이에요…');
        const res = await assets.upload(ed.file);
        uploadedId = res.id; body.posterId = res.id;
      }
      editorMsg('저장하는 중이에요…');
      await db.doc('movies/' + id).set(body);
      if (uploadedId && existing?.posterId && existing.posterId !== uploadedId) { try { await assets.delete(existing.posterId); } catch {} }
      toast(ed.id ? '영화 정보를 고쳤어요' : '영화를 등록했어요');
      resetEditor();
      location.hash = '#movie-' + id;
    } catch (e) {
      const c = e?.code;
      const msg = c === 'too_large' ? '이미지가 20MB보다 커요. 더 작은 파일을 골라 주세요.'
        : c === 'unsupported_type' ? 'JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요.'
        : c === 'quota_or_state' ? '저장 공간이 가득 찼어요. 쓰지 않는 영화를 지워 주세요.'
        : c === 'no_assets' || c === 'not_granted' ? '포스터를 올릴 권한이 없어요. 페이지 주인이나 편집자만 올릴 수 있어요.'
        : c === 'invalid_argument' ? '저장할 권한이 없어요. 페이지 주인이나 편집자만 영화를 등록할 수 있어요.'
        : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
      editorMsg(msg, true);
      if (uploadedId) { try { await assets.delete(uploadedId); } catch {} }
    } finally { ed.busy = false; const b = $('ed-submit'); if (b) b.disabled = false; }
  }
  function resetEditor() { if (ed.previewUrl) URL.revokeObjectURL(ed.previewUrl); Object.assign(ed, { id: null, file: null, previewUrl: '', busy: false, msg: '', err: false }); }

  let confirmDelMovie = null;
  async function deleteMovie(id) {
    const m = registered.find(x => x.id === id); if (!m) return;
    try {
      await db.doc('movies/' + id).delete();
      if (m.posterId && assets) { try { await assets.delete(m.posterId); } catch {} }
      confirmDelMovie = null;
      toast('영화를 삭제했어요');
      location.hash = '#movies';
    } catch { toast('삭제하지 못했어요. 권한이 없거나 연결이 끊겼어요.'); }
  }

  /* ---------- 페이지: 콘서트 ---------- */
  function pageConcerts(region) {
    const all = [...CONCERTS].sort((a, b) => a.d - b.d);
    const list = region ? all.filter(c => regionOf(c) === region) : all;
    const adminBar = isAdmin ? `<div class="admin-bar"><a class="link" href="#concert-new">+ 공연 등록</a></div>` : '';
    const rn = region ? regionName(region) : '';
    return `<div class="intro"><h1>${rn ? `${esc(rn)} 공연` : '콘서트'} (${list.length})</h1><div><p>${rn ? `${esc(rn)}에서 열리는 공연이에요.` : '전국에서 열리는 공연이에요.'} 포스터를 누르면 출연진, 셋리스트, 좌석 배치도와 가격을 볼 수 있어요.</p>${adminBar}</div></div>
      ${concertNav('concerts')}
      ${regionChips(all, region || '')}
      <div class="group-label"><span>${rn ? esc(rn) + ' · ' : ''}다가오는 공연</span><span>${list.length}</span></div>
      ${list.length ? '' : `<div class="note">${esc(rn)}에서 열리는 공연이 아직 없어요. 다른 지역을 골라 보세요.</div>`}
      <div class="works">${list.map(c => `<a class="work" href="#concert-${c.id}">${frame(c, 'poster', 1)}<div class="work-head"><span class="t fit" data-min="9">${esc(c.title)}</span><span class="muted">${c.dateObj.getMonth() + 1}.${c.dateObj.getDate()} ${esc(c.city)}</span></div></a>`).join('')}</div>`;
  }
  const seatmapSrc = (c) => c.seatmapId ? '/_blob/' + c.seatmapId : (c.seatmap || '');
  const concertDday = (c) => c.d > 0 ? `D-${c.d}` : c.dEnd >= 0 ? '공연 중' : '지난 공연';
  function pageConcert(c) {
    const fromDb = concertState === 'ready' && concertDocs.some(x => x.id === c.id);
    const admin = isAdmin ? `<div class="admin-bar"><a class="link" href="#concert-edit-${c.id}">수정</a>
      ${fromDb ? (confirmDelMovie === c.id ? `<span class="muted">이 공연을 삭제할까요?</span><button class="link danger" data-concert-act="del-yes">삭제</button><button class="link" data-concert-act="del-no">취소</button>`
        : `<button class="link danger" data-concert-act="del">삭제</button>`) : ''}</div>` : '';
    const when = c.when || `${fmtKo(c.dateObj)}${c.tm ? ' ' + esc(c.tm) : ''}`;
    const sm = seatmapSrc(c);
    const pre = c.d > 0;
    const setNote = c.setNote || (pre ? '공연 전이라 대표곡과 지난 공연을 바탕으로 꾸린 예상 셋리스트예요. 실제 곡과 순서는 다를 수 있어요.' : '');
    return `<div class="detail-top">
        <div><h1 class="fit" data-min="18">${esc(c.title)}</h1><div class="sub">${c.en ? esc(c.en) + ' · ' : ''}${concertDday(c)}</div>${admin}</div>
        <div class="detail-poster">${frame(c, 'poster', 1)}</div>
      </div>

      <div class="group-label"><span>정보</span><span>01</span></div>
      <div class="rows">
        <div class="r"><span>일시</span><span>${esc(when)}</span></div>
        <div class="r"><span>장소</span><span>${esc(c.venue)}${c.city ? ', ' + esc(c.city) : ''}</span></div>
        ${c.genre ? `<div class="r"><span>장르</span><span>${esc(c.genre)}</span></div>` : ''}
        ${c.price ? `<div class="r"><span>가격</span><span>${esc(c.price)}</span></div>` : ''}
        ${c.desc ? `<div class="r"><span>소개</span><p>${esc(c.desc)}</p></div>` : ''}
        ${c.book || ytId(c.trailer || '') ? `<div class="r"><span>바로가기</span><span class="links">
          ${c.book ? `<a class="link" href="${esc(c.book)}" target="_blank" rel="noopener">${esc(c.bookName || '예매처')} ↗</a>` : ''}
          ${ytId(c.trailer || '') ? `<a class="link" href="${ytUrl(ytId(c.trailer))}" target="_blank" rel="noopener">예고편 YouTube ↗</a>` : ''}
          ${c.src ? `<a class="link muted" href="${esc(c.src)}" target="_blank" rel="noopener">정보 출처 ↗</a>` : ''}</span></div>` : ''}
      </div>

      <div class="group-label"><span>출연진</span><span>02</span></div>
      ${c.lineup.length ? `<div class="lineup">${c.lineup.map((p, i) => `<div class="lu"><span class="lu-n">${String(i + 1).padStart(2, '0')}</span><b>${esc(p.name)}</b>${p.role ? `<span class="muted">${esc(p.role)}</span>` : ''}</div>`).join('')}</div>` : `<div class="muted">등록된 출연진이 없어요.</div>`}

      <div class="group-label"><span>셋리스트</span><span>03</span></div>
      ${c.setlist.length ? `${setNote ? `<div class="note set-note">${pre ? '🎵 ' : ''}${esc(setNote)}</div>` : ''}<ol class="setlist">${c.setlist.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>` : `<div class="muted">아직 셋리스트가 없어요.</div>`}

      <div class="group-label"><span>좌석 배치도 · 좌석표</span><span>04</span></div>
      <div class="seat-wrap">
        <div class="seat-map">${sm ? `<button type="button" class="seat-img" data-zoom="${esc(sm)}" aria-label="좌석 배치도 크게 보기"><img src="${esc(sm)}" alt="${esc(c.venue)} 좌석 배치도" loading="lazy"><span>누르면 크게 보여요 ⤢</span></button>`
          : `<div class="seat-empty"><b>🏟️</b><span>${c.seatNote ? esc(c.seatNote) : `아직 배치도 이미지가 없어요.${isAdmin ? ' 수정에서 예매처의 좌석 배치도 이미지를 올려 주세요.' : ' 예매처 공연 페이지에서 확인할 수 있어요.'}`}</span></div>`}</div>
        <div class="seat-table">${c.seats.length ? `<table><thead><tr><th>좌석 등급</th><th>가격</th></tr></thead><tbody>${c.seats.map(s => `<tr><td>${esc(s.g)}${s.note ? `<span class="muted">${esc(s.note)}</span>` : ''}</td><td>${esc(s.p || '-')}</td></tr>`).join('')}</tbody></table>`
          : c.seatNote ? `<div class="note">${esc(c.price || '관람료')}는 ${c.book ? `<a class="link" href="${esc(c.book)}" target="_blank" rel="noopener">${esc(c.bookName || '예매처')} ↗</a>` : '예매처'}에서 확인해 주세요.</div>`
          : `<div class="note">등급별 가격은 아직 확인하지 못했어요. ${c.book ? `<a class="link" href="${esc(c.book)}" target="_blank" rel="noopener">${esc(c.bookName || '예매처')} ↗</a> 공지를 확인해 주세요.` : '예매처 공지를 확인해 주세요.'}</div>`}
          <div class="hint">가격은 예매 수수료를 뺀 금액이에요. 예매처 사정에 따라 바뀔 수 있어요.</div></div>
      </div>
      ${venueOf(c) ? `<a class="rv-cta venue-cta" href="#venue-${venueOf(c).id}"><span>🏟️ ${esc(venueOf(c).name)} 좌석 후기 보기 · 시야 · 음향 <b id="venue-link-n">${seatReviews(venueOf(c).id).length || ''}</b></span><span>→</span></a>` : ''}
      <div class="section-gap"><a class="link muted" href="#concerts">← 공연 목록</a></div>`;
  }

  /*VENUES-START*/
  /* ---------- 지역 ---------- */
  const REGIONS = [['seoul', '서울'], ['gyeonggi', '경기'], ['incheon', '인천'], ['gangwon', '강원'], ['daejeon', '대전'], ['sejong', '세종'], ['chungbuk', '충북'], ['chungnam', '충남'], ['gwangju', '광주'], ['jeonbuk', '전북'], ['jeonnam', '전남'], ['daegu', '대구'], ['gyeongbuk', '경북'], ['busan', '부산'], ['ulsan', '울산'], ['gyeongnam', '경남'], ['jeju', '제주']];
  const CITY_REGION = { '경기도': 'gyeonggi', '고양': 'gyeonggi', '일산': 'gyeonggi', '수원': 'gyeonggi', '성남': 'gyeonggi', '용인': 'gyeonggi', '부천': 'gyeonggi', '안산': 'gyeonggi', '파주': 'gyeonggi', '하남': 'gyeonggi', '송도': 'incheon', '영종': 'incheon',
    '강원특별': 'gangwon', '춘천': 'gangwon', '원주': 'gangwon', '강릉': 'gangwon', '충청북': 'chungbuk', '청주': 'chungbuk', '충주': 'chungbuk', '충청남': 'chungnam', '천안': 'chungnam', '아산': 'chungnam',
    '전북특별': 'jeonbuk', '전라북': 'jeonbuk', '전주': 'jeonbuk', '익산': 'jeonbuk', '군산': 'jeonbuk', '전라남': 'jeonnam', '여수': 'jeonnam', '순천': 'jeonnam', '목포': 'jeonnam',
    '경상북': 'gyeongbuk', '포항': 'gyeongbuk', '경주': 'gyeongbuk', '구미': 'gyeongbuk', '경상남': 'gyeongnam', '창원': 'gyeongnam', '김해': 'gyeongnam', '진주': 'gyeongnam', '제주특별': 'jeju', '서귀포': 'jeju' };
  const regionName = (code) => (REGIONS.find(r => r[0] === code) || [0, ''])[1];
  function regionOf(c) {
    const s = String(c.city || '');
    const hit = REGIONS.find(([, n]) => s.startsWith(n)); if (hit) return hit[0];
    const k = Object.keys(CITY_REGION).find(k => s.includes(k)); if (k) return CITY_REGION[k];
    const v = venueOf(c); return v ? v.region : '';
  }
  function regionChips(all, current, fly) {
    const cnt = (k) => all.filter(c => regionOf(c) === k).length;
    return `<nav class="region-chips${fly ? ' fly' : ''}" aria-label="지역">${fly ? '' : `<a href="#concerts"${!current ? ' aria-current="page"' : ''}>전국 <b>${all.length}</b></a>`}${REGIONS.map(([k, n]) => { const x = cnt(k); return `<a href="#concerts-r-${k}" class="${x ? '' : 'zero'}"${current === k ? ' aria-current="page"' : ''}>${n}${x ? ` <b>${x}</b>` : ''}</a>`; }).join('')}</nav>`;
  }
  const concertNav = (kind) => `<nav class="subnav" aria-label="콘서트 목록 종류">${[['concerts', '전체 공연'], ['venues', '공연장 · 좌석 후기']].map(([k, l]) => `<a href="#${k}"${k === kind ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;

  /* ---------- 공연장 · 좌석 후기 ---------- */
  const VENUES = [
    { id: 'kspo', name: 'KSPO DOME', sub: '올림픽체조경기장', region: 'seoul', place: '서울 송파구 올림픽공원', match: ['KSPO', '체조경기장'] },
    { id: 'olympichall', name: '올림픽홀', sub: '', region: 'seoul', place: '서울 송파구 올림픽공원', match: ['올림픽홀'] },
    { id: 'livearena', name: '티켓링크 라이브 아레나', sub: '옛 핸드볼경기장', region: 'seoul', place: '서울 송파구 올림픽공원', match: ['라이브 아레나', '핸드볼경기장'] },
    { id: 'jamsil', name: '잠실실내체육관', sub: '', region: 'seoul', place: '서울 송파구 잠실종합운동장', match: ['잠실실내'] },
    { id: 'gocheok', name: '고척스카이돔', sub: '', region: 'seoul', place: '서울 구로구', match: ['고척'] },
    { id: 'inspire', name: '인스파이어 아레나', sub: '', region: 'incheon', place: '인천 중구 영종도', match: ['인스파이어'] },
    { id: 'kintex', name: '킨텍스', sub: 'KINTEX', region: 'gyeonggi', place: '경기 고양시 일산서구', match: ['킨텍스', 'KINTEX'] },
    { id: 'bexco', name: '벡스코', sub: 'BEXCO', region: 'busan', place: '부산 해운대구', match: ['벡스코', 'BEXCO'] },
    { id: 'sohyang', name: '소향씨어터', sub: '', region: 'busan', place: '부산 해운대구 센텀시티', match: ['소향'] }
  ];
  const venueOf = (c) => VENUES.find(v => v.match.some(k => String(c.venue || '').includes(k))) || null;
  const FLOORS = ['플로어', '1층', '2층', '3층', '4층', '기타'];
  const SEAT_TAGS = ['무대 정면', '무대 측면', '돌출 무대 가까움', '전광판 잘 보임', '멀지만 잘 보임', '기둥·장비 가림', '소리 선명', '소리 울림', '스피커 가까움', '경사 가파름', '다리 공간 좁음', '출입 편함'];
  const SCORE = [['sight', '👀', '시야'], ['sound', '🔊', '음향'], ['comfort', '🪑', '편안함']];
  function seatReviews(venueId) {
    const out = [];
    reviewDocs.forEach(d => Object.entries(d.seats || {}).forEach(([rid, r]) => { if (r && r.v === venueId && r.sight) out.push({ uid: d.uid, rid, ...r }); }));
    return out.sort((a, b) => (b.at || 0) - (a.at || 0));
  }
  const avg3 = (list) => { const n = list.length; const f = (k) => n ? list.reduce((s, x) => s + (+x[k] || 0), 0) / n : 0; return { n, sight: f('sight'), sound: f('sound'), comfort: f('comfort') }; };
  const secKey = (r) => (r.fl || '기타') + (r.sec ? ` ${r.sec}구역` : '');
  const secLabel = (r) => secKey(r) + (r.row ? ` ${r.row}열` : '');
  const seatFid = (rid) => 'seat-' + rid;
  const miniStars = (n) => `<span class="mini-stars" aria-label="${n}점">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
  const vs = { id: null, fl: '', sec: '', sort: 'new', open: null, cmText: '', confirmDel: null, busy: false, msg: '', err: false, f: null };
  const blankSeatForm = () => ({ fl: '', sec: '', row: '', show: '', sight: 0, sound: 0, comfort: 0, tags: [], text: '' });

  function pageVenues() {
    const cards = VENUES.map(v => {
      const list = seatReviews(v.id); const a = avg3(list);
      const shows = CONCERTS.filter(c => venueOf(c) === v && c.dEnd >= 0).length;
      return `<a class="venue-card" href="#venue-${v.id}">
        <span class="vc-top"><span class="muted">${esc(regionName(v.region))}</span>${shows ? `<span class="vc-live">공연 ${shows}</span>` : ''}</span>
        <b class="fit" data-min="12">${esc(v.name)}</b><span class="muted vc-place">${esc(v.place)}</span>
        <span class="vc-scores">${a.n ? SCORE.map(([k, e]) => `<span>${e} ${a[k].toFixed(1)}</span>`).join('') + `<span class="muted">후기 ${a.n}</span>` : '<span class="muted">아직 좌석 후기가 없어요</span>'}</span></a>`;
    }).join('');
    return `${listIntro('공연장', '공연장별 좌석 후기예요. 다녀온 공연의 구역과 열을 고르고 👀 시야, 🔊 음향, 🪑 편안함을 남기면 구역마다 평균이 모여요.', VENUES.length)}${concertNav('venues')}<div class="list-gap"></div><div class="venue-grid">${cards}</div>`;
  }
  function pageVenue(v) {
    const shows = CONCERTS.filter(c => venueOf(c) === v).sort((a, b) => a.d - b.d);
    return `<div class="intro venue-head"><div><div class="sub" style="margin:0 0 10px">공연장 · ${esc(regionName(v.region))}</div><h1 class="fit" data-min="18">${esc(v.name)}</h1>
        <p class="muted">${v.sub ? esc(v.sub) + ' · ' : ''}${esc(v.place)}</p></div>
        ${shows.length ? `<div class="venue-shows"><span class="muted">이 공연장의 공연</span>${shows.map(c => `<a class="link" href="#concert-${c.id}">${esc(cut(c.title, 26))} <span class="muted">${shortDate(c.dateObj)}</span></a>`).join('')}</div>` : ''}</div>
      ${concertNav('venues')}
      <div id="venue-stats"></div>
      <div class="group-label"><span>좌석 후기 쓰기</span><span>✍️</span></div>
      <div id="venue-form"></div>
      <div class="group-label" id="venue-rv-label"><span>좌석 후기</span><span id="vr-count"></span></div>
      <div id="venue-reviews"></div>
      <div class="section-gap"><a class="link muted" href="#venues">← 공연장 목록</a></div>`;
  }
  function venueStatsHTML(v) {
    const all = seatReviews(v.id); const a = avg3(all);
    if (storeState === 'loading') return `<div class="note">좌석 후기를 불러오는 중…</div>`;
    if (!a.n) return `<div class="venue-score empty"><div class="note">아직 좌석 후기가 없어요. 이 공연장에 다녀왔다면 첫 후기를 남겨 주세요.</div></div>`;
    const groups = {};
    all.forEach(r => { const k = secKey(r); (groups[k] = groups[k] || []).push(r); });
    const rows = Object.entries(groups).map(([k, list]) => ({ k, ...avg3(list) })).sort((x, y) => y.n - x.n || y.sight - x.sight);
    const top = (key) => rows.filter(r => r.n).sort((x, y) => y[key] - x[key] || y.n - x.n).slice(0, 3);
    return `<div class="venue-score">${SCORE.map(([k, e, l]) => `<div class="vs-card"><span class="muted">${e} ${l}</span><b>${a[k].toFixed(1)}</b><span class="vs-bar"><i style="width:${a[k] / 5 * 100}%"></i></span></div>`).join('')}
        <div class="vs-card"><span class="muted">💬 좌석 후기</span><b>${a.n}</b><span class="muted">${rows.length}개 구역</span></div></div>
      ${rows.length > 1 ? `<div class="venue-top">${[['sight', '👀 시야 좋은 구역'], ['sound', '🔊 음향 좋은 구역']].map(([k, l]) => `<div><span class="muted">${l}</span><ol>${top(k).map(r => `<li><button type="button" class="link" data-seat-sec="${esc(r.k)}">${esc(r.k)}</button><span class="muted">${r[k].toFixed(1)}</span></li>`).join('')}</ol></div>`).join('')}</div>` : ''}
      <div class="sec-table"><table><thead><tr><th>구역</th>${SCORE.map(([, e, l]) => `<th title="${l}">${e}</th>`).join('')}<th>후기</th></tr></thead><tbody>
        ${rows.map(r => `<tr class="${vs.sec === r.k ? 'on' : ''}"><td><button type="button" class="link" data-seat-sec="${esc(r.k)}">${esc(r.k)}</button></td>${SCORE.map(([k]) => `<td>${r[k].toFixed(1)}</td>`).join('')}<td>${r.n}</td></tr>`).join('')}
      </tbody></table><div class="hint">구역을 누르면 그 구역 후기만 볼 수 있어요.</div></div>`;
  }
  function seatFormHTML(v) {
    const can = myId && canWrite && storeState === 'ready';
    if (!can) return `<div class="note">${storeState === 'loading' ? '불러오는 중…' : (storeState === 'off' || !myId) ? '로그인하면 좌석 후기를 남길 수 있어요.' : storeState === 'error' ? '후기를 불러오지 못했어요. 페이지를 다시 열어 주세요.' : '후기를 남길 권한이 없어요.'}</div>`;
    const f = vs.f;
    const shows = CONCERTS.filter(c => venueOf(c) === v);
    return `<form class="seat-form" id="seat-form" autocomplete="off">
      <div class="sf-row three">
        <label><span>층</span><select id="sf-fl"><option value="">고르기</option>${FLOORS.map(x => `<option ${f.fl === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label><span>구역</span><input type="text" id="sf-sec" maxlength="12" placeholder="예: 15, A" value="${esc(f.sec)}"></label>
        <label><span>열 (선택)</span><input type="text" id="sf-row" maxlength="8" placeholder="예: 5" value="${esc(f.row)}"></label>
      </div>
      <label class="sf-row"><span>본 공연</span><input type="text" id="sf-show" list="sf-shows" maxlength="60" placeholder="예: DAY6 콘서트 (목록에서 고르거나 직접 적기)" value="${esc(f.show)}">
        <datalist id="sf-shows">${shows.map(c => `<option value="${esc(c.title)}">`).join('')}</datalist></label>
      <div class="sf-scores">${SCORE.map(([k, e, l]) => `<div class="sf-score"><span>${e} ${l}</span><span class="stars" role="radiogroup" aria-label="${l} 점수">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${f[k] === n}" aria-label="${l} ${n}점" data-seat-star="${k}|${n}" class="${n <= f[k] ? 'on' : ''}">★</button>`).join('')}</span></div>`).join('')}</div>
      <div class="sf-row"><span>이런 자리였어요 (여러 개 고르기)</span><div class="tag-pick">${SEAT_TAGS.map(t => `<button type="button" class="tag-btn" data-seat-tag="${esc(t)}" aria-pressed="${f.tags.includes(t)}">${esc(t)}</button>`).join('')}</div></div>
      <label class="sf-row"><span>후기</span><textarea id="sf-text" rows="4" maxlength="1000" placeholder="무대가 어떻게 보였는지, 소리는 어땠는지, 다음에 이 자리를 고를지 적어 주세요.">${esc(f.text)}</textarea></label>
      <div class="editor-actions"><span class="msg ${vs.err ? 'err' : ''}" id="sf-msg">${esc(vs.msg)}</span><button type="submit" class="submit" id="sf-submit">후기 올리기</button></div>
    </form>`;
  }
  function seatCardHTML(r) {
    const fid = seatFid(r.rid);
    const likes = likeCount(r.uid, fid), liked = !!myLikes()[likeKey(r.uid, fid)];
    const cms = commentsFor(r.uid, fid);
    const mine = r.uid === myId;
    const can = myId && canWrite && storeState === 'ready';
    const key = r.uid + '|' + r.rid;
    const open = vs.open === key;
    return `<article class="seat-rv">
      <div class="sr-head"><b>${esc(secLabel(r))}</b>${r.show ? `<span class="muted">· ${esc(r.show)}</span>` : ''}</div>
      <div class="sr-scores">${SCORE.map(([k, e, l]) => `<span>${e} ${l} ${miniStars(+r[k] || 0)}</span>`).join('')}</div>
      ${(r.tags || []).length ? `<div class="sr-tags">${r.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      ${r.text ? `<p>${esc(r.text)}</p>` : ''}
      <div class="sr-foot"><span class="muted"><span data-name="${esc(r.uid)}">관람객</span> · ${r.at ? fmtDate(new Date(r.at)) : ''}</span>
        <span class="sr-acts">
          <button type="button" class="like-btn" data-seat-like="${esc(key)}" aria-pressed="${liked}" ${!can || mine ? 'disabled' : ''} title="${mine ? '내 후기에는 공감할 수 없어요' : '공감'}">♥ 공감 ${likes}</button>
          <button type="button" class="like-btn" data-seat-cm="${esc(key)}" aria-expanded="${open}">💬 댓글 ${cms.length}</button>
          ${mine ? (vs.confirmDel === r.rid ? `<span class="muted">삭제할까요?</span><button type="button" class="link danger" data-seat-del="${esc(r.rid)}">삭제</button><button type="button" class="link" data-seat-del="">취소</button>` : `<button type="button" class="link danger" data-seat-delask="${esc(r.rid)}">삭제</button>`) : ''}
        </span></div>
      ${open ? `<div class="sr-cms">${cms.map(c => `<div class="sr-cm"><span><b data-name="${esc(c.by)}">관람객</b> ${esc(c.text)}</span><span class="muted">${fmtDate(new Date(c.at))}${c.by === myId ? ` <button type="button" class="link danger" data-seat-cmdel="${esc(c.key)}">삭제</button>` : ''}</span></div>`).join('') || '<div class="muted">아직 댓글이 없어요.</div>'}
        ${can ? `<form class="sr-cm-form" id="seat-cm-form" data-key="${esc(key)}"><input type="text" id="seat-cm-text" maxlength="300" placeholder="댓글 달기" value="${esc(vs.cmText)}"><button type="submit" class="submit">등록</button></form>` : ''}</div>` : ''}
    </article>`;
  }
  function venueReviewsHTML(v) {
    let list = seatReviews(v.id);
    if (!list.length) return storeState === 'loading' ? '' : `<div class="muted">아직 올라온 좌석 후기가 없어요.</div>`;
    const floors = FLOORS.filter(f => list.some(r => (r.fl || '기타') === f));
    if (vs.fl) list = list.filter(r => (r.fl || '기타') === vs.fl);
    if (vs.sec) list = list.filter(r => secKey(r) === vs.sec);
    if (vs.sort === 'likes') list = [...list].sort((a, b) => likeCount(b.uid, seatFid(b.rid)) - likeCount(a.uid, seatFid(a.rid)) || (b.at || 0) - (a.at || 0));
    const chip = (attr, val, label, on) => `<button type="button" class="tag-btn" ${attr}="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
    return `<div class="sr-filter"><div class="tag-pick">${chip('data-seat-fl', '', '전체', !vs.fl && !vs.sec)}${floors.map(f => chip('data-seat-fl', f, f, vs.fl === f && !vs.sec)).join('')}${vs.sec ? chip('data-seat-sec', '', vs.sec + ' ✕', true) : ''}</div>
        <div class="sr-sort">${[['new', '최신순'], ['likes', '공감순']].map(([k, l]) => `<button type="button" class="link${vs.sort === k ? '' : ' muted'}" data-seat-sort="${k}">${l}</button>`).join('')}</div></div>
      ${list.length ? list.map(seatCardHTML).join('') : '<div class="muted">조건에 맞는 후기가 없어요.</div>'}`;
  }
  function renderVenueLive() {
    const r = currentRoute(); if (r.view !== 'venue') return;
    const v = VENUES.find(x => x.id === r.id); if (!v) return;
    const cmFocus = document.activeElement?.id === 'seat-cm-text';
    if ($('seat-cm-text')) vs.cmText = $('seat-cm-text').value;
    const st = $('venue-stats'); if (st) st.innerHTML = venueStatsHTML(v);
    const rv = $('venue-reviews'); if (rv) rv.innerHTML = venueReviewsHTML(v);
    const n = $('vr-count'); if (n) n.textContent = seatReviews(v.id).length || '';
    if (cmFocus && $('seat-cm-text')) { const i = $('seat-cm-text'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    fillNames([...new Set([...document.querySelectorAll('#venue-reviews [data-name]')].map(e => e.dataset.name))]);
  }
  function renderSeatForm() {
    const r = currentRoute(); const v = VENUES.find(x => x.id === r.id); const box = $('venue-form');
    if (box && v) box.innerHTML = seatFormHTML(v);
  }
  function syncSeatForm() {
    if (!vs.f) return;
    const g = (id) => $(id)?.value ?? null;
    [['fl', 'sf-fl'], ['sec', 'sf-sec'], ['row', 'sf-row'], ['show', 'sf-show'], ['text', 'sf-text']].forEach(([k, id]) => { const x = g(id); if (x !== null) vs.f[k] = x; });
  }
  function seatMsg(t, err) { vs.msg = t; vs.err = !!err; const el = $('sf-msg'); if (el) { el.textContent = t; el.className = 'msg' + (err ? ' err' : ''); } }
  async function saveSeat(v) {
    if (vs.busy) return;
    syncSeatForm();
    const f = vs.f;
    if (!f.fl) return seatMsg('층을 골라 주세요.', true);
    if (!f.sight || !f.sound || !f.comfort) return seatMsg('👀 시야, 🔊 음향, 🪑 편안함 별점을 모두 매겨 주세요.', true);
    const seats = { ...(myDoc().seats || {}) };
    if (Object.keys(seats).length >= 100) return seatMsg('좌석 후기는 한 사람당 100개까지 남길 수 있어요.', true);
    const rid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    seats[rid] = { v: v.id, fl: f.fl, sec: f.sec.trim().replace(/\s*구역$/, '').slice(0, 12), row: f.row.trim().replace(/\s*열$/, '').slice(0, 8), show: f.show.trim().slice(0, 60),
      sight: f.sight, sound: f.sound, comfort: f.comfort, tags: f.tags.filter(t => SEAT_TAGS.includes(t)), text: f.text.trim().slice(0, 1000), at: Date.now() };
    const patch = { seats };
    try { if (typeof useNick !== 'undefined' && useNick && !myDoc().nick && typeof savedNick === 'function' && savedNick()) patch.nick = savedNick().slice(0, 20); } catch {}
    vs.busy = true; $('sf-submit').disabled = true; seatMsg('올리는 중이에요…');
    try {
      await saveMyDoc(patch);
      vs.f = blankSeatForm(); vs.msg = ''; vs.err = false; vs.fl = ''; vs.sec = '';
      toast('좌석 후기를 올렸어요'); renderSeatForm(); renderVenueLive();
      $('venue-rv-label')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { seatMsg(e?.code === 'quota_exceeded' ? '저장 공간이 가득 찼어요.' : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.', true); }
    finally { vs.busy = false; const b = $('sf-submit'); if (b) b.disabled = false; }
  }
  async function seatClick(e) {
    const t = (sel) => e.target.closest(sel);
    let b;
    if ((b = t('[data-seat-star]'))) {
      const [k, n] = b.dataset.seatStar.split('|'); vs.f[k] = +n;
      b.parentElement.querySelectorAll('button').forEach((x, i) => { x.classList.toggle('on', i < +n); x.setAttribute('aria-checked', String(i + 1 === +n)); });
      return true;
    }
    if ((b = t('[data-seat-tag]'))) {
      const tag = b.dataset.seatTag; const on = vs.f.tags.includes(tag);
      vs.f.tags = on ? vs.f.tags.filter(x => x !== tag) : [...vs.f.tags, tag]; b.setAttribute('aria-pressed', String(!on));
      return true;
    }
    if ((b = t('[data-seat-fl]'))) { vs.fl = b.dataset.seatFl; vs.sec = ''; renderVenueLive(); return true; }
    if ((b = t('[data-seat-sec]'))) { vs.sec = vs.sec === b.dataset.seatSec ? '' : b.dataset.seatSec; vs.fl = ''; renderVenueLive(); if (vs.sec) $('venue-rv-label')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return true; }
    if ((b = t('[data-seat-sort]'))) { vs.sort = b.dataset.seatSort; renderVenueLive(); return true; }
    if ((b = t('[data-seat-cm]'))) { vs.open = vs.open === b.dataset.seatCm ? null : b.dataset.seatCm; vs.cmText = ''; renderVenueLive(); if (vs.open) $('seat-cm-text')?.focus(); return true; }
    if ((b = t('[data-seat-delask]'))) { vs.confirmDel = b.dataset.seatDelask; renderVenueLive(); return true; }
    if ((b = t('[data-seat-del]'))) {
      const rid = b.dataset.seatDel; vs.confirmDel = null;
      if (!rid) { renderVenueLive(); return true; }
      const seats = { ...(myDoc().seats || {}) }; delete seats[rid];
      try { await saveMyDoc({ seats }); toast('좌석 후기를 삭제했어요'); } catch { toast('삭제하지 못했어요.'); renderVenueLive(); }
      return true;
    }
    if ((b = t('[data-seat-like]'))) {
      const [uid, rid] = b.dataset.seatLike.split('|'); const k = likeKey(uid, seatFid(rid));
      const likes = { ...myLikes() }; if (likes[k]) delete likes[k]; else likes[k] = true;
      try { await saveMyDoc({ likes }); } catch { toast('공감하지 못했어요.'); }
      return true;
    }
    if ((b = t('[data-seat-cmdel]'))) {
      const comments = { ...(myDoc().comments || {}) }; delete comments[b.dataset.seatCmdel];
      try { await saveMyDoc({ comments }); toast('댓글을 삭제했어요'); } catch { toast('삭제하지 못했어요.'); }
      return true;
    }
    return false;
  }
  async function seatCommentSubmit(formEl) {
    const input = $('seat-cm-text'); const text = (input?.value || '').trim(); if (!text) return;
    const [uid, rid] = formEl.dataset.key.split('|');
    const cid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const comments = { ...(myDoc().comments || {}), [uid + '~' + seatFid(rid) + '~' + cid]: { text: text.slice(0, 300), at: Date.now() } };
    try { vs.cmText = ''; input.value = ''; await saveMyDoc({ comments }); } catch { vs.cmText = text; toast('댓글을 올리지 못했어요.'); renderVenueLive(); }
  }
  /*VENUES-END*/

  /* ---------- 리뷰 ---------- */
  // reviews/<viewerId> 문서 하나에 { films: { <영화id>: {rating, text, at}, ... } }
  const form = { filmId: null, nick: '', rating: 0, verdict: '', title: '', text: '', editing: false, busy: false, msg: '', err: false, confirmDel: null, filter: 'all', sort: 'new', open: null };
  Object.assign(form, { cmOpen: null, cmText: '', cmBusy: false, cmMsg: '', cmConfirm: null });
  const syncForm = () => { if ($('rv-text')) form.text = $('rv-text').value; if ($('rv-title')) form.title = $('rv-title').value; if ($('cm-text')) form.cmText = $('cm-text').value; if ($('rv-nick')) form.nick = $('rv-nick').value; };
  function reviewsFor(filmId) {
    const out = [];
    reviewDocs.forEach(d => { const r = d.films && d.films[filmId]; if (r && r.rating) out.push({ uid: d.uid, ...r }); });
    return out.sort((a, b) => (b.at || 0) - (a.at || 0));
  }
  const myFilms = () => (reviewDocs.find(d => d.uid === myId)?.films) || {};
  const starsRead = (n) => `<span class="stars-read" aria-label="별점 ${n}점">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;

  // 👍/👎: 직접 고른 값이 없으면(예전 리뷰) 별점 3점 이상을 👍로 봄
  // 추천: 각 사람의 reviews/<id> 문서 안 likes 맵에 "작성자id~영화id": true 로 저장
  const likeKey = (uid, filmId) => uid + '~' + filmId;
  const myDoc = () => reviewDocs.find(d => d.uid === myId) || { films: {}, likes: {}, comments: {}, hype: {}, seats: {} };
  // 기대돼요: 각 사람의 reviews/<id> 문서 안 hype 맵에 "영화id": true
  const hypeCount = (filmId) => reviewDocs.filter(d => d.hype && d.hype[filmId]).length;
  const myHype = (filmId) => !!(myDoc().hype || {})[filmId];
  function renderHype() {
    const box = $('hype-box'); if (!box) return;
    const id = currentRoute().id;
    const n = hypeCount(id), on = myHype(id);
    const can = myId && canWrite && storeState === 'ready';
    box.innerHTML = `<div class="rate-box"><div><span class="muted">기대지수</span>
      <div class="avg-big">${n}<small>명이 기대하고 있어요</small></div></div>
      <div><span class="muted">나도</span>${can
        ? `<button class="hype-btn" data-hype="${esc(id)}" aria-pressed="${on}"><span class="em">🍿</span> ${on ? '기대 중이에요' : '기대돼요'}</button><div class="muted">${on ? '다시 누르면 취소돼요.' : '개봉을 기다린다면 눌러 주세요.'}</div>`
        : `<div class="muted" style="padding-top:6px">${storeState === 'loading' ? '불러오는 중…' : (storeState === 'off' || !myId) ? '로그인하면 누를 수 있어요.' : '누를 권한이 없어요.'}</div>`}</div></div>`;
  }
  const myLikes = () => myDoc().likes || {};
  const likeCount = (uid, filmId) => { const k = likeKey(uid, filmId); return reviewDocs.filter(d => d.likes && d.likes[k]).length; };
  const docBody = (d, patch) => { const b = { films: d?.films || {}, likes: d?.likes || {}, comments: d?.comments || {}, hype: d?.hype || {} }; if (d?.nick) b.nick = d.nick; if (d?.seats && Object.keys(d.seats).length) b.seats = d.seats; /* 좌석 후기가 있을 때만 보냄 (예전 보안 규칙에서도 영화 리뷰는 저장되도록) */ return { ...b, ...patch }; };
  let useNick = false;   // GitHub 버전: 이름 대신 닉네임을 써요
  const savedNick = () => { try { return localStorage.getItem('smo.nick') || ''; } catch { return ''; } };
  const nickHTML = () => useNick ? `<input type="text" id="rv-nick" class="rv-title" maxlength="20" placeholder="닉네임 (다른 사람에게 보이는 이름, 20자까지)" value="${esc(form.nick || myDoc().nick || savedNick())}">` : '';
  async function saveMyDoc(patch) { await db.doc('reviews/' + myId).set(docBody(myDoc(), patch)); }
  // 댓글: 댓글 쓴 사람의 reviews/<id> 문서 안 comments 맵에 "리뷰작성자id~영화id~댓글id": {text, at}
  function commentsFor(authorUid, filmId) {
    const pre = authorUid + '~' + filmId + '~';
    const out = [];
    reviewDocs.forEach(d => Object.entries(d.comments || {}).forEach(([k, v]) => { if (k.startsWith(pre) && v && v.text) out.push({ key: k, by: d.uid, text: v.text, at: v.at || 0 }); }));
    return out.sort((a, b) => a.at - b.at);
  }
  const verdictOf = (r) => r.verdict === 'good' || r.verdict === 'bad' ? r.verdict : (r.rating >= 3 ? 'good' : 'bad');
  const vtag = (r) => verdictOf(r) === 'good' ? '<span class="vtag" role="img" aria-label="좋아요" title="좋아요">👍</span>' : '<span class="vtag" role="img" aria-label="싫어요" title="싫어요">👎</span>';
  function statsFor(id) {
    const list = reviewsFor(id);
    const n = list.length;
    const avg = n ? list.reduce((s, x) => s + x.rating, 0) / n : 0;
    const good = list.filter(r => verdictOf(r) === 'good').length;
    const dist = [5, 4, 3, 2, 1].map(s => [s, list.filter(r => r.rating === s).length]);
    const posts = list.filter(r => r.text || r.title);   // 별점만 준 사람은 평균에만 들어가고 글 목록에는 안 나옴
    return { list, n, avg, good, bad: n - good, dist, posts };
  }
  function ratingBoxHTML(id) {
    const st = statsFor(id);
    const mine = myId ? myFilms()[id] : null;
    const my = mine?.rating || 0;
    const can = myId && canWrite && storeState === 'ready';
    const why = storeState === 'loading' ? '불러오는 중…' : (storeState === 'off' || !myId) ? '로그인하면 별점을 매길 수 있어요.' : '별점을 매길 권한이 없어요.';
    return `<div class="rate-box">
      <div><span class="muted">평균 별점</span><div class="avg-big">${st.n ? '★ ' + st.avg.toFixed(1) : '–'}<small>${st.n ? `/ 5 · ${st.n}명 참여` : '아직 없어요'}</small></div></div>
      <div><span class="muted">내 별점</span>${can
        ? `<div class="stars quick" role="radiogroup" aria-label="내 별점">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${my === n}" aria-label="${n}점" data-quick="${n}" class="${n <= my ? 'on' : ''}">★</button>`).join('')}</div><div class="muted">${my ? `${my}점을 줬어요. 다시 누르면 바뀌어요.` : '별을 눌러 별점을 매겨 주세요.'}</div>`
        : `<div class="muted" style="padding-top:6px">${why}</div>`}</div>
    </div>`;
  }
  function summaryHTML(st) {
    if (!st.n) return '';
    const gp = Math.round(st.good / st.n * 100);
    return `<div class="rv-sum">
      <div class="rv-score">${st.avg.toFixed(1)}<small>/ 5 · ${st.n}명</small></div>
      <div class="rv-bars">
        <div class="split" role="img" aria-label="좋아요 ${gp}퍼센트, 싫어요 ${100 - gp}퍼센트"><span class="good" style="width:${gp}%"></span></div>
        <div class="split-lbl"><span>👍 좋아요 ${gp}% (${st.good})</span><span>👎 싫어요 ${100 - gp}% (${st.bad})</span></div>
        <div class="dist">${st.dist.map(([s, c]) => `<span>${s}★</span><span class="dbar"><i style="width:${c / st.n * 100}%"></i></span><span class="muted">${c}</span>`).join('')}</div>
      </div></div>`;
  }
  function pickCard(r, kind) {
    const label = kind === 'good' ? '최근 👍 리뷰' : '최근 👎 리뷰';
    if (!r) return `<div class="pick"><span class="muted">${label}</span><span class="muted">아직 ${kind === 'good' ? '👍' : '👎'} 리뷰가 없어요.</span></div>`;
    return `<div class="pick"><span class="muted">${label}</span><div>${vtag(r)} ${starsRead(r.rating)}</div>${r.title ? `<b>${esc(r.title)}</b>` : ''}${r.text ? `<p>${esc(r.text)}</p>` : ''}<span class="muted"><span data-name="${esc(r.uid)}">관람객</span> · ${r.at ? fmtDate(new Date(r.at)) : ''}</span></div>`;
  }
  function renderSummary() {
    const box = $('review-summary'); if (!box) return;
    const id = form.filmId;
    const st = statsFor(id);
    let body;
    if (storeState === 'off') body = `<div class="note">리뷰는 claude.ai에 로그인한 상태에서 보고 쓸 수 있어요.</div>`;
    else if (storeState === 'loading') body = `<div class="note">리뷰를 불러오는 중…</div>`;
    else if (storeState === 'error') body = `<div class="note">리뷰를 불러오지 못했어요. 페이지를 다시 열어 주세요.</div>`;
    else if (!st.n) body = `<div class="note">아직 리뷰가 없어요. 첫 리뷰를 남겨 보세요.</div>`;
    else body = summaryHTML(st) + `<div class="rv-pick">${pickCard(st.posts.find(r => verdictOf(r) === 'good'), 'good')}${pickCard(st.posts.find(r => verdictOf(r) === 'bad'), 'bad')}</div>`;
    box.innerHTML = body + `<a class="rv-cta" href="#reviews-${id}"><span>${st.posts.length ? `리뷰 ${st.posts.length}개 모두 보기 · 리뷰 쓰기` : '리뷰 쓰러 가기'}</span><span>→</span></a>`;
    const rb = $('rating-box'); if (rb) rb.innerHTML = ratingBoxHTML(id);
    fillNames(st.list.map(r => r.uid));
  }

  function renderReviews() {
    const box = $('reviews'); if (!box) return;
    const id = form.filmId;
    const st = statsFor(id);
    const all = st.posts;
    const goodN = all.filter(r => verdictOf(r) === 'good').length;
    let list = all.filter(r => form.filter === 'all' || verdictOf(r) === form.filter);
    if (form.sort === 'likes') list = [...list].sort((a, b) => likeCount(b.uid, id) - likeCount(a.uid, id) || (b.at || 0) - (a.at || 0));
    else if (form.sort === 'high') list =[...list].sort((a, b) => b.rating - a.rating || (b.at || 0) - (a.at || 0));
    else if (form.sort === 'low') list = [...list].sort((a, b) => a.rating - b.rating || (b.at || 0) - (a.at || 0));
    const mine = myId ? myFilms()[id] : null;
    const hasPost = !!(mine && (mine.text || mine.title));
    const showForm = !hasPost || form.editing;
    if (mine && !hasPost && !form.rating) form.rating = mine.rating;   // 별점만 줬던 사람은 그 별점이 미리 채워짐

    let formHTML = '';
    if (storeState === 'off') formHTML = `<div class="note">리뷰는 claude.ai에 로그인한 상태에서 보고 쓸 수 있어요.</div>`;
    else if (!myId) formHTML = `<div class="note">리뷰를 쓰려면 로그인한 계정으로 열어 주세요.</div>`;
    else if (!canWrite) formHTML = `<div class="note">이 페이지에서 리뷰를 쓸 권한이 없어요. 페이지 주인에게 참여자(Contributor) 이상 권한을 요청해 주세요.</div>`;
    else if (showForm) formHTML = `<form class="rv-form" id="rv-form">
        <span class="muted">${hasPost ? '내 리뷰 고치기' : '리뷰 쓰기'}</span>
        <div class="fields">
          <div class="verdict" role="radiogroup" aria-label="좋아요 또는 싫어요">
            <button type="button" role="radio" class="good" data-verdict="good" aria-checked="${form.verdict === 'good'}" aria-pressed="${form.verdict === 'good'}"><span class="em">👍</span> 좋아요</button>
            <button type="button" role="radio" class="bad" data-verdict="bad" aria-checked="${form.verdict === 'bad'}" aria-pressed="${form.verdict === 'bad'}"><span class="em">👎</span> 싫어요</button>
          </div>
          <div class="stars" role="radiogroup" aria-label="별점">${[1,2,3,4,5].map(n => `<button type="button" role="radio" aria-checked="${form.rating === n}" aria-label="${n}점" data-star="${n}" class="${n <= form.rating ? 'on' : ''}">★</button>`).join('')}</div>
          ${nickHTML()}
          <input type="text" id="rv-title" class="rv-title" maxlength="60" placeholder="제목 (예: 올해 최고의 반전, 기대보다 아쉬웠던 후반부)" value="${esc(form.title)}">
          <textarea id="rv-text" maxlength="1000" placeholder="${form.verdict === 'bad' ? '아쉬웠던 점을 솔직하게 적어 주세요. 스포일러는 피해 주세요.' : '영화를 보고 나서 어땠나요? 스포일러는 피해 주세요.'}">${esc(form.text)}</textarea>
          <div class="form-row">
            <span class="msg ${form.err ? 'err' : ''}">${esc(form.msg) || '<span id="rv-count">' + form.text.length + '</span> / 1000'}</span>
            <span style="display:flex;gap:14px;align-items:center">${hasPost ? `<button type="button" class="link muted" id="rv-cancel">취소</button>` : ''}<button type="submit" class="submit" ${form.busy ? 'disabled' : ''}>${hasPost ? '수정 저장' : '리뷰 등록'}</button></span>
          </div>
        </div>
      </form>`;

    let listHTML;
    if (storeState === 'loading') listHTML = `<div class="note">리뷰를 불러오는 중…</div>`;
    else if (storeState === 'slow' && !list.length) listHTML = `<div class="note">리뷰 서버에 아직 연결되지 않았어요. 잠시 후 다시 확인해 주세요.</div>`;
    else if (storeState === 'error') listHTML = `<div class="note">리뷰를 불러오지 못했어요. 페이지를 다시 열어 주세요.</div>`;
    else if (storeState === 'off') listHTML = '';
    else if (!all.length) listHTML = `<div class="note">아직 리뷰가 없어요. 첫 리뷰를 남겨 보세요.</div>`;
    else if (!list.length) listHTML = `<div class="note">${form.filter === 'good' ? '👍' : '👎'} 리뷰가 아직 없어요.</div>`;
    else listHTML = list.map(r => {
      const isMe = r.uid === myId;
      const confirming = form.confirmDel === r.uid;
      const acts = confirming
        ? `<span>이 리뷰를 삭제할까요?</span><button class="danger" data-act="del-yes" data-uid="${esc(r.uid)}">삭제</button><button data-act="del-no">취소</button>`
        : (isMe ? `<button data-act="edit">수정</button><button data-act="del" data-uid="${esc(r.uid)}">삭제</button>`
                : (isOwner ? `<button data-act="del" data-uid="${esc(r.uid)}">삭제 (관리자)</button>` : ''));
      const k = likeKey(r.uid, id);
      const n = likeCount(r.uid, id);
      const liked = !!myLikes()[k];
      const open = form.open === r.uid;
      const cms = commentsFor(r.uid, id);
      const cmOpen = form.cmOpen === r.uid;
      const canComment = myId && canWrite && storeState === 'ready';
      const cmHTML = !cmOpen ? '' : `<div class="cm-box">
          ${cms.length ? cms.map(c => {
            const mineC = c.by === myId;
            const confirmingC = form.cmConfirm === c.key;
            const delC = confirmingC
              ? `<span>삭제할까요?</span><button class="danger" data-cm-del="${esc(c.key)}" data-cm-by="${esc(c.by)}">삭제</button><button data-cm-cancel>취소</button>`
              : (mineC || isOwner ? `<button data-cm-ask="${esc(c.key)}">삭제${mineC ? '' : ' (관리자)'}</button>` : '');
            return `<div class="cm">
              <div class="cm-meta"><img alt="" data-avatar="${esc(c.by)}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><span data-name="${esc(c.by)}">관람객</span>${c.by === r.uid ? '<span class="cm-author">작성자</span>' : ''}${mineC ? '<span>(나)</span>' : ''}<span>·</span><span>${c.at ? fmtDate(new Date(c.at)) : ''}</span><span class="cm-acts">${delC}</span></div>
              <p>${esc(c.text)}</p></div>`;
          }).join('') : `<div class="muted cm-empty">아직 댓글이 없어요.</div>`}
          ${canComment ? `<form class="cm-form" id="cm-form" data-target="${esc(r.uid)}">
            <textarea id="cm-text" maxlength="300" rows="2" placeholder="댓글을 남겨 주세요. 서로 존중하는 대화를 부탁드려요.">${esc(form.cmText)}</textarea>
            <button type="submit" class="submit" ${form.cmBusy ? 'disabled' : ''}>등록</button>
          </form>${form.cmMsg ? `<div class="msg err">${esc(form.cmMsg)}</div>` : ''}` : `<div class="muted cm-empty">댓글을 쓰려면 로그인한 계정으로, 참여자(Contributor) 이상 권한이 있어야 해요.</div>`}
        </div>`;
      return `<article class="post ${open ? 'open' : ''}">
        <div class="lk"><b>${n}</b><span>공감</span></div>
        <div class="body">
          <div class="pt">${vtag(r)} <span>${esc(r.title || (r.text || '').slice(0, 30) || '제목 없음')}${cms.length ? ` <em class="cm-count">[${cms.length}]</em>` : ''}</span></div>
          ${r.text ? `<p class="ex" data-open="${esc(r.uid)}" title="${open ? '접기' : '전체 보기'}">${esc(r.text)}</p>` : ''}
          <div class="meta">${starsRead(r.rating)}<span>·</span><img alt="" data-avatar="${esc(r.uid)}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><span data-name="${esc(r.uid)}">관람객</span>${isMe ? '<span>(나)</span>' : ''}<span>·</span><span class="when">${r.at ? fmtDate(new Date(r.at)) : ''}</span></div>
          <div class="acts">
            ${!isMe && myId && canWrite && storeState === 'ready' ? `<button class="like-btn" data-like="${esc(r.uid)}" aria-pressed="${liked}">♥ ${liked ? '공감함' : '공감'} ${n}</button>` : ''}
            <button class="cm-toggle" data-cm-toggle="${esc(r.uid)}" aria-expanded="${cmOpen}">댓글 ${cms.length}${cmOpen ? ' 접기' : ''}</button>
            ${acts}
          </div>
          ${cmHTML}
        </div>
      </article>`;
    }).join('');

    const tools = all.length ? `<div class="rv-tools">
        <div class="seg" role="group" aria-label="리뷰 종류">${[['all', '전체', all.length], ['good', '👍 좋아요', goodN], ['bad', '👎 싫어요', all.length - goodN]].map(([k, l, c]) => `<button data-filter="${k}" aria-pressed="${form.filter === k}">${l} ${c}</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="정렬">${[['new', '최신순'], ['likes', '공감순'], ['high', '별점 높은순'], ['low', '별점 낮은순']].map(([k, l]) => `<button data-sort="${k}" aria-pressed="${form.sort === k}">${l}</button>`).join('')}</div>
      </div>` : '';
    box.innerHTML = `${summaryHTML(st)}${formHTML}${tools}${listHTML}`;
    fillNames([...new Set([...all.map(r => r.uid), ...(form.cmOpen ? commentsFor(form.cmOpen, id).map(c => c.by) : [])])]);
  }
  async function fillNames(ids) {
    if (!user || !ids.length) return;
    const ps = await user.profiles(ids);
    document.querySelectorAll('[data-name]').forEach(el => { const p = ps[el.dataset.name]; if (p) el.textContent = p.name || '관람객'; });
    document.querySelectorAll('[data-avatar]').forEach(el => { const p = ps[el.dataset.avatar]; if (p) el.src = p.avatarUrl; });
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener('click', async (e) => {
    if (vs.f && currentRoute().view === 'venue' && e.target.closest('#page') && await seatClick(e)) return;
    const mAct = e.target.closest('[data-movie-act]');
    if (mAct) {
      const r = currentRoute();
      if (mAct.dataset.movieAct === 'del') { confirmDelMovie = r.id; render(); }
      else if (mAct.dataset.movieAct === 'del-no') { confirmDelMovie = null; render(); }
      else if (mAct.dataset.movieAct === 'del-yes') await deleteMovie(r.id);
      return;
    }
    const vb = e.target.closest('#rv-form [data-verdict]');
    if (vb) { form.verdict = vb.dataset.verdict; syncForm(); form.msg = ''; form.err = false; renderReviews(); return; }
    const fb = e.target.closest('[data-filter]');
    if (fb) { syncForm(); form.filter = fb.dataset.filter; renderReviews(); return; }
    const sb = e.target.closest('[data-sort]');
    if (sb) { syncForm(); form.sort = sb.dataset.sort; renderReviews(); return; }
    const hb = e.target.closest('[data-hype]');
    if (hb) {
      if (hb.disabled) return;
      hb.disabled = true;
      const fid = hb.dataset.hype;
      const hype = { ...(myDoc().hype || {}) };
      const turningOn = !hype[fid];
      if (turningOn) hype[fid] = true; else delete hype[fid];
      try { await saveMyDoc({ hype }); toast(turningOn ? '🍿 기대돼요를 눌렀어요' : '기대돼요를 취소했어요'); }
      catch (err) { if (err?.code === 'invalid_argument') canWrite = false; toast('저장하지 못했어요.'); renderHype(); }
      return;
    }
    const qb = e.target.closest('[data-quick]');
    if (qb) {
      const n = +qb.dataset.quick;
      const cur = myFilms()[form.filmId];
      if (cur?.rating === n) return;
      const entry = { ...(cur || {}), rating: n, at: cur?.at || Date.now() };
      document.querySelectorAll('[data-quick]').forEach(b => { b.classList.toggle('on', +b.dataset.quick <= n); b.disabled = true; });
      try { await saveMyDoc({ films: { ...myFilms(), [form.filmId]: entry } }); toast(`별점 ${n}점을 줬어요`); }
      catch (err) { if (err?.code === 'invalid_argument') canWrite = false; toast('별점을 저장하지 못했어요.'); renderSummary(); }
      return;
    }
    const ct = e.target.closest('[data-cm-toggle]');
    if (ct) { syncForm(); const u = ct.dataset.cmToggle; if (form.cmOpen !== u) { form.cmText = ''; form.cmMsg = ''; } form.cmOpen = form.cmOpen === u ? null : u; form.cmConfirm = null; renderReviews(); if (form.cmOpen) $('cm-text')?.focus({ preventScroll: true }); return; }
    const ca = e.target.closest('[data-cm-ask]');
    if (ca) { syncForm(); form.cmConfirm = ca.dataset.cmAsk; renderReviews(); return; }
    if (e.target.closest('[data-cm-cancel]')) { syncForm(); form.cmConfirm = null; renderReviews(); return; }
    const cd = e.target.closest('[data-cm-del]');
    if (cd) {
      syncForm();
      const key = cd.dataset.cmDel, by = cd.dataset.cmBy;
      const doc = reviewDocs.find(d => d.uid === by);
      const comments = { ...(doc?.comments || {}) }; delete comments[key];
      form.cmConfirm = null;
      try { await db.doc('reviews/' + by).set(docBody(doc, { comments })); toast('댓글을 삭제했어요'); }
      catch { toast('댓글을 삭제하지 못했어요.'); renderReviews(); }
      return;
    }
    const ob = e.target.closest('[data-open]');
    if (ob) { syncForm(); form.open = form.open === ob.dataset.open ? null : ob.dataset.open; renderReviews(); return; }
    const lb = e.target.closest('[data-like]');
    if (lb) {
      if (lb.disabled) return;
      lb.disabled = true; syncForm();
      const k = likeKey(lb.dataset.like, form.filmId);
      const likes = { ...myLikes() };
      if (likes[k]) delete likes[k]; else likes[k] = true;
      try { await saveMyDoc({ likes }); }
      catch (err) { if (err?.code === 'invalid_argument') canWrite = false; toast('공감하지 못했어요. 권한이 없거나 연결이 끊겼어요.'); renderReviews(); }
      return;
    }
    const star = e.target.closest('#rv-form [data-star]');
    if (star) { const n = +star.dataset.star; form.rating = form.rating === n ? 0 : n; syncForm(); form.msg = ''; form.err = false; renderReviews(); return; }
    if (e.target.id === 'rv-cancel') { form.editing = false; form.msg = ''; renderReviews(); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'edit') { const m = myFilms()[form.filmId]; form.editing = true; form.rating = m.rating; form.verdict = verdictOf(m); form.title = m.title || ''; form.text = m.text || ''; form.msg = ''; renderReviews(); $('rv-form')?.scrollIntoView({ block: 'center' }); }
    else if (a === 'del') { form.confirmDel = act.dataset.uid; renderReviews(); }
    else if (a === 'del-no') { form.confirmDel = null; renderReviews(); }
    else if (a === 'del-yes') {
      const uid = act.dataset.uid; form.confirmDel = null;
      const doc = reviewDocs.find(d => d.uid === uid);
      const films = { ...(doc?.films || {}) }; delete films[form.filmId];
      try { await db.doc('reviews/' + uid).set(docBody(doc, { films })); toast('리뷰를 삭제했어요'); }
      catch { toast('삭제하지 못했어요. 권한이 없거나 연결이 끊겼어요.'); renderReviews(); }
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'rv-text') { form.text = e.target.value; const c = $('rv-count'); if (c) c.textContent = form.text.length; }
    if (e.target.id === 'f-trailer') {
      const v = e.target.value.trim(); const h = $('trailer-hint');
      h.textContent = !v ? 'YouTube에서 예고편 영상을 열고 주소창의 주소나 ‘공유’ 링크를 붙여 넣어 주세요.' : ytId(v) ? '✓ YouTube 영상 주소가 확인됐어요.' : 'YouTube 영상 주소가 아니에요. youtube.com/watch?v=… 또는 youtu.be/… 형태여야 해요.';
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'f-poster') return;
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { editorMsg('JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요.', true); return; }
    if (f.size > 20 * 1024 * 1024) { editorMsg('이미지가 20MB보다 커요. 더 작은 파일을 골라 주세요.', true); return; }
    if (ed.previewUrl) URL.revokeObjectURL(ed.previewUrl);
    ed.file = f; ed.previewUrl = URL.createObjectURL(f);
    $('poster-preview').innerHTML = frame({ id: 'preview', title: '' }, 'poster', 1, { src: ed.previewUrl });
    editorMsg('저장하면 이 포스터가 올라가요.');
  });
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'movie-form') { e.preventDefault(); await saveMovie(); return; }
    if (e.target.id === 'seat-form') { e.preventDefault(); const v = VENUES.find(x => x.id === currentRoute().id); if (v) await saveSeat(v); return; }
    if (e.target.id === 'seat-cm-form') { e.preventDefault(); await seatCommentSubmit(e.target); return; }
    if (e.target.id === 'cm-form') {
      e.preventDefault();
      if (form.cmBusy) return;
      syncForm();
      const text = form.cmText.trim();
      if (text.length < 2) { form.cmMsg = '댓글을 2자 이상 써 주세요.'; renderReviews(); $('cm-text')?.focus(); return; }
      const target = e.target.dataset.target;
      const cid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const comments = { ...(myDoc().comments || {}), [target + '~' + form.filmId + '~' + cid]: { text, at: Date.now() } };
      form.cmBusy = true; form.cmMsg = ''; renderReviews();
      const cpatch = { comments };
      if (useNick && !myDoc().nick && savedNick()) cpatch.nick = savedNick().slice(0, 20);
      try { await saveMyDoc(cpatch); form.cmText = ''; toast('댓글을 등록했어요'); }
      catch (err) { if (err?.code === 'invalid_argument') canWrite = false; form.cmMsg = err?.code === 'quota_exceeded' ? '저장 공간이 가득 찼어요.' : '댓글을 등록하지 못했어요.'; }
      finally { form.cmBusy = false; renderReviews(); }
      return;
    }
    if (e.target.id !== 'rv-form') return;
    e.preventDefault();
    form.text = $('rv-text').value.trim();
    form.title = $('rv-title').value.trim();
    if (!form.verdict) { form.msg = '👍 좋아요인지 👎 싫어요인지 골라 주세요.'; form.err = true; renderReviews(); return; }
    if (!form.rating) { form.msg = '별점을 골라 주세요.'; form.err = true; renderReviews(); return; }
    if (form.title.length < 2) { form.msg = '제목을 2자 이상 써 주세요.'; form.err = true; renderReviews(); return; }
    if (form.text.length < 5) { form.msg = '리뷰를 5자 이상 써 주세요.'; form.err = true; renderReviews(); return; }
    form.busy = true; form.msg = ''; form.err = false; renderReviews();
    const films = { ...myFilms(), [form.filmId]: { rating: form.rating, verdict: form.verdict, title: form.title, text: form.text, at: Date.now() } };
    const patch = { films };
    if (useNick && $('rv-nick')) {
      const nick = $('rv-nick').value.trim().slice(0, 20);
      form.nick = nick;
      if (nick) { patch.nick = nick; try { localStorage.setItem('smo.nick', nick); } catch {} }
    }
    try {
      await saveMyDoc(patch);
      const wasEdit = form.editing;
      form.editing = false; form.rating = 0; form.verdict = ''; form.title = ''; form.text = '';
      toast(wasEdit ? '리뷰를 고쳤어요' : '리뷰를 등록했어요');
    } catch (err) {
      if (err?.code === 'invalid_argument') canWrite = false;
      else { form.msg = err?.code === 'quota_exceeded' ? '저장 공간이 가득 찼어요.' : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'; form.err = true; }
    } finally { form.busy = false; renderReviews(); }
  });

  /* ---------- 저장소 연결 ---------- */
  /* ---------- GitHub Pages용 저장소 ----------
     영화 목록은 js/data.js 에서 읽고, 별점·리뷰·추천·댓글은 이 브라우저(localStorage)에 저장해요.
     서버가 없어서 다른 사람과 공유되지는 않아요. */
  function staticBackend() {
    const KEY = 'smo.reviews.v1';
    const ME = 'me';
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
    const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
    const listeners = [];
    const snap = (entries) => ({ docs: entries.map(([id, d]) => ({ id, data: () => d })), metadata: { fromCache: false } });
    const emit = () => { const all = Object.entries(load()); listeners.forEach(cb => cb(snap(all))); };
    const blank = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const sdb = {
      collection: (p) => ({
        onSnapshot: (cb) => {
          if (p === 'movies') setTimeout(() => cb(snap((window.SMO_MOVIES || []).map(m => [m.id, m]))), 0);
          else { listeners.push(cb); setTimeout(emit, 0); }
          return () => {};
        }
      }),
      doc: (path) => {
        const [col, id] = path.split('/');
        return {
          set: async (body) => { if (col !== 'reviews' || id !== ME) throw { code: 'invalid_argument' }; const all = load(); all[id] = body; save(all); emit(); },
          delete: async () => { throw { code: 'invalid_argument' }; }
        };
      }
    };
    const suser = {
      id: async () => ME, isOwner: async () => false, canEdit: async () => false,
      profiles: async (ids) => { const all = load(); return Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: (all[i] || {}).nick || (i === ME ? '나' : '관람객'), avatarUrl: blank, isMe: i === ME }])); }
    };
    return { db: sdb, user: suser };
  }

  /* ---------- Firebase 저장소 (js/firebase-config.js 에 설정이 있을 때) ----------
     익명 로그인으로 방문자마다 id를 받고, Firestore의 reviews/<id> 문서에 별점·리뷰·추천·댓글·기대돼요·닉네임을 저장해요.
     모든 방문자가 같은 데이터를 봐요. */
  const nicks = {};   // 방문자 id → 닉네임 (리뷰 문서의 nick)
  async function firebaseBackend() {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.SMO_FIREBASE_CONFIG);
    const auth = firebase.auth(app);
    const fs = firebase.firestore(app);
    const cred = await Promise.race([
      auth.currentUser ? Promise.resolve({ user: auth.currentUser }) : auth.signInAnonymously(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('auth timeout')), 8000))
    ]);
    const uid = cred.user.uid;
    const blank = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const mapErr = (e) => ({ code: e && e.code === 'permission-denied' ? 'invalid_argument' : e && e.code === 'resource-exhausted' ? 'quota_exceeded' : 'unavailable' });
    const fdb = {
      collection: (p) => ({
        onSnapshot: (cb, onErr) => {
          if (p === 'movies') { setTimeout(() => cb({ docs: (window.SMO_MOVIES || []).map(m => ({ id: m.id, data: () => m })), metadata: { fromCache: false } }), 0); return () => {}; }
          return fs.collection(p).onSnapshot({ includeMetadataChanges: false }, (s) => {
            s.docs.forEach(d => { const n = (d.data() || {}).nick; if (n) nicks[d.id] = n; else delete nicks[d.id]; });
            cb({ docs: s.docs.map(d => ({ id: d.id, data: () => d.data() })), metadata: { fromCache: s.metadata.fromCache } });
          }, (e) => { console.warn('Firestore', e); onErr && onErr(mapErr(e)); });
        }
      }),
      doc: (path) => {
        const [col, id] = path.split('/');
        return {
          set: async (body) => { if (col !== 'reviews') throw { code: 'invalid_argument' }; try { await fs.collection(col).doc(id).set(body); } catch (e) { console.warn('Firestore', e); throw mapErr(e); } },
          delete: async () => { throw { code: 'invalid_argument' }; }
        };
      }
    };
    const fuser = {
      id: async () => uid, isOwner: async () => false, canEdit: async () => false,
      profiles: async (ids) => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: nicks[i] || (i === uid ? '나' : '관람객'), avatarUrl: blank, isMe: i === uid }]))
    };
    return { db: fdb, user: fuser, kind: 'firebase' };
  }

  async function initStore() {
    if (!window.claude?.use) {
      let s = null;
      if (window.SMO_FIREBASE_CONFIG && window.firebase) {
        try { s = await firebaseBackend(); }
        catch (e) { console.warn('Firebase 연결 실패, 이 브라우저 저장으로 바꿔요.', e); toast('공유 저장소에 연결하지 못해서, 이 브라우저에만 저장돼요.'); }
      }
      if (!s) s = { ...staticBackend(), kind: 'local' };
      db = s.db; user = s.user; assets = null; useNick = true;
      const note = $('store-note');
      if (note) note.textContent = s.kind === 'firebase' ? '별점·리뷰·댓글은 모든 방문자와 공유돼요.' : '별점·리뷰·댓글은 이 브라우저에만 저장돼요.';
    } else {
      try { [db, user, assets] = await Promise.all(['db', 'user', 'assets'].map(n => window.claude?.use?.(n) ?? null)); } catch { db = null; }
    }
    if (!db) { storeState = 'off'; movieState = 'off'; render(); return; }
    try { myId = user ? await user.id() : null; isOwner = user ? await user.isOwner() : false; isAdmin = user ? await user.canEdit() : false; } catch {}
    const timer = setTimeout(() => {
      if (storeState === 'loading') storeState = 'slow';
      if (movieState === 'loading') movieState = 'off';
      render();
    }, 10000);
    db.collection('movies').onSnapshot(snap => {
      registered = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.title && m.date);
      movieState = 'ready';
      if (!snap.metadata.fromCache) clearTimeout(timer);
      render(true);
    }, () => { movieState = 'off'; render(true); });
    db.collection('reviews').onSnapshot(snap => {
      reviewDocs = snap.docs.map(d => { const x = d.data() || {}; return { uid: d.id, films: x.films || {}, likes: x.likes || {}, comments: x.comments || {}, hype: x.hype || {}, seats: x.seats || {}, nick: x.nick || '' }; });
      const wasReady = storeState === 'ready';
      storeState = 'ready';
      const r = currentRoute();
      if (r.view === 'movie') { renderSummary(); renderHype(); }
      else if (r.view === 'venue') { if (!wasReady) renderSeatForm(); renderVenueLive(); }
      else if (r.view === 'reviews') { const a = document.activeElement?.id; if (a !== 'rv-text' && a !== 'rv-title' && a !== 'cm-text') renderReviews(); }
      else if (r.view === 'list') render(true);
      else if (r.view === 'home') { const n = $('home-news'); if (n) n.innerHTML = homeNewsHTML(); }
    }, () => { storeState = 'error'; renderReviews(); renderSummary(); });
  }

  /* ---------- 상단 메뉴 패널 ---------- */
  const FOCUS = { movies: 'sec-movies', concerts: 'sec-concerts', 'movies-now': 'grp-now', 'movies-soon': 'grp-soon' };
  // 특전 항목: 글자만 있어도 되고, { text, link(출처·사진 페이지), img(사진 파일) } 형태도 돼요
  const perksOf = (m) => {
    const raw = Array.isArray(m.perks) ? m.perks : (m.perks ? String(m.perks).split('\n') : []);
    return raw.map(p => typeof p === 'string' ? { text: p.trim() } : (p && (p.text || p.t)) ? { text: String(p.text || p.t).trim(), link: p.link || '', img: p.img || '' } : null).filter(p => p && p.text);
  };
  const shortDate = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
  const cut = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
  // 특전 기간 계산: "(11/11~11/17)" 같은 날짜가 있으면 그대로, "3주차"처럼 주차만 있으면 개봉일 기준으로 계산
  function perkInfo(m, p) {
    const rel = m.relDate || today;
    const y = rel.getFullYear();
    const mk = (mo, d) => { const x = new Date(y, mo - 1, d); if (x < addDays(rel, -60)) x.setFullYear(y + 1); return x; };
    let start = null, end = null;
    const r = p.text.match(/\(\s*(?:(\d{1,2})\/(\d{1,2}))?\s*~\s*(?:(\d{1,2})\/(\d{1,2}))?/);
    if (r && (r[1] || r[3])) {
      if (r[1]) start = mk(+r[1], +r[2]);
      if (r[3]) end = mk(+r[3], +r[4]);
      if (!start) start = new Date(0);            // "(~11/17)" → 지금부터 11/17까지
    } else {
      const w = p.text.match(/(\d+)\s*주차/);
      const n = w ? +w[1] : (/개봉주/.test(p.text) ? 1 : 0);
      start = n ? addDays(rel, 7 * (n - 1)) : rel;  // 주차 정보도 없으면 개봉 첫 주로 봄
    }
    if (!end) end = addDays(start.getTime() ? start : rel, 6);
    const status = today < start ? 'soon' : today > end ? 'past' : 'now';
    return { ...p, start, end, status };
  }
  const perkLabel = { now: '증정 중', soon: '예정', past: '종료' };
  function perkRowHTML(m) {
    const list = perksOf(m).map(p => perkInfo(m, p));
    const cur = list.filter(x => x.status !== 'past').sort((a, b) => (a.status === 'now' ? 0 : 1) - (b.status === 'now' ? 0 : 1));
    const past = list.filter(x => x.status === 'past');
    const safeUrl = (u) => /^(https?:\/\/|images\/|\/_blob\/)/.test(u || '') ? u : '';
    const li = (x) => {
      const link = safeUrl(x.link), img = safeUrl(x.img);
      return `<li class="perk ${x.status}"><span class="perk-tag ${x.status}">${perkLabel[x.status]}</span>
        <span class="perk-t">${esc(x.text)}${link ? ` <a class="perk-link" href="${esc(link)}" target="_blank" rel="noopener">사진·자세히 ↗</a>` : ''}
        ${img ? `<button type="button" class="perk-img" data-zoom="${esc(img)}" aria-label="특전 사진 크게 보기"><img src="${esc(img)}" alt="${esc(x.text)} 사진" loading="lazy"></button>` : ''}</span></li>`;
    };
    return `<div class="perks">
      ${cur.length ? `<ul>${cur.map(li).join('')}</ul>` : `<div class="muted">지금 증정 중인 특전이 없어요.</div>`}
      ${past.length ? `<div class="perk-past-label">지난 특전 ${past.length}</div><ul class="past">${past.map(li).join('')}</ul>` : ''}
    </div>`;
  }
  // "2주차 주말(11/14~11/17) A3 티저 포스터 · CGV" → "A3 티저 포스터"
  const perkShort = (p) => p.replace(/^[^)]*\)\s*/, '').replace(/^(개봉\s*)?\d*\s*주차\s*(평일|주말)?\s*|^개봉주\s*/, '').split(' · ')[0].trim() || p;
  const flyItem = (href, name, meta) => `<li><a href="${href}"><span class="n fit" data-min="10">${esc(name)}</span>${meta ? `<span class="x">${meta}</span>` : ''}</a></li>`;
  const flyCol = (title, href, items, empty) => `<div class="fly-col"><h4>${href ? `<a href="${href}">${title}</a>` : title}</h4>${items.length ? `<ul>${items.join('')}</ul>` : `<div class="fly-empty">${empty}</div>`}</div>`;
  function flyHTML(kind) {
    if (kind === 'movies') {
      const all = allMovies();
      if (!all.length) return `<div class="fly-col"><div class="fly-empty">영화 목록을 불러오는 중이에요…</div></div>`;
      const now = all.filter(m => m.rel <= 0).sort((a, b) => b.rel - a.rel);
      const soon = all.filter(m => m.rel > 0).sort((a, b) => a.rel - b.rel);
      // 추천: 평균 별점이 높은 상영작 → 부족하면 최신 개봉작으로 채움
      const rated = now.map(m => ({ m, a: avgOf(m.id) })).filter(x => x.a).sort((a, b) => b.a - a.a);
      // 추천: 사용자가 고른 장르 취향을 반영 (없으면 평균 별점순)
      // 후기: 가장 최근에 쓰인 리뷰
      const recent = [];
      reviewDocs.forEach(d => Object.entries(d.films || {}).forEach(([fid, r]) => { if (r && (r.title || r.text)) { const m = all.find(x => x.id === fid); if (m) recent.push({ m, r, uid: d.uid, likes: likeCount(d.uid, fid) }); } }));
      recent.sort((a, b) => (b.r.at || 0) - (a.r.at || 0));
      // 특전: 지금 증정 중인 영화 → 곧 시작하는 영화 → 지난 특전만 있는 영화 순서
      const rank = { now: 0, soon: 1, past: 2 };
      const perkMovies = all.map(m => {
        const list = perksOf(m).map(p => perkInfo(m, p));
        const cur = list.find(i => i.status === 'now') || list.find(i => i.status === 'soon') || list[0];
        return { m, cur };
      }).filter(x => x.cur).sort((a, b) => rank[a.cur.status] - rank[b.cur.status]);
      return [
        `<div class="fly-col fly-reco"><h4><a href="#movies-picks">추천</a></h4>
          <a class="reco-cta" href="#movies-picks"><span class="reco-msg"><span class="fit" data-min="11">보고 싶은 영화가 없나요?</span><span class="fit" data-min="11">추천해 드리겠습니다!</span></span><span class="reco-go">취향 고르러 가기 →</span></a></div>`,
        flyCol('개봉작', '#movies-now', now.slice(0, 6).map(m => flyItem(`#movie-${m.id}`, m.title, shortDate(m.relDate))), '상영중인 영화가 없어요.'),
        flyCol('개봉예정작', '#movies-soon', soon.slice(0, 6).map(m => { const h = hypeCount(m.id); return flyItem(`#movie-${m.id}`, m.title, `D-${m.rel}${h ? ` · 🍿${h}` : ''}`); }), '개봉 예정인 영화가 없어요.'),
        (() => {   // 후기: 공감 많은 후기 3개 + 최근 후기 3개
          const rv = (x) => flyItem(`#reviews-${x.m.id}`, x.r.title || cut(x.r.text || '', 20), `${verdictOf(x.r) === 'good' ? '👍' : '👎'} ${esc(cut(x.m.title, 8))}${x.likes ? ` · ♥ ${x.likes}` : ''}`);
          const top = recent.filter(x => x.likes > 0).sort((a, b) => b.likes - a.likes || (b.r.at || 0) - (a.r.at || 0)).slice(0, 3);
          const topKeys = new Set(top.map(x => x.uid + x.m.id));
          const latest = recent.filter(x => !topKeys.has(x.uid + x.m.id)).slice(0, 3);
          return `<div class="fly-col"><h4><a href="#movies-reviews">후기</a></h4>
            <div class="fly-sub">🔥 공감 많은 후기</div>${top.length ? `<ul>${top.map(rv).join('')}</ul>` : `<div class="fly-empty">아직 공감받은 후기가 없어요.</div>`}
            <div class="fly-sub">🆕 최근 후기</div>${latest.length ? `<ul>${latest.map(rv).join('')}</ul>` : `<div class="fly-empty">${recent.length ? '새 후기를 기다리고 있어요.' : '아직 후기가 없어요.'}</div>`}</div>`;
        })(),
        flyCol('특전', '#movies-perks', perkMovies.slice(0, 7).map(({ m, cur }) => flyItem(`#movie-${m.id}`, m.title, cur.status === 'past' ? '지난 특전' : (cur.status === 'soon' ? '예정 · ' : '') + esc(cut(perkShort(cur.text), 12)))), '특전 정보가 없어요.')
      ].join('');
    }
    const list = [...CONCERTS].sort((a, b) => a.d - b.d);
    const count = (key) => { const o = {}; list.forEach(c => { o[c[key]] = (o[c[key]] || 0) + 1; }); return Object.entries(o); };
    return [
      `<div class="fly-col fly-big"><a href="#concerts">전체 공연</a></div>`,
      flyCol('다가오는 공연', '', list.slice(0, 6).map(c => flyItem(`#concert-${c.id}`, c.title, `${shortDate(c.dateObj)} ${esc(c.city)}`)), '예정된 공연이 없어요.'),
      flyCol('장르', '', count('genre').map(([g, n]) => flyItem('#concerts', g, n)), '정보가 없어요.'),
      `<div class="fly-col"><h4><a href="#concerts">지역</a></h4>${regionChips(list, '', true)}</div>`,
      flyCol('공연장 · 좌석 후기', '#venues', VENUES.map(v => { const n = seatReviews(v.id).length; return flyItem(`#venue-${v.id}`, v.name, n ? `💬 ${n}` : esc(regionName(v.region))); }), '')
    ].join('');
  }
  /* ---------- 긴 제목 맞추기: 잘리거나 줄이 바뀌지 않게 한 줄에 들어갈 때까지 글자를 줄임 ---------- */
  function fitText(root) {
    (root || document).querySelectorAll('.fit').forEach(el => {
      el.style.fontSize = ''; el.style.transform = '';
      const avail = el.clientWidth;
      if (!avail) return;                                    // 화면에 없는 요소는 건너뜀
      const min = parseFloat(el.dataset.min || '9');
      let size = parseFloat(getComputedStyle(el).fontSize);
      let guard = 0;
      while (el.scrollWidth > avail + 0.5 && size > min && guard++ < 80) { size = Math.max(min, size - 0.5); el.style.fontSize = size + 'px'; }
      if (el.scrollWidth > avail + 0.5) {                    // 최소 크기로도 넘치면 글자 폭을 살짝 좁혀서 맞춤
        el.style.transformOrigin = 'left center';
        el.style.transform = `scaleX(${Math.max(0.55, avail / el.scrollWidth).toFixed(3)})`;
      }
    });
  }
  let fitQueued = false;
  const queueFit = () => { if (fitQueued) return; fitQueued = true; setTimeout(() => { fitQueued = false; fitText(); }, 30); };
  new MutationObserver(queueFit).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', queueFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);

  /* ---------- 라이트 / 다크 전환 (기본: 라이트, 고른 값은 브라우저에 기억) ---------- */
  const themeBtn = $('theme-btn');
  function applyTheme(t) {
    const dark = t === 'dark';
    if (dark) document.documentElement.setAttribute('data-smo-theme', 'dark'); else document.documentElement.removeAttribute('data-smo-theme');
    if (themeBtn) {
      themeBtn.textContent = dark ? '☀️ 라이트' : '🌙 다크';
      themeBtn.setAttribute('aria-label', dark ? '라이트 모드로 바꾸기' : '다크 모드로 바꾸기');
      themeBtn.setAttribute('aria-pressed', String(dark));
    }
  }
  applyTheme((() => { try { return localStorage.getItem('smo.theme') || 'light'; } catch { return 'light'; } })());
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-smo-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('smo.theme', next); } catch {}
  });

  /* ---------- 사진 크게 보기 (원본 해상도) ---------- */
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox'; lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog'); lightbox.setAttribute('aria-label', '사진 크게 보기');
  lightbox.innerHTML = '<img alt=""><button type="button" class="lb-close" aria-label="닫기">닫기 ✕</button>';
  document.body.appendChild(lightbox);
  let lbReturn = null;
  document.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (z) { lbReturn = z; const im = lightbox.querySelector('img'); im.src = z.dataset.zoom; im.alt = z.querySelector('img')?.alt || ''; lightbox.hidden = false; lightbox.querySelector('.lb-close').focus(); return; }
    if (!lightbox.hidden && (e.target === lightbox || e.target.closest('.lb-close'))) { lightbox.hidden = true; lbReturn?.focus(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) { lightbox.hidden = true; lbReturn?.focus(); } });

  const flyout = $('flyout'), scrim = $('scrim'), topBar = $('top');
  let flyOpen = null, flyTimer = null;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function openFly(kind) {
    if (!flyout) return;
    clearTimeout(flyTimer);
    flyout.innerHTML = `<div class="flyout-inner ${kind}">${flyHTML(kind)}</div>`;
    flyOpen = kind;
    flyout.classList.add('open'); scrim.classList.add('open');
    document.querySelectorAll('[data-menu]').forEach(a => { const on = a.dataset.menu === kind; a.classList.toggle('hot', on); a.setAttribute('aria-expanded', String(on)); });
  }
  function closeFly(now) {
    if (!flyout) return;
    clearTimeout(flyTimer);
    const f = () => { flyOpen = null; flyout.classList.remove('open'); scrim.classList.remove('open'); document.querySelectorAll('[data-menu]').forEach(a => { a.classList.remove('hot'); a.setAttribute('aria-expanded', 'false'); }); };
    if (now) f(); else flyTimer = setTimeout(f, 200);
  }
  if (flyout && scrim && topBar) {
    document.querySelectorAll('[data-menu]').forEach(a => {
      a.addEventListener('mouseenter', () => { if (!canHover) return; if (flyOpen !== a.dataset.menu) openFly(a.dataset.menu); else clearTimeout(flyTimer); });
      a.addEventListener('click', (e) => {
        if (!canHover) { e.preventDefault(); if (flyOpen === a.dataset.menu) closeFly(true); else openFly(a.dataset.menu); }   // 터치: 한 번 누르면 메뉴, 다시 누르면 닫힘
        else closeFly(true);
      });
      a.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); openFly(a.dataset.menu); flyout.querySelector('a')?.focus(); } });
    });
    topBar.addEventListener('mouseleave', () => { if (canHover && flyOpen) closeFly(); });
    topBar.addEventListener('mouseenter', () => clearTimeout(flyTimer));
    scrim.addEventListener('click', () => closeFly(true));
    flyout.addEventListener('click', (e) => { if (e.target.closest('a')) closeFly(true); });
    topBar.addEventListener('focusout', (e) => { if (flyOpen && !topBar.contains(e.relatedTarget)) closeFly(true); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && flyOpen) { const k = flyOpen; closeFly(true); document.querySelector(`[data-menu="${k}"]`)?.focus(); } });
  }

  /* ---------- 라우팅 ---------- */
  let started = false;
  function currentRoute() {
    const h = location.hash.slice(1);
    // 첫 화면: 영화와 콘서트를 한 페이지에 함께 보여 줌 (#movies / #concerts 는 해당 구역으로 이동)
    // 첫 화면: 영화 / 콘서트 두 항목만. 누르면 목록(#movies / #concerts)으로 이동
    if (!started || h === '' || h === 'home') return { view: 'home' };
    if (LISTS[h]) return { view: 'list', kind: h };
    let rg = h.match(/^concerts-r-([a-z]+)$/); if (rg && regionName(rg[1])) return { view: 'list', kind: 'concerts', region: rg[1] };
    rg = h.match(/^venue-([a-z]+)$/); if (rg && VENUES.find(v => v.id === rg[1])) return { view: 'venue', id: rg[1] };
    if (h === 'movie-new') return { view: 'editor', id: null };
    let m = h.match(/^edit-([A-Za-z0-9]+)$/); if (m) return { view: 'editor', id: m[1] };
    m = h.match(/^reviews-([A-Za-z0-9]+)$/); if (m) return { view: 'reviews', id: m[1] };
    m = h.match(/^movie-([A-Za-z0-9]+)$/); if (m) return { view: 'movie', id: m[1] };
    m = h.match(/^concert-([A-Za-z0-9]+)$/); if (m && CONCERTS.find(x => x.id === m[1])) return { view: 'concert', id: m[1] };
    return { view: 'home' };
  }
  function pageHome() {
    homeOpen = null;
    return `<div class="home-wrap" id="home-wrap">
      <div class="home2">
        <a class="choice2" href="#movies" data-home="movies" aria-haspopup="true" aria-expanded="false"><span class="lbl">영화</span><span class="word">Movie</span></a>
        <a class="choice2" href="#concerts" data-home="concerts" aria-haspopup="true" aria-expanded="false"><span class="lbl">콘서트</span><span class="word">Concert</span></a>
      </div>
      <div class="marquee">${marqueeHTML()}</div>
      <div class="home-sub" id="home-sub"></div>
    </div>
    <div class="home-news" id="home-news">${homeNewsHTML()}</div>`;
  }

  /* ---------- 첫 화면: 흐르는 포스터 띠 (평소: 영화+콘서트 / 영화에 올리면 영화 / 콘서트에 올리면 콘서트) ---------- */
  const mqMovie = (m) => `<a class="mq-item" href="#movie-${m.id}" tabindex="-1">${frame(m, 'poster', 1)}</a>`;
  const mqConcert = (c) => `<a class="mq-concert" href="#concert-${c.id}" tabindex="-1"><span class="mq-cp">${frame(c, 'poster', 1)}</span>
    <span class="mq-ci"><b class="fit" data-min="10">${esc(c.title)}</b><span>${fmtKo(c.dateObj)}${c.tm ? ' ' + esc(c.tm) : ''}</span><span>${esc(c.venue)}</span></span></a>`;
  function marqueeHTML() {
    const all = allMovies();
    if (!all.length && !CONCERTS.length) return '';
    const now = all.filter(m => m.rel <= 0), soon = all.filter(m => m.rel > 0);
    const cons = [...CONCERTS].sort((a, b) => a.d - b.d);
    const fill = (arr, min) => { let out = [...arr]; while (arr.length && out.length < min) out = out.concat(arr); return out; };
    // 같은 목록을 두 번 이어 붙여서 끊김 없이 계속 흐르게 함
    const row = (items, render, rev, secPerItem) => {
      const list = fill(items, 10);
      const html = list.map(render).join('');
      return `<div class="mq-row"><div class="mq-track${rev ? ' rev' : ''}" style="--dur:${Math.max(24, list.length * secPerItem)}s">${html}${html}</div></div>`;
    };
    return `<div class="mq-stage" aria-hidden="true">
      <div class="mq-set on" data-set="mix">${row(all, mqMovie, false, 3.5)}${row(cons, mqConcert, true, 6)}</div>
      <div class="mq-set" data-set="movies">${row(now.length ? now : all, mqMovie, false, 3.5)}${row(soon.length ? soon : all, mqMovie, true, 3.5)}</div>
      <div class="mq-set" data-set="concerts">${row(cons, mqConcert, false, 6)}${row([...cons].reverse(), mqConcert, true, 6)}</div>
    </div>`;
  }
  function setMarquee(kind) {
    document.querySelectorAll('.mq-set').forEach(s => s.classList.toggle('on', s.dataset.set === (kind || 'mix')));
  }

  /* ---------- 첫 화면: 오늘의 SMO 소식 ---------- */
  function homeNewsHTML() {
    const all = allMovies();
    const card = (href, label, main, sub) => `<a class="hn-card" href="${href}"><span class="hn-label">${label}</span><span class="hn-main fit" data-min="11">${esc(main)}</span><span class="hn-sub">${esc(sub)}</span></a>`;
    const out = [];
    const topRate = all.filter(m => m.stats && m.stats.rate).sort((a, b) => b.stats.rate.pct - a.stats.rate.pct)[0];
    if (topRate) out.push(card(`#movie-${topRate.id}`, '🎟️ 예매율 1위', topRate.title, `${topRate.stats.rate.pct}% · ${String(topRate.stats.rate.basis || '').split('·').pop().trim()}`));
    const soon = all.filter(m => m.rel > 0).sort((a, b) => a.rel - b.rel);
    if (soon.length) { const same = soon.filter(m => m.rel === soon[0].rel).length; out.push(card(`#movie-${soon[0].id}`, '🗓️ 개봉 임박', soon[0].title, `D-${soon[0].rel}${same > 1 ? ` · 같은 날 ${same - 1}편 더` : ''}`)); }
    const recent = [];
    reviewDocs.forEach(d => Object.entries(d.films || {}).forEach(([fid, r]) => { if (r && (r.title || r.text)) { const m = all.find(x => x.id === fid); if (m) recent.push({ m, r }); } }));
    recent.sort((a, b) => (b.r.at || 0) - (a.r.at || 0));
    out.push(recent.length
      ? card(`#reviews-${recent[0].m.id}`, `💬 최근 후기 · 전체 ${recent.length}개`, recent[0].r.title || cut(recent[0].r.text || '', 24), `${recent[0].m.title} · ★${recent[0].r.rating}`)
      : card('#movies-reviews', '💬 최근 후기', '첫 후기를 남겨 보세요', '영화를 보고 리뷰를 써 주세요'));
    const perkNow = all.reduce((s, m) => s + perksOf(m).map(p => perkInfo(m, p)).filter(x => x.status === 'now').length, 0);
    out.push(card('#movies-perks', '🎁 지금 받을 수 있는 특전', `${perkNow}개`, '극장별 선착순 증정'));
    return out.join('');
  }
  /* 첫 화면: 영화 / 콘서트에 마우스를 올리면 아래로 하위 항목이 펼쳐짐 (터치: 한 번 누르면 펼침, 두 번째에 이동) */
  let homeOpen = null, homeTimer = null;
  function openHome(kind) {
    const sub = $('home-sub'); if (!sub) return;
    clearTimeout(homeTimer);
    if (homeOpen !== kind) {
      const all = kind === 'movies' ? '영화 전체 보기' : '공연 전체 보기';
      sub.innerHTML = `<div class="home-sub-head"><a href="#${kind}">${all} →</a></div><div class="flyout-inner ${kind}">${flyHTML(kind)}</div>`;
      homeOpen = kind;
    }
    sub.classList.add('open');
    setMarquee(kind);
    $('home-wrap')?.classList.add('has-open');
    document.querySelectorAll('.choice2').forEach(c => { const on = c.dataset.home === kind; c.classList.toggle('hot', on); c.setAttribute('aria-expanded', String(on)); });
  }
  function closeHome(now) {
    clearTimeout(homeTimer);
    const f = () => {
      homeOpen = null;
      $('home-sub')?.classList.remove('open');
      setMarquee('mix');
      $('home-wrap')?.classList.remove('has-open');
      document.querySelectorAll('.choice2').forEach(c => { c.classList.remove('hot'); c.setAttribute('aria-expanded', 'false'); });
    };
    if (now) f(); else homeTimer = setTimeout(f, 250);
  }
  const homeHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('mouseover', (e) => {
    if (!homeHover || !$('home-wrap')) return;
    const c = e.target.closest('.choice2');
    if (c) { openHome(c.dataset.home); return; }
    if (e.target.closest('#home-wrap')) { clearTimeout(homeTimer); return; }
    if (homeOpen) closeHome();
  });
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.choice2');
    if (c && !homeHover && homeOpen !== c.dataset.home) { e.preventDefault(); openHome(c.dataset.home); }
  });
  document.addEventListener('focusin', (e) => { const c = e.target.closest('.choice2'); if (c) openHome(c.dataset.home); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && homeOpen) closeHome(true); });
  /* ---------- 예매 현황 (예매율 · 성별 · 연령대) ---------- */
  const AGE_EMOJI = { '10대': '🧒', '20대': '🧑', '30대': '🧑‍💼', '40대': '🧔', '40대 이상': '🧔', '50대': '🧓', '50대 이상': '🧓', '기타': '❔' };
  function statsHTML(m) {
    const s = m.stats; if (!s) return '';
    const num = (v) => Math.max(0, Math.min(100, +v || 0));
    const src = (o) => o && (o.basis || o.link) ? `<div class="st-src">${esc(o.basis || '')}${o.link && /^https?:\/\//.test(o.link) ? ` <a class="perk-link" href="${esc(o.link)}" target="_blank" rel="noopener">출처 ↗</a>` : ''}</div>` : '';
    let html = '';
    if (s.rate) html += `<div class="st-card"><div class="st-head">🎟️ 예매율</div>
      <div class="st-big">${num(s.rate.pct)}%${s.rate.rank ? `<small>🏆 전체 ${+s.rate.rank}위</small>` : ''}</div>
      ${s.rate.audience ? `<div class="muted">예매 관객 ${(+s.rate.audience).toLocaleString()}명</div>` : ''}${src(s.rate)}</div>`;
    if (s.gender) {
      const f = num(s.gender.f), mm = num(s.gender.m);
      html += `<div class="st-card"><div class="st-head">성별</div>
        <div class="st-gender"><span>🙋‍♀️ 여성 <b>${f}%</b></span><span>🙋‍♂️ 남성 <b>${mm}%</b></span></div>
        <div class="st-split" role="img" aria-label="여성 ${f}퍼센트, 남성 ${mm}퍼센트"><i class="f" style="width:${f}%"></i><i class="m" style="width:${mm}%"></i></div>${src(s.gender)}</div>`;
    }
    if (s.ages && Array.isArray(s.ages.list) && s.ages.list.length) {
      const list = s.ages.list.map(([l, p]) => [String(l), num(p)]);
      const max = Math.max(...list.filter(([l]) => l !== '기타').map(a => a[1]));
      html += `<div class="st-card st-wide"><div class="st-head">연령대</div><ul class="st-ages">${list.map(([l, p]) => {
        const top = l !== '기타' && p === max;
        return `<li class="${top ? 'top' : ''}${l === '기타' ? ' etc' : ''}"><span class="st-age">${AGE_EMOJI[l] || '🙂'} ${esc(l === '기타' ? '그 밖의 연령' : l)}</span>
          <span class="st-bar"><i style="width:${p}%"></i></span><b>${p}%</b><span class="st-crown">${top ? '👑' : ''}</span></li>`;
      }).join('')}</ul>${src(s.ages)}</div>`;
    }
    if (!html) return '';
    return `<div class="stats-wrap">${html}</div>
      <div class="st-note">🎟️ 예매율은 영화관입장권통합전산망(KOBIS) 기준으로 CGV·롯데시네마·메가박스 등 전국 극장을 합산한 값이에요. 성별·연령 분포는 공개된 CGV 예매 통계 기준이에요. 숫자는 집계 시점마다 달라질 수 있어요.</div>`;
  }

  /* 후기 화면 정렬: 최신순 / 공감순 */
  let revSort = 'new';
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rsort]');
    if (b) { revSort = b.dataset.rsort; const y = window.scrollY; render(); window.scrollTo(0, y); }
  });

  /* ---------- 영화 추천: 좋아하는 장르(여러 개) 고르기 + 싫은 장르 빼기 ---------- */
  const GENRE_SAME = { '모험': '어드벤처', '생존': '서바이벌', '추리': '미스터리', '공연 실황': '공연', '음악': '공연' };   // 같은 뜻의 장르는 하나로
  const genresOf = (m) => [...new Set(String(m.genre || '').split(/[,·/]+/).map(s => s.trim()).filter(Boolean).map(g => GENRE_SAME[g] || g))];
  const PICK_KEY = 'smo.pick.v1';
  const pick = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(PICK_KEY)) || {}; } catch {}
    return { like: new Set(s.like || []), dislike: new Set(s.dislike || []), soon: !!s.soon };
  })();
  const savePick = () => { try { localStorage.setItem(PICK_KEY, JSON.stringify({ like: [...pick.like], dislike: [...pick.dislike], soon: pick.soon })); } catch {} };
  function allGenres(all) {
    const count = {};
    all.forEach(m => genresOf(m).forEach(g => { count[g] = (count[g] || 0) + 1; }));
    return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko')).map(([g]) => g);
  }
  // 점수: 고른 장르와 겹칠수록 ↑, 평균 별점 ↑, (예정작은) 기대돼요 ↑ / 뺀 장르가 하나라도 있으면 제외
  function recommend(all) {
    const pool = all.filter(m => m.rel <= 0 || pick.soon);
    const out = [];
    pool.forEach(m => {
      const gs = genresOf(m);
      if (gs.some(g => pick.dislike.has(g))) return;
      const hit = gs.filter(g => pick.like.has(g));
      if (pick.like.size && !hit.length) return;
      const avg = avgOf(m.id) || 0;
      const hype = m.rel > 0 ? hypeCount(m.id) : 0;
      const score = hit.length * 100 + avg * 10 + hype * 3 + (m.rel <= 0 ? Math.max(0, 30 + m.rel) / 10 : 0);
      const why = [];
      if (hit.length) why.push(`${hit.join('·')} 취향 일치`);
      if (avg) why.push(`★ ${avg.toFixed(1)}`);
      if (m.rel > 0) why.push(`D-${m.rel}${hype ? ` · 🍿${hype}` : ''}`);
      else if (!avg) why.push(m.rel >= -7 ? '최근 개봉' : '상영 중');
      out.push({ m, score, why: why.join(' · '), short: avg ? `★ ${avg.toFixed(1)}` : (hit.length ? hit[0] : (m.rel > 0 ? `D-${m.rel}` : '신작')) });
    });
    return out.sort((a, b) => b.score - a.score);
  }
  function genrePicker(all) {
    const gs = allGenres(all);
    const chip = (g, kind) => {
      const on = (kind === 'like' ? pick.like : pick.dislike).has(g);
      const other = (kind === 'like' ? pick.dislike : pick.like).has(g);
      return `<button type="button" class="pk-chip ${kind} ${on ? 'on' : ''} ${other ? 'other' : ''}" data-pk="${kind}" data-genre="${esc(g)}" aria-pressed="${on}">${kind === 'dislike' && on ? '✕ ' : ''}${esc(g)}</button>`;
    };
    return `<div class="picker">
      <div class="pk-row"><div class="pk-label">👍 보고 싶은 장르 <small>여러 개 고를 수 있어요</small></div><div class="pk-chips">${gs.map(g => chip(g, 'like')).join('')}</div></div>
      <div class="pk-row"><div class="pk-label">🙅 빼고 싶은 장르 <small>이 장르가 들어간 영화는 빠져요</small></div><div class="pk-chips">${gs.map(g => chip(g, 'dislike')).join('')}</div></div>
      <div class="pk-row pk-opts">
        <label class="pk-check"><input type="checkbox" id="pk-soon" ${pick.soon ? 'checked' : ''}> 개봉 예정작도 포함</label>
        ${pick.like.size || pick.dislike.size ? `<button type="button" class="link muted" data-pk-reset>선택 초기화</button>` : ''}
      </div>
    </div>`;
  }
  const recWork = ({ m, why }) => `<a class="work" href="#movie-${m.id}">${frame(m, 'poster', 1)}<div class="work-head"><span class="t fit" data-min="9">${esc(m.title)}</span><span class="pk-why">${esc(why)}</span></div></a>`;
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-pk]');
    if (c) {
      const g = c.dataset.genre, kind = c.dataset.pk;
      const set = kind === 'like' ? pick.like : pick.dislike, other = kind === 'like' ? pick.dislike : pick.like;
      if (set.has(g)) set.delete(g); else { set.add(g); other.delete(g); }   // 같은 장르를 '좋아요'와 '빼기'에 동시에 넣지 않음
      savePick(); const y = window.scrollY; render(); window.scrollTo(0, y);
      return;
    }
    if (e.target.closest('[data-pk-reset]')) { pick.like.clear(); pick.dislike.clear(); savePick(); const y = window.scrollY; render(); window.scrollTo(0, y); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'pk-soon') { pick.soon = e.target.checked; savePick(); const y = window.scrollY; render(); window.scrollTo(0, y); }
  });

  /* ---------- 두 번째 화면: 고른 항목만 보여 주는 목록 ---------- */
  const LISTS = { movies: 1, 'movies-picks': 1, 'movies-now': 1, 'movies-soon': 1, 'movies-reviews': 1, 'movies-perks': 1, concerts: 1, venues: 1 };
  function subNav(kind) {
    const tabs = [['movies', '전체'], ['movies-picks', '추천'], ['movies-now', '개봉작'], ['movies-soon', '개봉예정작'], ['movies-reviews', '후기'], ['movies-perks', '특전']];
    return `<nav class="subnav" aria-label="영화 목록 종류">${tabs.map(([k, l]) => `<a href="#${k}"${k === kind ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  }
  const listIntro = (title, desc, count) => `<div class="intro"><h1>${title}${count != null ? ` (${count})` : ''}</h1><div><p>${desc}</p></div></div>`;
  const posterGrid = (list, empty) => list.length ? `<div class="works">${list.map(movieWork).join('')}</div>` : `<div class="note">${empty}</div>`;
  function pageList(kind, route) {
    if (kind === 'concerts') return pageConcerts(route && route.region);
    if (kind === 'venues') return pageVenues();
    if (kind === 'movies') return pageMovies();
    if (movieState === 'loading') return listIntro('영화', '영화 목록을 불러오는 중이에요…');
    const all = allMovies();
    const now = all.filter(m => m.rel <= 0).sort((a, b) => b.rel - a.rel);
    const soon = all.filter(m => m.rel > 0).sort((a, b) => a.rel - b.rel);
    if (kind === 'movies-now')
      return listIntro('개봉작', '지금 극장에서 상영 중인 영화예요. 포스터를 누르면 시놉시스, 예고편, 정보, 리뷰를 볼 수 있어요.', now.length) + subNav(kind) + `<div class="list-gap"></div>` + posterGrid(now, '상영 중인 영화가 없어요.');
    if (kind === 'movies-soon')
      return listIntro('개봉예정작', '곧 개봉하는 영화예요. 🍿 기대돼요를 눌러 기대지수를 올려 보세요.', soon.length) + subNav(kind) + `<div class="list-gap"></div>` + posterGrid(soon, '개봉 예정인 영화가 없어요.');
    if (kind === 'movies-picks') {
      const recs = recommend(all);
      const liked = [...pick.like], disliked = [...pick.dislike];
      const summary = liked.length || disliked.length
        ? `${liked.length ? `👍 ${liked.map(esc).join(' · ')}` : ''}${liked.length && disliked.length ? '&nbsp;&nbsp;' : ''}${disliked.length ? `🙅 ${disliked.map(esc).join(' · ')} 제외` : ''}`
        : '장르를 고르지 않아서 평균 별점이 높은 순서로 보여 줘요.';
      const empty = liked.length ? '고른 장르에 맞는 영화가 없어요. 장르를 더 고르거나 ‘개봉 예정작도 포함’을 켜 보세요.' : '추천할 영화가 없어요. 빼고 싶은 장르를 줄여 보세요.';
      return listIntro('추천', '좋아하는 장르나 지금 보고 싶은 장르를 여러 개 고르고, 싫은 장르는 빼 보세요. 취향에 맞는 영화를 골라 드려요.', null) + subNav(kind) + `<div class="list-gap"></div>` +
        genrePicker(all) +
        `<div class="pk-result"><span>추천 결과 <b>${recs.length}</b>편</span><span class="muted">${summary}</span></div>` +
        (recs.length ? `<div class="works">${recs.map(x => recWork(x)).join('')}</div>` : `<div class="note">${empty}</div>`);
    }
    if (kind === 'movies-reviews') {
      const recent = [];
      reviewDocs.forEach(d => Object.entries(d.films || {}).forEach(([fid, r]) => { if (r && (r.title || r.text)) { const m = all.find(x => x.id === fid); if (m) recent.push({ m, r, uid: d.uid }); } }));
      recent.forEach(x => { x.likes = likeCount(x.uid, x.m.id); });
      if (revSort === 'likes') recent.sort((a, b) => b.likes - a.likes || (b.r.at || 0) - (a.r.at || 0));
      else recent.sort((a, b) => (b.r.at || 0) - (a.r.at || 0));
      const cards = recent.slice(0, 40).map(({ m, r, uid, likes }) => `<a class="rv-card" href="#reviews-${m.id}">
          <div class="rv-card-poster">${frame(m, 'poster', 1)}</div>
          <div class="rv-card-body"><span class="muted">${esc(m.title)}</span>
            <b>${vtag(r)} ${esc(r.title || cut(r.text || '', 30))}</b>
            ${r.text ? `<p>${esc(r.text)}</p>` : ''}
            <span class="muted">${starsRead(r.rating)} · <span data-name="${esc(uid)}">관람객</span> · ${r.at ? fmtDate(new Date(r.at)) : ''}${likes ? ` · <span class="rv-like">♥ 공감 ${likes}</span>` : ''}</span></div></a>`).join('');
      const sortTabs = `<div class="seg rv-sort" role="group" aria-label="후기 정렬">${[['new', '🆕 최신순'], ['likes', '🔥 공감순']].map(([k, l]) => `<button type="button" data-rsort="${k}" aria-pressed="${revSort === k}">${l}</button>`).join('')}</div>`;
      return listIntro('후기', '관람객들이 남긴 리뷰예요. 최신순이나 공감을 많이 받은 순서로 볼 수 있고, 누르면 그 영화의 리뷰 페이지로 이동해요.', recent.length) + subNav(kind) + `<div class="list-gap"></div>` + (recent.length ? sortTabs : '') +
        (storeState === 'loading' ? `<div class="note">후기를 불러오는 중이에요…</div>` : cards ? `<div class="rv-cards">${cards}</div>` : `<div class="note">아직 후기가 없어요. 영화를 보고 첫 리뷰를 남겨 보세요.</div>`);
    }
    if (kind === 'movies-perks') {
      const rank = { now: 0, soon: 1, past: 2 };
      const items = all.map(m => { const list = perksOf(m).map(p => perkInfo(m, p)); const best = list.reduce((b, x) => Math.min(b, rank[x.status]), 3); return { m, best }; })
        .filter(x => x.best < 3).sort((a, b) => a.best - b.best);
      const rows = items.map(({ m }) => `<div class="perk-movie"><a class="pm-poster" href="#movie-${m.id}">${frame(m, 'poster', 1)}</a>
          <div class="pm-body"><a href="#movie-${m.id}"><h3>${esc(m.title)}</h3></a>${perkRowHTML(m)}</div></div>`).join('');
      return listIntro('특전', '극장 특전을 영화별로 모았어요. 지금 증정 중인 특전이 위에, 끝난 특전은 아래에 흐리게 보여요. 대부분 선착순이라 일찍 끝날 수 있어요.', items.length) + subNav(kind) + `<div class="list-gap"></div>` +
        (rows || `<div class="note">특전 정보가 없어요.</div>`);
    }
    return pageMovies();
  }
  function pageAll() {
    return `<section id="sec-movies">${pageMovies()}</section><section id="sec-concerts" class="sec-concerts">${pageConcerts()}</section>`;
  }
  // fromData: 데이터가 바뀌어 다시 그릴 때(입력 중인 폼은 건드리지 않음)
  function render(fromData) {
    const r = currentRoute();
    $('view-home').hidden = true;
    $('inner').hidden = false;
    document.body.classList.toggle('is-home', r.view === 'home');
    const tab = r.view === 'concert' || r.view === 'venue' || r.kind === 'concerts' || r.kind === 'venues' ? 'concerts' : r.view === 'home' ? '' : 'movies';
    document.querySelectorAll('header.top nav a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const page = $('page');
    if (r.view === 'home') page.innerHTML = pageHome();
    else if (r.view === 'list') {
      page.innerHTML = pageList(r.kind, r);
      fillNames([...new Set([...page.querySelectorAll('[data-name]')].map(e => e.dataset.name))]);
    }
    else if (r.view === 'venue') {
      if (fromData && $('venue-form')) { renderVenueLive(); return; }
      if (vs.id !== r.id) Object.assign(vs, { id: r.id, fl: '', sec: '', sort: 'new', open: null, cmText: '', confirmDel: null, msg: '', err: false, f: blankSeatForm() });
      page.innerHTML = pageVenue(VENUES.find(x => x.id === r.id));
      renderSeatForm(); renderVenueLive();
    }
    else if (r.view === 'concert') page.innerHTML = pageConcert(CONCERTS.find(x => x.id === r.id));
    else if (r.view === 'movie' || r.view === 'reviews') {
      if (fromData && r.view === 'reviews' && document.activeElement?.id === 'rv-text') return;
      const m = findMovie(r.id);
      if (!m) { page.innerHTML = `<div class="intro"><h1>영화</h1><p>${movieState === 'loading' ? '영화 정보를 불러오는 중이에요…' : '이 영화를 찾을 수 없어요. 삭제되었을 수 있어요.'}</p></div><a class="link muted" href="#movies">← 영화 목록</a>`; return; }
      if (form.filmId !== m.id) Object.assign(form, { filmId: m.id, rating: 0, verdict: '', title: '', text: '', editing: false, msg: '', err: false, confirmDel: null, filter: 'all', sort: 'new', open: null, cmOpen: null, cmText: '', cmMsg: '', cmConfirm: null });
      if (r.view === 'movie') { page.innerHTML = pageMovie(m); renderSummary(); renderHype(); }
      else { page.innerHTML = pageReviews(m); renderReviews(); }
    }
    else if (r.view === 'editor') {
      if (fromData && $('movie-form')) return;
      if (movieState === 'loading') { page.innerHTML = `<div class="intro"><h1>영화</h1><p>불러오는 중이에요…</p></div>`; return; }
      if (!isAdmin) { page.innerHTML = `<div class="intro"><h1>영화 등록</h1><p>영화 등록과 수정은 페이지 주인과 편집자만 할 수 있어요.</p></div><a class="link muted" href="#movies">← 영화 목록</a>`; return; }
      const m = r.id ? registered.find(x => x.id === r.id) : null;
      if (r.id && !m) { page.innerHTML = `<div class="intro"><h1>영화 수정</h1><p>이 영화를 찾을 수 없어요.</p></div><a class="link muted" href="#movies">← 영화 목록</a>`; return; }
      if (ed.id !== (r.id || null)) resetEditor();
      ed.id = r.id || null;
      page.innerHTML = pageEditor(m);
    }
  }
  window.addEventListener('hashchange', () => {
    started = true; confirmDelMovie = null; closeFly(true); render();
    const r = currentRoute();
    const sec = r.view === 'all' && r.focus ? $(FOCUS[r.focus]) : null;
    if (sec) sec.scrollIntoView(); else window.scrollTo(0, 0);
  });

  // 접속하면 항상 첫 화면(영화 + 콘서트)의 맨 위부터 보여 줌
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch {} }
  render();
  initStore();
})();
