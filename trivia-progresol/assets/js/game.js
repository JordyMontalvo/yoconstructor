/* ========================================
   Trivia Progresol — Game Logic
   Vanilla JS, 100% offline (file://)
   Cambios luis: feedback Paper v4, feedback_incorrecto, delays (#2 #3)
   ======================================== */

const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 15;
const FEEDBACK_DELAY = 2500;
const FEEDBACK_DELAY_INCORRECT = 5500;
const EDUCATIVO_DELAY = 1000;
const INACTIVITY_TIMEOUT = 120000;

const TIERS = {
  constructor: { min: 0, max: 2, label: 'CONSTRUCTOR', emoji: '🔧', badgeClass: 'badge--constructor', message: '¡Vas por buen camino! Sigue sumando conocimiento sobre construcción. Progresol es tu aliado.' },
  maestro: { min: 3, max: 5, label: 'MAESTRO CONSTRUCTOR', emoji: '🏆', badgeClass: 'badge--maestro', message: '¡Eres un experto! Construir es tu pasión y Progresol tu mejor herramienta.' },
};

/** Barajar índices 0..count-1 (nuevo array). */
function _shuffleIndices(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TRIVIA_POOL_STORAGE_VERSION = '2';

(function _migrateTriviaPoolStorage() {
  try {
    const v = localStorage.getItem('trivia_pool_version');
    if (v !== TRIVIA_POOL_STORAGE_VERSION) {
      localStorage.removeItem('trivia_pool');
      localStorage.removeItem('trivia_asked_cycle');
      localStorage.setItem('trivia_pool_version', TRIVIA_POOL_STORAGE_VERSION);
    }
  } catch (e) {
    /* ignore */
  }
})();

function _persistTriviaPoolState() {
  try {
    localStorage.setItem('trivia_pool', JSON.stringify(_pool));
    localStorage.setItem('trivia_asked_cycle', JSON.stringify([..._askedThisCycle]));
  } catch (e) {
    /* ignore */
  }
}

let _pool = (() => {
  try {
    const saved = localStorage.getItem('trivia_pool');
    if (saved) {
      const p = JSON.parse(saved);
      if (Array.isArray(p)) return p;
    }
  } catch (e) {}
  return [];
})();

/** Índices ya mostrados en las partidas 1–4 del ciclo actual (para 3 repeticiones en la 5.ª con 22 preguntas). */
let _askedThisCycle = (() => {
  try {
    const saved = localStorage.getItem('trivia_asked_cycle');
    if (saved) {
      const a = JSON.parse(saved);
      if (Array.isArray(a)) return new Set(a);
    }
  } catch (e) {}
  return new Set();
})();

const game = {
  questions: [],
  currentQuestions: [],
  currentIndex: 0,
  score: 0,
  timer: null,
  timeLeft: 0,
  inactivityTimer: null,
  resultTimer: null,
  finalTimer: null,
  educativoTimer: null,
  nextQuestionTimer: null,
  confettiRaf: null,
  answered: false,
  _inactivityListenersAttached: false,
  tapAudio: null,

  playTap() {
    try {
      const a = this.tapAudio;
      if (!a) return;
      a.currentTime = 0;
      void a.play().catch(() => {});
    } catch (e) {
      /* ignore */
    }
  },

  async init() {
    try {
      let data;
      if (typeof window.TRIVIA_DATA !== 'undefined' && window.TRIVIA_DATA && window.TRIVIA_DATA.preguntas) {
        data = window.TRIVIA_DATA;
      } else {
        const res = await fetch('data/data.json');
        if (!res.ok) throw new Error('fetch');
        data = await res.json();
      }
      if (!data || !Array.isArray(data.preguntas) || data.preguntas.length === 0) {
        throw new Error('data');
      }
      this.questions = data.preguntas;
      this.tapAudio = new Audio('assets/sounds/tap-button.mp3');
      this.tapAudio.preload = 'auto';
    } catch (e) {
      this.questions = [];
      const errEl = document.getElementById('init-error');
      if (errEl) {
        errEl.textContent = 'No se pudo cargar la trivia. Reinicia el tótem o avisa a soporte.';
        errEl.hidden = false;
      }
      const startBtn = document.querySelector('#screen-portada .btn-cta');
      if (startBtn) startBtn.disabled = true;
      return;
    }
    this._attachInactivityListeners();
    this.resetInactivity();
  },

  _attachInactivityListeners() {
    if (this._inactivityListenersAttached) return;
    this._inactivityListenersAttached = true;
    this._onUserInteraction = () => this.resetInactivity();
    document.addEventListener('touchstart', this._onUserInteraction, { passive: true });
    document.addEventListener('click', this._onUserInteraction);
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  start() {
    this.playTap();
    this.showScreen('screen-instrucciones');
  },

  /** COMENZAR (desde instrucciones): con sonido. `showQuestion()` interno no. */
  comenzar() {
    this.playTap();
    this.showQuestion();
  },

  /** VOLVER A JUGAR: con sonido; `reset()` solo para timers/inactividad. */
  goToPortada() {
    this.playTap();
    this.reset();
  },

  showQuestion() {
    if (this.currentIndex === 0) {
      const bank = this.questions;
      const N = bank.length;
      if (N < TOTAL_QUESTIONS) {
        this.currentQuestions = bank.slice(0, TOTAL_QUESTIONS);
        this.score = 0;
      } else {
        /*
         * Ciclo (p. ej. 22 preguntas): 4 partidas × 5 = 20 distintas; la 5.ª usa las (N−20) restantes
         * del mazo + repeticiones tomadas solo de lo ya visto (con 22 son 2 + 3 repeticiones).
         */
        if (_pool.length === 0) {
          if (_askedThisCycle.size >= N) {
            _askedThisCycle.clear();
          }
          _pool = _shuffleIndices(N);
        }

        const indices = [];

        if (_pool.length >= TOTAL_QUESTIONS) {
          for (let k = 0; k < TOTAL_QUESTIONS; k++) {
            const idx = _pool.shift();
            indices.push(idx);
            _askedThisCycle.add(idx);
          }
        } else {
          const askedSnapshot = new Set(_askedThisCycle);
          while (_pool.length) {
            indices.push(_pool.shift());
          }
          let need = TOTAL_QUESTIONS - indices.length;
          const taken = new Set(indices);
          const repeatSource = game.shuffle([...askedSnapshot]);
          for (let r = 0; r < repeatSource.length && need > 0; r++) {
            const idx = repeatSource[r];
            if (!taken.has(idx)) {
              indices.push(idx);
              taken.add(idx);
              need--;
            }
          }
          while (need > 0) {
            const fallback = [...askedSnapshot].find((ix) => !taken.has(ix));
            if (fallback === undefined) break;
            indices.push(fallback);
            taken.add(fallback);
            need--;
          }
          for (const ix of indices) {
            _askedThisCycle.add(ix);
          }
        }

        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        this.currentQuestions = indices.map((ix) => bank[ix]);
        _persistTriviaPoolState();
        this.score = 0;
      }
    }
    this.answered = false;
    this.renderProgress();
    this.renderQuestion();
    this.hideFeedback();
    this.startTimer();
    this.showScreen('screen-pregunta');
  },

  renderProgress() {
    const container = document.getElementById('progress-segments');
    container.innerHTML = '';
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const seg = document.createElement('div');
      seg.className = 'progress-segment' + (i < this.currentIndex + 1 ? ' filled' : '');
      container.appendChild(seg);
    }
    document.getElementById('progress-text').textContent = `${this.currentIndex + 1} de ${TOTAL_QUESTIONS}`;
  },

  renderQuestion() {
    const q = this.currentQuestions[this.currentIndex];
    document.getElementById('question-text').textContent = q.pregunta;

    const container = document.getElementById('options-container');
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    q.opciones.forEach((opcion, i) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.index = i;
      card.innerHTML = `
        <div class="option-letter">
          <span class="t-option-letter">${letters[i]}</span>
        </div>
        <span class="t-option">${opcion}</span>
      `;
      card.addEventListener('click', () => this.answer(i));
      container.appendChild(card);
    });
  },

  startTimer() {
    this.timeLeft = TIME_PER_QUESTION;
    const timerEl = document.getElementById('timer');
    const textEl = document.getElementById('timer-text');
    const fillEl = document.getElementById('timer-fill');

    timerEl.classList.remove('stopped');
    fillEl.classList.remove('warning');
    textEl.textContent = this.timeLeft;
    fillEl.style.width = '100%';

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.timeLeft <= 1) {
        clearInterval(this.timer);
        fillEl.style.width = '0%';
        fillEl.classList.add('warning');
        this.answer(-1);
        return;
      }
      this.timeLeft--;
      textEl.textContent = this.timeLeft;
      fillEl.style.width = `${(this.timeLeft / TIME_PER_QUESTION) * 100}%`;

      if (this.timeLeft <= 5) {
        fillEl.classList.add('warning');
      }
    }, 1000);
  },

  stopTimer() {
    clearInterval(this.timer);
    document.getElementById('timer').classList.add('stopped');
  },

  answer(selectedIndex) {
    if (this.answered) return;
    if (selectedIndex >= 0) this.playTap();
    this.answered = true;
    this.stopTimer();

    const q = this.currentQuestions[this.currentIndex];
    const correctIndex = q.respuesta_correcta;
    const isCorrect = selectedIndex === correctIndex;

    if (isCorrect) {
      this.score++;
      this.triggerConfetti();
    }

    const cards = document.querySelectorAll('.option-card');
    cards.forEach((card, i) => {
      card.style.pointerEvents = 'none';
      if (i === correctIndex) {
        card.classList.add('correct');
      } else if (i === selectedIndex && !isCorrect) {
        card.classList.add('incorrect');
      } else {
        card.classList.add('dimmed');
      }
    });

    this.showFeedback(isCorrect);

    const delay = isCorrect ? FEEDBACK_DELAY : FEEDBACK_DELAY_INCORRECT;
    clearTimeout(this.nextQuestionTimer);
    this.nextQuestionTimer = setTimeout(() => {
      this.nextQuestionTimer = null;
      this.currentIndex++;
      if (this.currentIndex >= TOTAL_QUESTIONS) {
        this.showResult();
      } else {
        this.showQuestion();
      }
    }, delay);
  },

  showFeedback(isCorrect) {
    const area = document.getElementById('feedback-area');

    if (isCorrect) {
      area.innerHTML = `
        <div class="feedback-content">
          <svg width="120" height="146" viewBox="0 0 200 244" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M162.047 144.684H120.614V0H162.047V144.684Z" fill="#14FF46"/>
            <path d="M79.25 144.684H37.817V0H79.25V144.684Z" fill="#14FF46"/>
            <path d="M99.933 243.912C69.046 243.912 38.161 232.168 14.65 208.676L0 194.042L29.298 164.772L43.946 179.408C74.818 210.248 125.046 210.248 155.919 179.408L170.568 164.772L199.864 194.042L185.216 208.676C161.703 232.168 130.818 243.912 99.933 243.912Z" fill="#14FF46"/>
          </svg>
          <span class="t-feedback t-feedback--correct">¡Correcto!</span>
        </div>
      `;
    } else {
      area.innerHTML = `
        <div class="feedback-content">
          <div class="feedback-icon feedback-icon--incorrect">
            <svg width="56" height="56" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 9L27 27M27 9L9 27" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="t-feedback t-feedback--incorrect">Incorrecto</span>
        </div>
      `;
      const q = this.currentQuestions[this.currentIndex];
      const fi = q.feedback_incorrecto || { hook: 'Repasemos este tema.', explicacion: '' };
      this.educativoTimer = setTimeout(() => {
        const correctText = q.opciones[q.respuesta_correcta] || '';
        const correctLine = escapeHtml(withClosingPeriod(correctText));
        const exp = fi.explicacion != null && String(fi.explicacion).trim()
          ? `<p class="t-educativo t-educativo--muted">${escapeHtml(fi.explicacion)}</p>`
          : '';
        area.innerHTML = `
          <div class="educativo-box">
            <p class="t-educativo">${escapeHtml(fi.hook)}</p>
            <p class="t-educativo">\u{1F449} La respuesta correcta es:\n${correctLine}</p>
            ${exp}
          </div>
        `;
      }, EDUCATIVO_DELAY);
    }
  },

  hideFeedback() {
    clearTimeout(this.educativoTimer);
    const area = document.getElementById('feedback-area');
    area.innerHTML = '';
  },

  showResult() {
    const tier = Object.values(TIERS).find(t => this.score >= t.min && this.score <= t.max);

    document.getElementById('result-score').textContent = `${this.score}/${TOTAL_QUESTIONS}`;
    document.getElementById('result-score').style.color = tier === TIERS.maestro ? 'var(--accent-primary)' : 'var(--fg-primary)';
    document.getElementById('result-tier').textContent = tier.label;
    document.getElementById('result-emoji').textContent = tier.emoji;
    document.getElementById('result-message').textContent = tier.message;

    const badge = document.getElementById('result-badge');
    badge.className = 'badge ' + tier.badgeClass;

    const icon = document.getElementById('result-icon');
    icon.className = 'lottie-placeholder';
    if (tier === TIERS.constructor) icon.classList.add('lottie-placeholder--green-subtle');
    else icon.classList.add('lottie-placeholder--green');

    this.showScreen('screen-resultado');
    clearTimeout(this.resultTimer);
    clearTimeout(this.finalTimer);
    this.resultTimer = setTimeout(() => {
      this.showScreen('screen-final');
      this.finalTimer = setTimeout(() => this.reset(), 5000);
    }, 5000);
  },

  reset() {
    clearTimeout(this.resultTimer);
    clearTimeout(this.finalTimer);
    clearTimeout(this.educativoTimer);
    clearTimeout(this.nextQuestionTimer);
    this.nextQuestionTimer = null;
    if (this.confettiRaf != null) {
      cancelAnimationFrame(this.confettiRaf);
      this.confettiRaf = null;
    }
    const cc = document.getElementById('confetti-canvas');
    if (cc) {
      cc.style.display = 'none';
      const ctx = cc.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, cc.width || 1080, cc.height || 1920);
    }
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    clearInterval(this.timer);
    this.showScreen('screen-portada');
  },

  triggerConfetti() {
    if (this.confettiRaf != null) {
      cancelAnimationFrame(this.confettiRaf);
      this.confettiRaf = null;
    }
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1920;
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'block';

    const colors = ['#14FF46', '#FFB300', '#FFFFFF', '#FF3B3B', '#00C853'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * -300 - 50,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: Math.random() * 12 + 6,
      h: Math.random() * 8 + 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
    }));

    const end = performance.now() + 2200;
    const self = this;
    const draw = (now) => {
      if (now > end) {
        ctx.clearRect(0, 0, W, H);
        canvas.style.display = 'none';
        self.confettiRaf = null;
        return;
      }
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      self.confettiRaf = requestAnimationFrame(draw);
    };
    this.confettiRaf = requestAnimationFrame(draw);
  },

  resetInactivity() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.reset();
    }, INACTIVITY_TIMEOUT);
  },
};

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Punto final en la línea de la respuesta correcta si el texto no termina ya en puntuación. */
function withClosingPeriod(text) {
  const t = String(text ?? '').trim();
  if (!t) return '';
  if (/[.!?…]$/u.test(t)) return t;
  return `${t}.`;
}

function setupKioskViewport() {
  const inner = document.getElementById('viewport-inner');
  const stage = document.getElementById('kiosk-stage');
  if (!inner || !stage) return;

  const W = 1080;
  const H = 1920;

  const resize = () => {
    const vv = window.visualViewport;
    const vw = document.documentElement.clientWidth;
    const vh = (vv && vv.height) ? vv.height : window.innerHeight;
    const s = Math.min(vw / W, vh / H);
    inner.style.width = `${W * s}px`;
    inner.style.height = `${H * s}px`;
    stage.style.transform = `scale(${s})`;
  };

  resize();
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
}

setupKioskViewport();
game.init();
