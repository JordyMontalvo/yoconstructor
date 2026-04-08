/* ========================================
   Trivia Progresol — Game Logic
   Vanilla JS, 100% offline
   ======================================== */

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 15;
const FEEDBACK_DELAY = 2500;
const INACTIVITY_TIMEOUT = 120000;

const TIERS = {
  aprendiz:    { min: 0, max: 3, label: 'APRENDIZ',           emoji: '📖', badgeClass: 'badge--aprendiz',    message: 'Tienes mucho por descubrir sobre construcción. ¡Progresol te acompaña en el camino!' },
  constructor: { min: 4, max: 7, label: 'CONSTRUCTOR',         emoji: '🔧', badgeClass: 'badge--constructor',  message: '¡Vas por buen camino! Ya sabes bastante de construcción. Progresol es tu aliado.' },
  maestro:     { min: 8, max: 10, label: 'MAESTRO CONSTRUCTOR', emoji: '🏆', badgeClass: 'badge--maestro',     message: '¡Eres un experto! Construir es tu pasión y Progresol tu mejor herramienta.' },
};

const game = {
  questions: [],
  currentQuestions: [],
  currentIndex: 0,
  score: 0,
  timer: null,
  timeLeft: 0,
  inactivityTimer: null,
  answered: false,

  async init() {
    const res = await fetch('data.json');
    const data = await res.json();
    this.questions = data.preguntas;
    this.resetInactivity();
    document.addEventListener('touchstart', () => this.resetInactivity(), { passive: true });
    document.addEventListener('click', () => this.resetInactivity());
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
      this.currentQuestions = this.shuffle(this.questions).slice(0, TOTAL_QUESTIONS);
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
      this.timeLeft--;
      textEl.textContent = this.timeLeft;
      fillEl.style.width = `${(this.timeLeft / TIME_PER_QUESTION) * 100}%`;

      if (this.timeLeft <= 5) {
        fillEl.classList.add('warning');
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.answer(-1); // timeout
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

    if (isCorrect) this.score++;

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

    // Next question after delay
    setTimeout(() => {
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
    if (tier === TIERS.aprendiz) icon.classList.add('lottie-placeholder--dark');
    else if (tier === TIERS.constructor) icon.classList.add('lottie-placeholder--green-subtle');
    else icon.classList.add('lottie-placeholder--green');

    this.showScreen('screen-resultado');
  },

  // --- Reset ---
  reset() {
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    clearInterval(this.timer);
    this.showScreen('screen-portada');
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
