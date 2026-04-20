import { useState, useEffect, useCallback, useRef } from 'react'
import Portada from './components/Portada'
import Instrucciones from './components/Instrucciones'
import Pregunta from './components/Pregunta'
import Resultado from './components/Resultado'
import Final from './components/Final'


const TOTAL_QUESTIONS = 5
const TIME_PER_QUESTION = 15
const FEEDBACK_DELAY = 2500
const INACTIVITY_TIMEOUT = 120000

// Pool aleatorio: garantiza que todas las preguntas aparezcan antes de repetirse
function _shuffleIndices(count) {
  const arr = Array.from({ length: count }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

let _pool = (() => {
  try {
    const saved = localStorage.getItem('trivia_pool')
    if (saved) {
      const p = JSON.parse(saved)
      if (Array.isArray(p) && p.length > 0) return p
    }
  } catch {
    /* localStorage o JSON inválido: se usa pool vacío */
  }
  return []
})()

export default function App() {
  const [screen, setScreen] = useState('portada')
  const [questions, setQuestions] = useState([])
  const [gameQuestions, setGameQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const inactivityRef = useRef(null)

  // Load questions
  useEffect(() => {
    fetch('./data.json')
      .then(r => r.json())
      .then(d => setQuestions(d.preguntas))
  }, [])

  // Inactivity reset
  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => {
      setScreen('portada')
      setCurrentIndex(0)
      setScore(0)
    }, INACTIVITY_TIMEOUT)
  }, [])

  useEffect(() => {
    const handler = () => resetInactivity()
    document.addEventListener('touchstart', handler, { passive: true })
    document.addEventListener('click', handler)
    resetInactivity()
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('click', handler)
      clearTimeout(inactivityRef.current)
    }
  }, [resetInactivity])

  const resetGame = useCallback(() => {
    setCurrentIndex(0)
    setScore(0)
    setScreen('portada')
  }, [])

  useEffect(() => {
    if (screen === 'final') {
      const t = setTimeout(resetGame, 5000)
      return () => clearTimeout(t)
    }
  }, [screen, resetGame])



  const startGame = () => setScreen('instrucciones')

  const beginQuestions = () => {
    const bank = questions
    if (_pool.length === 0) _pool = _shuffleIndices(bank.length)
    const selected = []
    while (selected.length < TOTAL_QUESTIONS) {
      if (_pool.length === 0) _pool = _shuffleIndices(bank.length)
      selected.push(bank[_pool.shift()])
    }
    try {
      localStorage.setItem('trivia_pool', JSON.stringify(_pool))
    } catch {
      /* almacenamiento no disponible: el pool solo vive en memoria */
    }
    setGameQuestions(selected)
    setCurrentIndex(0)
    setScore(0)
    setScreen('pregunta')
  }

  const handleAnswer = (isCorrect) => {
    if (isCorrect) setScore(s => s + 1)
    setTimeout(() => {
      const next = currentIndex + 1
      if (next >= TOTAL_QUESTIONS) {
        setCurrentIndex(next)
        setScreen('resultado')
      } else {
        setCurrentIndex(next)
      }
    }, FEEDBACK_DELAY)
  }



  return (
    <>
      {screen === 'portada' && <Portada onStart={startGame} />}
      {screen === 'instrucciones' && <Instrucciones onBegin={beginQuestions} />}
      {screen === 'pregunta' && gameQuestions[currentIndex] && (
        <Pregunta
          key={currentIndex}
          question={gameQuestions[currentIndex]}
          index={currentIndex}
          total={TOTAL_QUESTIONS}
          timePerQuestion={TIME_PER_QUESTION}
          onAnswer={handleAnswer}
        />
      )}
      {screen === 'resultado' && (
        <Resultado
          score={score}
          total={TOTAL_QUESTIONS}
          onReplay={resetGame}
          onFinish={() => setScreen('final')}
        />
      )}
      {screen === 'final' && <Final />}

    </>
  )
}
