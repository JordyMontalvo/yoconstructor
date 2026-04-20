/* ========================================
   Trivia Progresol — Game Logic
   Vanilla JS, 100% offline
   ======================================== */

const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 15;
const FEEDBACK_DELAY = 2500;
const INACTIVITY_TIMEOUT = 120000;

const TIERS = {
  constructor: { min: 0, max: 2, label: 'CONSTRUCTOR', emoji: '🔧', badgeClass: 'badge--constructor', message: '¡Vas por buen camino! Sigue sumando conocimiento sobre construcción. Progresol es tu aliado.' },
  maestro: { min: 3, max: 5, label: 'MAESTRO CONSTRUCTOR', emoji: '🏆', badgeClass: 'badge--maestro', message: '¡Eres un experto! Construir es tu pasión y Progresol tu mejor herramienta.' },
};

// Pool aleatorio: garantiza que todas las preguntas aparezcan antes de repetirse
function _shuffleIndices(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let _pool = (() => {
  try {
    const saved = localStorage.getItem('trivia_pool');
    if (saved) {
      const p = JSON.parse(saved);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch (e) {}
  return [];
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
  nextQuestionTimer: null,
  confettiRaf: null,
  answered: false,
  _inactivityListenersAttached: false,

  async init() {
    try {
      const res = await fetch('data.json');
      if (!res.ok) throw new Error('fetch');
      const data = await res.json();
      if (!data || !Array.isArray(data.preguntas) || data.preguntas.length === 0) throw new Error('data');
      this.questions = data.preguntas;
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

  // --- Fisher-Yates shuffle ---
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // --- Screen transitions ---
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  // --- Start game ---
  start() {
    this.showScreen('screen-instrucciones');
  },

  // --- Begin questions ---
  showQuestion() {
    if (this.currentIndex === 0) {
      const bank = this.questions;
      if (_pool.length === 0) _pool = _shuffleIndices(bank.length);
      const selected = [];
      const usedInRound = new Set();
      while (selected.length < TOTAL_QUESTIONS) {
        if (_pool.length === 0) _pool = _shuffleIndices(bank.length);
        let idx = _pool.shift();
        let guard = 0;
        const maxGuard = Math.max(bank.length * 3, TOTAL_QUESTIONS * 4);
        while (usedInRound.has(idx) && guard < maxGuard) {
          if (_pool.length === 0) _pool = _shuffleIndices(bank.length);
          idx = _pool.shift();
          guard++;
        }
        if (usedInRound.has(idx)) {
          for (let i = 0; i < bank.length; i++) {
            if (!usedInRound.has(i)) {
              idx = i;
              break;
            }
          }
        }
        usedInRound.add(idx);
        selected.push(bank[idx]);
      }
      try { localStorage.setItem('trivia_pool', JSON.stringify(_pool)); } catch (e) {}
      this.currentQuestions = selected;
      this.score = 0;
    }
    this.answered = false;
    this.renderProgress();
    this.renderQuestion();
    this.hideFeedback();
    this.startTimer();
    this.showScreen('screen-pregunta');
  },

  // --- Render progress bar ---
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

  // --- Render question + options ---
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

  // --- Timer ---
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

  // --- Answer ---
  answer(selectedIndex) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();

    const q = this.currentQuestions[this.currentIndex];
    const correctIndex = q.respuesta_correcta;
    const isCorrect = selectedIndex === correctIndex;

    if (isCorrect) {
      this.score++;
      this.triggerConfetti();
    }

    // Update option cards
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

    // Show feedback
    this.showFeedback(isCorrect);

    clearTimeout(this.nextQuestionTimer);
    this.nextQuestionTimer = setTimeout(() => {
      this.nextQuestionTimer = null;
      this.currentIndex++;
      if (this.currentIndex >= TOTAL_QUESTIONS) {
        this.showResult();
      } else {
        this.showQuestion();
      }
    }, FEEDBACK_DELAY);
  },

  // --- Feedback ---
  showFeedback(isCorrect) {
    const block = document.getElementById('feedback-block');
    block.style.display = 'flex';

    if (isCorrect) {
      block.innerHTML = `
        <div class="feedback-icon feedback-icon--correct">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        </div>
        <span class="t-feedback t-feedback--correct">¡Correcto!</span>
      `;
    } else {
      block.innerHTML = `
        <div class="feedback-icon feedback-icon--incorrect">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
        </div>
        <span class="t-feedback t-feedback--incorrect">Incorrecto</span>
        <span class="t-feedback-hint">La respuesta correcta es:</span>
      `;
    }
  },

  hideFeedback() {
    const block = document.getElementById('feedback-block');
    block.style.display = 'none';
    block.innerHTML = '';
  },

  // --- Result ---
  showResult() {
    const tier = Object.values(TIERS).find(t => this.score >= t.min && this.score <= t.max);

    document.getElementById('result-score').textContent = `${this.score}/${TOTAL_QUESTIONS}`;
    document.getElementById('result-score').style.color = tier === TIERS.maestro ? 'var(--accent-primary)' : 'var(--fg-primary)';
    document.getElementById('result-tier').textContent = tier.label;
    document.getElementById('result-emoji').textContent = tier.emoji;
    document.getElementById('result-message').textContent = tier.message;

    // Badge style
    const badge = document.getElementById('result-badge');
    badge.className = 'badge ' + tier.badgeClass;

    // Icon style
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

  // --- Reset ---
  reset() {
    clearTimeout(this.resultTimer);
    clearTimeout(this.finalTimer);
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

  // --- Confetti ---
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

  // --- Inactivity ---
  resetInactivity() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.reset();
    }, INACTIVITY_TIMEOUT);
  },
};

// Boot
game.init();
