import { useEffect } from 'react'

const TIERS = [
  { min: 0, max: 2, label: 'CONSTRUCTOR', emoji: '🔧', badge: 'border-2 border-[#14FF46]', icon: 'bg-[#14FF46]/15', scoreColor: 'text-white', message: '¡Vas por buen camino! Sigue sumando conocimiento sobre construcción. Progresol es tu aliado.' },
  { min: 3, max: 5, label: 'MAESTRO CONSTRUCTOR', emoji: '🏆', badge: 'bg-[#14FF46]', icon: 'bg-[#14FF46]', scoreColor: 'text-[#14FF46]', badgeText: 'text-[#0032A0]', message: '¡Eres un experto! Construir es tu pasión y Progresol tu mejor herramienta.' },
]

function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max)
}

export default function Resultado({ score, total, onReplay, onFinish }) {
  const tier = getTier(score)

  useEffect(() => {
    const t = setTimeout(() => {
      if (onFinish) onFinish()
      else onReplay()
    }, 5000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-[1080px] h-[1920px] bg-[#0032A0] flex flex-col items-center absolute inset-0">
      {/* Spacer top */}
      <div className="h-[280px]" />


      {/* Content zone */}
      <div className="flex-1 flex flex-col items-center justify-center px-20 gap-8">
        <span className={`font-sg-sb10 text-[96px] leading-none ${tier.scoreColor}`}>
          {score}/{total}
        </span>
        <div className={`flex items-center justify-center px-12 py-4 rounded-2xl ${tier.badge}`}>
          <span className={`font-sg-sb10 text-[40px] ${tier.badgeText || 'text-white'}`}>
            {tier.label}
          </span>
        </div>
        <div className={`w-[120px] h-[120px] rounded-full flex items-center justify-center ${tier.icon}`}>
          <span className="text-[48px]">{tier.emoji}</span>
        </div>
        <p className="font-sg-b15 text-[32px] leading-[1.4] text-white/70 text-center max-w-[800px]">
          {tier.message}
        </p>
      </div>

      {/* CTA + Footer */}
      <div className="flex flex-col items-center pb-20 gap-10">
        <button
          onClick={onReplay}
          className="w-[600px] h-[110px] bg-[#14FF46] rounded-3xl flex items-center justify-center active:scale-[0.97] transition-transform"
        >
          <span className="font-sg-mi10 text-[36px] text-[#0032A0] tracking-[2px]">VOLVER A JUGAR</span>
        </button>
        <span className="font-sg-b25 text-[18px] text-white/40">Expo Yo Constructor 2026</span>
      </div>
    </div>
  )
}
