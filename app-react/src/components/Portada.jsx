import logoVertical from '../assets/logo-vertical.svg'
import logoUnacem from '../assets/logo-unacem.png'

export default function Portada({ onStart }) {
  return (
    <div className="w-[1080px] h-[1920px] bg-[#0032A0] flex flex-col items-center absolute inset-0">
      <img
        src={logoUnacem}
        alt="UNACEM"
        className="absolute h-auto object-contain"
        style={{ top: 0, right: 60, width: 140 }}
      />
      {/* Spacer top */}
      <div className="h-[580px]" />

      {/* Logo */}
      <img src={logoVertical} alt="Progresol" className="w-[380px]" />

      {/* Title */}
      <div className="flex flex-col items-center gap-5 px-20 pt-12">
        <h1 className="font-sg-sb15 text-[60px] leading-[1.1] text-white text-center">
          ¿Cuánto sabes de construcción?
        </h1>
        <p className="font-sg-sb15 text-[36px] text-white/70 text-center">
          Pon a prueba tus conocimientos
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA + Footer */}
      <div className="flex flex-col items-center pb-40 gap-10">
        <button
          onClick={onStart}
          className="w-[600px] h-[110px] bg-[#14FF46] rounded-3xl flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ animation: 'pulse-cta 2s ease-in-out infinite' }}
        >
          <span className="font-sg-sb15 text-[40px] text-[#0032A0] tracking-[2px]">INICIAR</span>
        </button>
        <span className="font-sg-b25 text-[18px] text-white/40">Expo Yo Constructor 2026</span>
      </div>
    </div>
  )
}
