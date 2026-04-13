import { useState, useEffect, useRef, useCallback } from 'react'
import Confetti from './Confetti'

const LETTERS = ['A', 'B', 'C', 'D']

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
)

export default function Pregunta({ question, index, total, timePerQuestion, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  const [answered, setAnswered] = useState(false)
  const timerRef = useRef(null)
  const answeredRef = useRef(false)
  const onAnswerRef = useRef(onAnswer)

  const correctIndex = question.respuesta_correcta

  useEffect(() => {
    onAnswerRef.current = onAnswer
  }, [onAnswer])

  const handleSelect = useCallback((i) => {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setSelected(i)
    clearInterval(timerRef.current)
    const isCorrect = i === correctIndex
    onAnswerRef.current(isCorrect)
  }, [correctIndex])

  // Timer
  useEffect(() => {
    if (answered) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSelect(-1)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [question, answered, handleSelect])

  const isCorrect = selected === correctIndex
  const timerPct = (timeLeft / timePerQuestion) * 100

  return (
    <div className="w-[1080px] h-[1920px] bg-[#0032A0] flex flex-col items-center absolute inset-0">
      {answered && isCorrect && <Confetti />}
      {/* Progress bar */}
      <div className="flex flex-col items-center w-full px-[60px] pt-[60px] pb-5 gap-4">
        <div className="flex items-center gap-2 w-full">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[10px] rounded-full transition-colors duration-300 ${
                i <= index ? 'bg-[#14FF46]' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
        <span className="font-sg-b25 text-[30px] text-white/70">{index + 1} de {total}</span>
      </div>

      {/* Misma altura de inicio para todas + pt calibrado al lienzo 1080×1920 (~centrado previo con ~3 líneas) */}
      <div className="flex-1 flex flex-col items-center justify-start px-20 pt-[400px] pb-10 min-h-0 overflow-y-auto overscroll-contain">
        <p className="font-sg-sb15 text-[58px] leading-[1.25] text-white text-center max-w-[920px]">
          {question.pregunta}
        </p>
      </div>

      {/* Options: feedback en capa absoluta para no desplazar la pregunta al responder */}
      <div className="relative flex flex-col items-center w-full px-10 shrink-0">
        {answered && (
          <div
            className="absolute left-0 right-0 bottom-full mb-6 flex flex-col items-center gap-4 pointer-events-none z-10 px-4"
            aria-live="polite"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-[#00C853]' : 'bg-[#FF3B3B]'
            }`}>
              {isCorrect ? <CheckIcon /> : <XIcon />}
            </div>
            <span className={`font-sg-sb10 text-[48px] ${
              isCorrect ? 'text-[#00C853]' : 'text-[#FF3B3B]'
            }`}>
              {isCorrect ? '¡Correcto!' : 'Incorrecto'}
            </span>
            {!isCorrect && (
              <span className="font-sg-b15 text-[28px] text-white/70">La respuesta correcta es:</span>
            )}
          </div>
        )}
        <div className="flex flex-col items-center w-full gap-5">
        {question.opciones.map((opcion, i) => {
          let cardClass = 'bg-white'
          let textColor = 'text-[#0032A0]'
          let letterBg = 'bg-[#0032A0]'
          let opacity = ''

          if (answered) {
            if (i === correctIndex) {
              cardClass = 'bg-[#00C853]'
              textColor = 'text-white'
              letterBg = 'bg-white/30'
            } else if (i === selected && !isCorrect) {
              cardClass = 'bg-[#FF3B3B]'
              textColor = 'text-white'
              letterBg = 'bg-white/30'
            } else {
              opacity = 'opacity-30'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`flex items-center w-[1000px] ${cardClass} rounded-3xl transition-all duration-300 active:scale-[0.98] ${opacity}`}
              style={{ minHeight: 130, height: 'auto', padding: '24px 36px', gap: 24 }}
            >
              <div
                className={`rounded-full ${letterBg} flex items-center justify-center shrink-0`}
                style={{ width: 64, height: 64, minWidth: 64 }}
              >
                <span className="font-sg-sb15 text-[26px] text-white">
                  {LETTERS[i]}
                </span>
              </div>
              <span className={`font-sg-sb15 text-[40px] leading-[1.35] ${textColor} text-left`}>{opcion}</span>
            </button>
          )
        })}
        </div>
      </div>

      {/* Timer */}
      <div className={`flex flex-col items-center w-full px-[60px] py-10 gap-4 transition-opacity duration-300 ${
        answered ? 'opacity-50' : ''
      }`}>
        <span className="font-sg-sb10 text-[56px] text-white">{timeLeft}</span>
        <div className="w-full h-[10px] bg-white/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              timeLeft <= 5 ? 'bg-[#FFB300]' : 'bg-[#14FF46]'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
