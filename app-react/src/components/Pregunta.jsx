import { useState, useEffect, useRef } from 'react'

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

  const correctIndex = question.respuesta_correcta

  // Reset state on new question
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setTimeLeft(timePerQuestion)
  }, [question, timePerQuestion])

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
  }, [question, answered])

  const handleSelect = (i) => {
    if (answered) return
    setAnswered(true)
    setSelected(i)
    clearInterval(timerRef.current)
    const isCorrect = i === correctIndex
    onAnswer(isCorrect)
  }

  const isCorrect = selected === correctIndex
  const timerPct = (timeLeft / timePerQuestion) * 100

  return (
    <div className="w-[1080px] h-[1920px] bg-[#0032A0] flex flex-col items-center absolute inset-0">
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

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-20 py-10">
        <p className="font-sg-sb15 text-[58px] leading-[1.25] text-white text-center max-w-[920px]">
          {question.pregunta}
        </p>
      </div>

      {/* Feedback */}
      {answered && (
        <div className="flex flex-col items-center gap-4 pb-8">
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

      {/* Options */}
      <div className="flex flex-col items-center w-full px-10 gap-5">
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
              style={{ height: 140, paddingLeft: 60, paddingRight: 60, gap: 16 }}
            >
              <div
                className={`rounded-full ${letterBg} flex items-center justify-center shrink-0`}
                style={{ width: 56, height: 56, minWidth: 56 }}
              >
                <span className="font-sg-sb10 text-[22px] text-white">
                  {LETTERS[i]}
                </span>
              </div>
              <span className={`font-sg-b15 text-[32px] ${textColor} text-left`}>{opcion}</span>
            </button>
          )
        })}
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
