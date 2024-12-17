import CursorSVG from "@/public/assets/CursorSVG";

type Props = {
    color:string;
    x:number;
    y:number;
    message:string;
}

const Cursor = ({color,x,y,message}:Props) => {

  return (
    <div className="pointer-events-none absolute left-0 top-0" style={{transform:`translate(${x}px,${y}px)`}}>
        <CursorSVG color={color} />

        {/* message */}
        {message && (
          <div className="absolute left-2 top-5 bg-blue-500 px-4 py-2 rounded-3xl" style={{backgroundColor:color}}>
            <p className="text-white whitespace-nowrap text-sm leading-relaxed">{message}</p>
          </div>
        )}
    </div>
  )


}

export default Cursor