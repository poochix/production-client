"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SheetForm from "./forms/Sheet";
import SlitterForm from "./forms/Slitter";
import FilmForm from "./forms/Film";
import { loadSavedStage } from "@/features/production/productionSlice";

// This component selects the current production stage from Redux
// and renders the correct form for Sheet, Film, or Slitting.
export default function ProductionFormContainer() {
  const dispatch = useDispatch();
  const rawStage = useSelector((state: any) => state.production.stage);
  const stage = typeof rawStage === "string" ? rawStage.toLowerCase() : "sheet";

  useEffect(() => {
    dispatch(loadSavedStage());
  }, [dispatch]);

  return (
    <div className="p-4">
      {stage === "sheet" && <SheetForm />}
      {stage === "film" && <FilmForm />}
      {stage === "slitter" && <SlitterForm />}
    </div>
  );
}














// "use client";

// import { useState } from "react";
// import SheetForm from "./forms/Sheet";
// import SlitterForm from "./forms/Slitter";
// // import FilmForm from "@/components/forms/FilmForm";

// export default function ProductionFormContainer() {
//   const [stage, setStage] = useState("sheet");

//   return (
//     <div className="p-4 space-y-4">
      
//       {/* 🔘 Toggle Buttons */}
//       <div className="flex gap-2">
//         <button
//           onClick={() => setStage("sheet")}
//           className={`px-4 py-2 rounded-lg ${
//             stage === "sheet" ? "bg-black text-white" : "bg-gray-200"
//           }`}
//         >
//           Sheet
//         </button>

//         <button
//           onClick={() => setStage("film")}
//           className={`px-4 py-2 rounded-lg ${
//             stage === "film" ? "bg-black text-white" : "bg-gray-200"
//           }`}
//         >
//           Film
//         </button>

//         <button
//           onClick={() => setStage("slitter")}
//           className={`px-4 py-2 rounded-lg ${
//             stage === "slitter" ? "bg-black text-white" : "bg-gray-200"
//           }`}
//         >
//           Slitter
//         </button>
//       </div>

//       {/* 🧩 Form Rendering */}
//       <div>
//         {stage === "sheet" && <SheetForm />}
//         {stage === "film" && <div>Film Form Coming...</div>}
//         {stage === "slitter" && <SlitterForm />}
//       </div>
//     </div>
//   );
// }