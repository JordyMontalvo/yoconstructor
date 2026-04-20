import logoVertical from '../assets/logo-vertical.svg'

const rules = [
  { icon: '5', text: 'Responde 5 preguntas sobre construcción' },
  { icon: '15', text: 'Tienes 15 segundos por pregunta' },
  { icon: '★', text: 'Descubre si eres Constructor o Maestro Constructor' },
]

export default function Instrucciones({ onBegin }) {
  return (
    <div className="w-[1080px] h-[1920px] bg-[#0032A0] flex flex-col items-center absolute inset-0">
      {/* Logo zone */}
      <div className="h-[480px] flex flex-col items-center justify-center pt-[160px]">
        <img src={logoVertical} alt="Progresol" className="w-[280px]" />
      </div>

      {/* Content zone */}
      <div className="flex-1 flex flex-col items-center justify-center px-20 gap-12">
        <h2 className="font-sg-sb15 text-[56px] text-[#14FF46] text-center">¿Cómo jugar?</h2>
        <div className="flex flex-col gap-9 w-full max-w-[860px]">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-7">
              <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <span className="font-sg-sb10 text-[36px] text-[#14FF46]">{rule.icon}</span>
              </div>
              <span className="font-sg-sb15 text-[38px] text-white leading-[1.3]">{rule.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA + Footer */}
      <div className="flex flex-col items-center pb-40 gap-10">
        <button
          onClick={onBegin}
          className="w-[600px] h-[110px] bg-[#14FF46] rounded-3xl flex items-center justify-center active:scale-[0.97] transition-transform"
        >
          <span className="font-sg-sb15 text-[40px] text-[#0032A0] tracking-[2px]">COMENZAR</span>
        </button>
        <span className="font-sg-b25 text-[18px] text-white/40">Expo Yo Constructor 2026</span>
      </div>
    </div>
  )
}
