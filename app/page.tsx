"use client"

import {fabric} from "fabric";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import LeftSiderbar from "@/components/LeftSiderbar";
import RightSiderbar from "@/components/RightSiderbar";
import { useRef } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);



  return (
    <main className="h-screen overflow-hidden" >
      <Navbar/>
      <section className="flex h-full flex-row" >
        <LeftSiderbar/>
        <Live/>
        <RightSiderbar/>
      </section>
    </main>
  );
}