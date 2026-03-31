// ── 이미지 경로 매핑 ──
const IMAGE_MAP = {
  'contrast-ratio.svg': 'images/contrast-ratio.svg',
  'required-field.svg': 'images/required-field.svg',
  'color-only.svg':     'images/color-only.svg',
  'text-resize.svg':    'images/text-resize.svg',
  'touch-target.svg':   'images/touch-target.svg',
  'focus-visible.svg':  'images/focus-visible.svg',
  'focus-order.svg':    'images/focus-order.svg',
  'chart-legend.svg':   'images/chart-legend.svg',
  'chart-table.svg':    'images/chart-table.svg',
  'placeholder.svg':    'images/placeholder.svg',
  'alt-text.svg':       'images/alt-text.svg'
};

// FAQ 답변 내 이미지 경로 변환
function parseAnswer(html) {
  return html
    .replace(
      /<div class="ap-faq__img-wrap"><img src="images\/faq\/([^"]+)" alt="([^"]*)">/g,
      (_, file, alt) => {
        const src = IMAGE_MAP[file];
        return src
          ? `<div class="ti"><img src="${src}" alt="${alt}" loading="lazy"></div>`
          : '';
      }
    )
    .replace(/<\/div>(?=<strong|<br|[^<])/g, '');
}

// ── 데이터 로드 후 초기화 ──
Promise.all([
  fetch('faq.json').then(r => r.json()),
  fetch('quiz.json').then(r => r.json())
]).then(([faqData, quizData]) => {
  updateCounts(faqData.length, quizData.length);
  renderGuide(faqData);
  renderQuiz(quizData);
  initTabs();
});

// ── 카운트 동적 업데이트 ──
function updateCounts(faqCount, quizCount) {
  document.getElementById('heroFaqCount').textContent = faqCount;
  document.getElementById('heroQuizCount').textContent = quizCount;
  document.getElementById('tabFaqCount').textContent = faqCount;
  document.getElementById('tabQuizCount').textContent = quizCount;
  document.getElementById('sectionFaqCount').textContent = faqCount;
  document.getElementById('sectionQuizCount').textContent = quizCount;
  document.getElementById('si').textContent = `0 / ${quizCount}`;
}

// ── 가이드 렌더링 ──
function renderGuide(data) {
  const list = document.getElementById('thList');

  data.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'th';

    const tags = item.tags.map(t => `<span class="tag">${t}</span>`).join('');
    const num = String(i + 1).padStart(2, '0');

    card.innerHTML = `
      <button class="th-btn" aria-expanded="false" aria-controls="tb${i}">
        <span class="th-n">${num}</span>
        <span class="th-q">${item.q}</span>
        <span class="th-tags">${tags}</span>
        <span class="th-icon">+</span>
      </button>
      <div class="th-body" id="tb${i}" role="region">
        <div class="th-con">${parseAnswer(item.a)}</div>
      </div>`;

    list.appendChild(card);

    // 개별 아코디언 토글
    card.querySelector('.th-btn').addEventListener('click', () => {
      const isOpen = card.hasAttribute('open');

      if (isOpen) {
        card.removeAttribute('open');
        card.querySelector('.th-btn').setAttribute('aria-expanded', 'false');
      } else {
        card.setAttribute('open', '');
        card.querySelector('.th-btn').setAttribute('aria-expanded', 'true');
      }

      syncToggleAll();
    });
  });

  // 모두 펼치기/접기
  const toggleBtn = document.getElementById('toggleAll');
  toggleBtn.addEventListener('click', () => {
    const cards = document.querySelectorAll('.th');
    const allOpen = [...cards].every(c => c.hasAttribute('open'));

    cards.forEach(c => {
      if (allOpen) {
        c.removeAttribute('open');
        c.querySelector('.th-btn').setAttribute('aria-expanded', 'false');
      } else {
        c.setAttribute('open', '');
        c.querySelector('.th-btn').setAttribute('aria-expanded', 'true');
      }
    });

    toggleBtn.textContent = allOpen ? '모두 펼치기' : '모두 접기';
    toggleBtn.setAttribute('aria-expanded', String(!allOpen));
  });
}

// 토글 버튼 텍스트 동기화
function syncToggleAll() {
  const cards = document.querySelectorAll('.th');
  const allOpen = [...cards].every(c => c.hasAttribute('open'));
  const btn = document.getElementById('toggleAll');
  btn.textContent = allOpen ? '모두 접기' : '모두 펼치기';
  btn.setAttribute('aria-expanded', String(allOpen));
}

// ── 퀴즈 렌더링 ──
function renderQuiz(data) {
  const container = document.getElementById('qx');
  const labels = ['A', 'B', 'C', 'D'];
  let answered = 0;
  let correct = 0;
  const total = data.length;

  data.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'qc';

    // 선택지 생성
    let options = '';
    if (q.type === 'ox') {
      options = `
        <div class="ow">
          <button class="ob" data-v="true">⭕ 맞다</button>
          <button class="ob" data-v="false">❌ 아니다</button>
        </div>`;
    } else {
      options = `
        <div class="cl">
          ${q.choices.map((ch, ci) => `
            <button class="cb" data-i="${ci}">
              <span class="om">${labels[ci]}</span>
              <span>${ch}</span>
            </button>`).join('')}
        </div>`;
    }

    const num = String(i + 1).padStart(2, '0');
    card.innerHTML = `
      <div class="qm">
        <span class="qn">${num}</span>
        <span class="qm-title">${q.question}</span>
        <span class="qm-tags">
          <span class="tag">SC ${q.sc}</span>
          <span class="qt">${q.type === 'ox' ? 'O/X' : 'CHOICE'}</span>
          <span class="tag">${q.level}</span>
        </span>
      </div>
      ${options}
      <div class="ex">${q.explanation}</div>`;

    container.appendChild(card);

    // 정답 처리
    if (q.type === 'ox') {
      card.querySelectorAll('.ob').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          card.querySelectorAll('.ob').forEach(b => b.disabled = true);
          answered++;

          const userAnswer = btn.dataset.v === 'true';
          if (userAnswer === q.answer) {
            btn.classList.add('ok');
            correct++;
          } else {
            btn.classList.add('no');
            card.querySelectorAll('.ob').forEach(b => {
              if ((b.dataset.v === 'true') === q.answer) b.classList.add('ok');
            });
          }

          card.querySelector('.ex').classList.add('vis');
          updateProgress(answered, correct, total);
        });
      });
    } else {
      card.querySelectorAll('.cb').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const allBtns = card.querySelectorAll('.cb');
          allBtns.forEach(b => b.disabled = true);
          answered++;

          const idx = parseInt(btn.dataset.i);
          if (idx === q.answer) {
            btn.classList.add('ok');
            correct++;
          } else {
            btn.classList.add('no');
            allBtns[q.answer].classList.add('ok');
          }

          card.querySelector('.ex').classList.add('vis');
          updateProgress(answered, correct, total);
        });
      });
    }
  });

  // 진행률 업데이트
  function updateProgress(ans, cor, tot) {
    document.getElementById('pf').style.width = (ans / tot * 100) + '%';
    document.getElementById('si').textContent = `${cor} / ${ans} 정답`;

    if (ans === tot) {
      setTimeout(() => {
        const result = document.getElementById('rc');
        const pct = Math.round(cor / tot * 100);

        result.classList.add('vis');
        document.getElementById('rp').textContent = pct + '점';
        document.getElementById('rdl').textContent = `${tot}문제 중 ${cor}문제 정답`;

        let emoji, msg;
        if (pct >= 90)      { emoji = '🏆'; msg = '접근성 마스터 디자이너!'; }
        else if (pct >= 70)  { emoji = '👏'; msg = '조금만 더 공부하면 완벽!'; }
        else if (pct >= 50)  { emoji = '📚'; msg = '가이드 탭에서 복습!'; }
        else                 { emoji = '💪'; msg = '가이드부터 차근차근!'; }

        document.getElementById('re').textContent = emoji;
        document.getElementById('rmg').textContent = msg;
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }

  // 다시 풀기
  document.getElementById('rbtn').addEventListener('click', () => {
    answered = 0;
    correct = 0;
    document.getElementById('pf').style.width = '0%';
    document.getElementById('si').textContent = `0 / ${total}`;
    document.getElementById('rc').classList.remove('vis');

    document.querySelectorAll('.qc').forEach(card => {
      card.querySelectorAll('.ob, .cb').forEach(b => {
        b.disabled = false;
        b.classList.remove('ok', 'no');
      });
      card.querySelector('.ex').classList.remove('vis');
    });

    document.getElementById('p2').scrollIntoView({ behavior: 'smooth' });
  });
}

// ── 탭 전환 ──
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      panels.forEach(p => p.classList.remove('on'));

      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      document.getElementById(tab.getAttribute('aria-controls')).classList.add('on');
    });

    tab.addEventListener('keydown', e => {
      const idx = [...tabs].indexOf(tab);
      let next;

      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      if (e.key === 'ArrowLeft')  next = tabs[(idx - 1 + tabs.length) % tabs.length];

      if (next) {
        e.preventDefault();
        next.focus();
        next.click();
      }
    });
  });
}

// ── Top 버튼 ──
const topBtn = document.getElementById('topBtn');

window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    topBtn.classList.add('show');
  } else {
    topBtn.classList.remove('show');
  }
});

topBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
