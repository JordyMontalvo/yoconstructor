import logoUnacem from '../assets/logo-unacem-rojo.png'

export default function Final() {
  return (
    <div className="w-[1080px] h-[1920px] bg-[#FF0000] flex flex-col items-center justify-center absolute inset-0">
      <img src={logoUnacem} alt="UNACEM" className="w-[600px] h-auto -mt-[100px]" />
    </div>
  )
}
