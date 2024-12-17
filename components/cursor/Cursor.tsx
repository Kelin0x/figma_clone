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
    </div>
  )


}

export default Cursor