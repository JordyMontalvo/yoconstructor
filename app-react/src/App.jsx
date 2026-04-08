import { useState, useEffect, useCallback, useRef } from 'react'
import Portada from './components/Portada'
import Instrucciones from './components/Instrucciones'
import Pregunta from './components/Pregunta'
import Resultado from './components/Resultado'

const TOTAL_QUESTIONS = 10
const TIME_PER_QUESTION = 15
const FEEDBACK_DELAY = 2500
const INACTIVITY_TIMEOUT = 120000

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

  const startGame = () => setScreen('instrucciones')

  const beginQuestions = () => {
    const selected = shuffle(questions).slice(0, TOTAL_QUESTIONS)
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

  const resetGame = () => {
    setCurrentIndex(0)
    setScore(0)
    setScreen('portada')
  }

  return (
    <>
      {screen === 'portada' && <Portada onStart={startGame} />}
      {screen === 'instrucciones' && <Instrucciones onBegin={beginQuestions} />}
      {screen === 'pregunta' && gameQuestions[currentIndex] && (
        <Pregunta
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
        />
      )}
    </>
  )
}
