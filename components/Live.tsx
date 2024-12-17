import {  useMyPresence, useOthers } from "@liveblocks/react";
import LiveCursors from "./cursor/LiveCursors";

const Live = () => {

    const others = useOthers(); 


    const[myPresence,setMyPresence]=useMyPresence();

    return (
        <div>
            <LiveCursors others={others} />
        </div>
    );
};

export default Live;
