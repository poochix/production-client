// "use client";

// import { useState } from "react";

// type Stage = "SHEET" | "FILM" | "SLITTING";

// /* ---------------- NORMAL RUN ---------------- */
// type Run = {
//   rollNo: string;
//   productName: string;
//   inputWidth: number;
//   outputWidth: number;
//   thickness: number;
//   weight: number;
// };

// /* ---------------- SLITTING ---------------- */
// type SlittingOutput = {
//   rollNo: string;
//   width: number;
//   actualWeightKg: number;
// };

// type SlittingBatch = {
//   batchId: string;
//   inputKg: number;
//   trimWasteKg: number;
//   rejectionKg: number;
//   outputs: SlittingOutput[];
// };

// export default function ProductionEntryForm() {
//   const [stage, setStage] = useState<Stage>("SHEET");
//   const [shift, setShift] = useState<"A" | "B">("A");
//   const [date, setDate] = useState("");
//   const [machine, setMachine] = useState("");

//   /* ---------------- NORMAL ---------------- */
//   const [runs, setRuns] = useState<Run[]>([
//     {
//       rollNo: "",
//       productName: "",
//       inputWidth: 0,
//       outputWidth: 0,
//       thickness: 0,
//       weight: 0,
//     },
//   ]);

//   /* ---------------- SLITTING ---------------- */
//   const [batches, setBatches] = useState<SlittingBatch[]>([
//     {
//       batchId: "",
//       inputKg: 0,
//       trimWasteKg: 0,
//       rejectionKg: 0,
//       outputs: [{ rollNo: "", width: 0, actualWeightKg: 0 }],
//     },
//   ]);

//   /* ---------------- MACHINE OPTIONS ---------------- */
//   const getMachines = () => {
//     if (stage === "SHEET") return ["sheet plant"];
//     if (stage === "FILM") return ["mdo 1", "mdo 2"];
//     return ["slitter 1", "slitter 2", "slitter 3"];
//   };

//   /* ---------------- NORMAL HANDLERS ---------------- */
//   const handleRunChange = (
//     index: number,
//     field: keyof Run,
//     value: string | number
//   ) => {
//     const updated = [...runs];
//     (updated[index] as any)[field] = value;
//     setRuns(updated);
//   };

//   const addRun = () => {
//     setRuns([
//       ...runs,
//       {
//         rollNo: "",
//         productName: "",
//         inputWidth: 0,
//         outputWidth: 0,
//         thickness: 0,
//         weight: 0,
//       },
//     ]);
//   };

//   const removeRun = (index: number) => {
//     setRuns(runs.filter((_, i) => i !== index));
//   };

//   /* ---------------- SLITTING HANDLERS ---------------- */
//   const handleBatchChange = (
//     index: number,
//     field: keyof SlittingBatch,
//     value: any
//   ) => {
//     const updated = [...batches];
//     (updated[index] as any)[field] = value;
//     setBatches(updated);
//   };

//   const handleOutputChange = (
//     batchIndex: number,
//     outIndex: number,
//     field: keyof SlittingOutput,
//     value: any
//   ) => {
//     const updated = [...batches];
//     (updated[batchIndex].outputs[outIndex] as any)[field] = value;
//     setBatches(updated);
//   };

//   const addBatch = () => {
//     setBatches([
//       ...batches,
//       {
//         batchId: "",
//         inputKg: 0,
//         trimWasteKg: 0,
//         rejectionKg: 0,
//         outputs: [{ rollNo: "", width: 0, actualWeightKg: 0 }],
//       },
//     ]);
//   };

//   const addOutput = (batchIndex: number) => {
//     const updated = [...batches];
//     updated[batchIndex].outputs.push({
//       rollNo: "",
//       width: 0,
//       actualWeightKg: 0,
//     });
//     setBatches(updated);
//   };

//   /* ---------------- SUBMIT ---------------- */
//   const handleSubmit = () => {
//     const payload = {
//       date,
//       shift,
//       machine,
//       stage,
//       runs: stage === "SLITTING" ? batches : runs,
//     };

//     console.log("SUBMIT:", payload);
//   };

//   return (
//     <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
//       <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">
//         <h1 className="text-2xl font-bold mb-6">Production Entry</h1>

//         {/* META */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
//           <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />

//           <select className="input" value={shift} onChange={(e) => setShift(e.target.value as any)}>
//             <option value="A">Shift A</option>
//             <option value="B">Shift B</option>
//           </select>

//           <select className="input" value={machine} onChange={(e) => setMachine(e.target.value)}>
//             <option value="">Select Machine</option>
//             {getMachines().map((m) => (
//               <option key={m} value={m}>{m}</option>
//             ))}
//           </select>

//           <select className="input" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
//             <option value="SHEET">SHEET</option>
//             <option value="FILM">FILM</option>
//             <option value="SLITTING">SLITTING</option>
//           </select>
//         </div>

//         {/* ---------------- NORMAL FORM ---------------- */}
//         {stage !== "SLITTING" && (
//           <>
//             <div className="grid grid-cols-6 gap-3 font-semibold mb-2 text-sm">
//               <span>Roll No</span>
//               <span>Product</span>
//               <span>Input Width</span>
//               <span>Output Width</span>
//               <span>Thickness</span>
//               <span>Weight</span>
//             </div>

//             {runs.map((run, index) => (
//               <div key={index} className="grid grid-cols-6 gap-3 mb-2">
//                 <input className="input" value={run.rollNo} onChange={(e) => handleRunChange(index, "rollNo", e.target.value)} />
//                 <input className="input" value={run.productName} onChange={(e) => handleRunChange(index, "productName", e.target.value)} />
//                 <input type="number" className="input" value={run.inputWidth} onChange={(e) => handleRunChange(index, "inputWidth", +e.target.value)} />
//                 <input type="number" className="input" value={run.outputWidth} onChange={(e) => handleRunChange(index, "outputWidth", +e.target.value)} />
//                 <input type="number" className="input" value={run.thickness} onChange={(e) => handleRunChange(index, "thickness", +e.target.value)} />
//                 <div className="flex gap-2">
//                   <input type="number" className="input flex-1" value={run.weight} onChange={(e) => handleRunChange(index, "weight", +e.target.value)} />
//                   <button onClick={() => removeRun(index)} className="bg-red-500 text-white px-2 rounded">✕</button>
//                 </div>
//               </div>
//             ))}

//             <button onClick={addRun} className="bg-gray-200 px-4 py-2 rounded mt-4">
//               + Add Row
//             </button>
//           </>
//         )}

//         {/* ---------------- SLITTING FORM ---------------- */}
//         {stage === "SLITTING" && (
//           <div className="space-y-6">
//             {batches.map((batch, bIndex) => (
//               <div key={bIndex} className="border p-4 rounded-xl bg-gray-50">
//                 <div className="grid grid-cols-4 gap-3 mb-4">
//                   <input className="input" placeholder="Batch ID" value={batch.batchId} onChange={(e) => handleBatchChange(bIndex, "batchId", e.target.value)} />
//                   <input type="number" className="input" placeholder="Input Kg" value={batch.inputKg} onChange={(e) => handleBatchChange(bIndex, "inputKg", +e.target.value)} />
//                   <input type="number" className="input" placeholder="Trim Waste" value={batch.trimWasteKg} onChange={(e) => handleBatchChange(bIndex, "trimWasteKg", +e.target.value)} />
//                   <input type="number" className="input" placeholder="Rejection" value={batch.rejectionKg} onChange={(e) => handleBatchChange(bIndex, "rejectionKg", +e.target.value)} />
//                 </div>

//                 {batch.outputs.map((out, oIndex) => (
//                   <div key={oIndex} className="grid grid-cols-3 gap-3 mb-2">
//                     <input className="input" placeholder="Roll No" value={out.rollNo} onChange={(e) => handleOutputChange(bIndex, oIndex, "rollNo", e.target.value)} />
//                     <input type="number" className="input" placeholder="Width" value={out.width} onChange={(e) => handleOutputChange(bIndex, oIndex, "width", +e.target.value)} />
//                     <input type="number" className="input" placeholder="Weight" value={out.actualWeightKg} onChange={(e) => handleOutputChange(bIndex, oIndex, "actualWeightKg", +e.target.value)} />
//                   </div>
//                 ))}

//                 <button onClick={() => addOutput(bIndex)} className="text-blue-600 text-sm">
//                   + Add Output Roll
//                 </button>
//               </div>
//             ))}

//             <button onClick={addBatch} className="bg-gray-200 px-4 py-2 rounded">
//               + Add Batch
//             </button>
//           </div>
//         )}

//         {/* SUBMIT */}
//         <div className="mt-6">
//           <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
//             Submit Production
//           </button>
//         </div>
//       </div>

//       <style jsx>{`
//         .input {
//           @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500;
//         }
//       `}</style>
//     </div>
//   );
// }



import ProductionFormContainer from "@/components/ProductionFormsController";

export default function NewEntryPage() {
  return <ProductionFormContainer />;
}