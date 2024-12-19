"use client";

import {fabric} from "fabric";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import {  useEffect, useRef, useState} from "react";
import { handleCanvasMouseDown, handleResize, initializeFabric } from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { useMutation, useStorage } from "@liveblocks/react";
import { root } from "postcss";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string| null>(null);
  const canvasObjectRef = useStorage((root)=>root.canvasObject);
  const syncShapeInStorage = useMutation(({storage},object)=>{
    if(!object) return;

    const {objectId} = object;
    const shapeData=object.toJson();
    shapeData.objectId=objectId;
  },[])

  

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    icon: "",
    value: "",
  })
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    selectedShapeRef.current=elem?.value as string;
  }

  
  useEffect(() => {
    const canvas = initializeFabric({canvasRef, fabricRef});
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      });
    });
    window.addEventListener("resize", () => {
      handleResize({canvas});
    });
  }, [])


  
  return (
    <main className="h-screen overflow-hidden" >
      <Navbar
          activeElement={activeElement}
          handleActiveElement={handleActiveElement}
      />
      <section className="flex h-full flex-row" >
        <LeftSidebar/>
        <Live canvasRef={canvasRef}/>
        <RightSidebar/>
      </section>
    </main>
  );
}