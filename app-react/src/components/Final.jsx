import logoUnacem from '../assets/logo-unacem-2.svg'

export default function Final() {
  return (
    <div className="w-[1080px] h-[1920px] bg-[#FF0000] flex flex-col items-center justify-center absolute inset-0">
      <img
        src={logoUnacem}
        alt="UNACEM"
        width={130}
        height={170}
        className="block align-top w-[600px] h-auto aspect-[130/170] object-contain -mt-[100px]"
      />
    </div>
  )
}
