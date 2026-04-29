"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useDispatch, useSelector } from "react-redux";
import { setStage } from "@/features/production/productionSlice";
import { useState } from "react";

export default function Navbar() {
  const dispatch = useDispatch();
  const currentStage = useSelector((state: any) => state.production.stage);

  const [open, setOpen] = useState(false); // 🔥 control sheet

  const handleStageChange = (stage: string) => {
    dispatch(setStage(stage));
    setOpen(false); // 🔥 CLOSE SHEET AFTER CLICK
  };

  const getBtnStyle = (stage: string) =>
    currentStage === stage
      ? "bg-black text-white"
      : "bg-white border";

  return (
    <nav className="w-full h-16 border-b bg-white flex items-center justify-between px-4">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-64">
            <SheetTitle className="text-lg font-semibold">
              Navigation Menu
            </SheetTitle>
            <SheetDescription>
              Select production stage or navigate dashboard
            </SheetDescription>
            <div className="flex flex-col gap-4 mt-6 text-lg">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>

              <div className="mt-4 border-t pt-4 flex flex-col gap-3">
                <p className="text-sm text-gray-500">New Entry</p>

                <button onClick={() => handleStageChange("sheet")}>
                  Sheet Form
                </button>

                <button onClick={() => handleStageChange("film")}>
                  Film Form
                </button>

                <button onClick={() => handleStageChange("slitter")}>
                  Slitter Form
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <span className="text-lg font-semibold">
          Production Tracker
        </span>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex gap-2">
        <Button
          onClick={() => handleStageChange("sheet")}
          className={getBtnStyle("sheet")}
        >
          Sheet
        </Button>

        <Button
          onClick={() => handleStageChange("film")}
          className={getBtnStyle("film")}
        >
          Film
        </Button>

        <Button
          onClick={() => handleStageChange("slitter")}
          className={getBtnStyle("slitter")}
        >
          Slitter
        </Button>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div className="text-sm text-right">
          <p className="font-medium">Hritik</p>
          <p className="text-gray-500 text-xs">Shift A</p>
        </div>

        <Button variant="outline" size="sm">
          Logout
        </Button>
      </div>
    </nav>
  );
}