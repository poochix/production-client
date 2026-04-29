"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

const shifts = ["A", "B", "C"];
const machines = ["Sheet Line 1", "Sheet Line 2"];
const operators = ["Ramesh", "Suresh", "Amit"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const META_STORAGE_KEY = "sheet_batch_meta";
const DRAFTS_STORAGE_KEY = "sheet_batch_drafts";
const ROLL_STATE_STORAGE_KEY = "sheet_batch_roll";
const CONFIRMED_STORAGE_KEY = "sheet_batch_confirmed";

type RollDraft = {
  code: string;
  rollNo: string;
  thickness: string;
  density: string;
  tensile: string;
  inputWidth: string;
  outputWidth: string;
  inputWeight: string;
  outputWeight: string;
  rejection: string;
};

type Meta = {
  date: string;
  shift: string;
  operator: string;
  machine: string;
};

const emptyRoll: RollDraft = {
  code: "",
  rollNo: "",
  thickness: "",
  density: "",
  tensile: "",
  inputWidth: "",
  outputWidth: "",
  inputWeight: "",
  outputWeight: "",
  rejection: "",
};

export default function SheetBatch() {
  const [meta, setMeta] = useState<Meta>({
    date: new Date().toISOString().slice(0, 10),
    shift: "",
    operator: "",
    machine: "",
  });
  const [roll, setRoll] = useState<RollDraft>(emptyRoll);
  const [drafts, setDrafts] = useState<RollDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedMeta = localStorage.getItem(META_STORAGE_KEY);
    if (storedMeta) {
      try {
        const parsed = JSON.parse(storedMeta);
        setMeta((prev) => ({
          date: parsed.date || prev.date,
          shift: parsed.shift || "",
          operator: parsed.operator || "",
          machine: parsed.machine || "",
        }));
      } catch {
        // keep default date when parse fails
      }
    }

    const storedRoll = localStorage.getItem(ROLL_STATE_STORAGE_KEY);
    if (storedRoll) {
      try {
        setRoll(JSON.parse(storedRoll));
      } catch {
        // ignore
      }
    }

    const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (storedDrafts) {
      try {
        setDrafts(JSON.parse(storedDrafts));
      } catch {
        // ignore
      }
    }

    const storedConfirmed = localStorage.getItem(CONFIRMED_STORAGE_KEY);
    setConfirmed(storedConfirmed === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem(ROLL_STATE_STORAGE_KEY, JSON.stringify(roll));
  }, [roll]);

  useEffect(() => {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem(CONFIRMED_STORAGE_KEY, String(confirmed));
  }, [confirmed]);

  const handleMetaChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleRollChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRoll({ ...roll, [e.target.name]: e.target.value });
  };

  const waste =
    roll.inputWeight && roll.outputWeight
      ? Number(roll.inputWeight) - Number(roll.outputWeight)
      : 0;

  const handleSaveRoll = () => {
    if (!roll.rollNo || !roll.outputWeight || !roll.inputWidth || !roll.outputWidth) {
      alert("Please fill the required roll fields before adding.");
      return;
    }

    const normalized = { ...roll, rejection: roll.rejection || "0" };
    const nextDrafts = editingIndex !== null
      ? drafts.map((item, index) => (index === editingIndex ? normalized : item))
      : [...drafts, normalized];

    setDrafts(nextDrafts);
    setRoll(emptyRoll);
    setEditingIndex(null);
    setConfirmed(false);
    setMessage(null);
  };

  const handleEditRoll = (index: number) => {
    setRoll(drafts[index]);
    setEditingIndex(index);
    setConfirmed(false);
    setMessage(null);
  };

  const handleRemoveRoll = (index: number) => {
    const nextDrafts = drafts.filter((_, idx) => idx !== index);
    setDrafts(nextDrafts);
    setEditingIndex(null);
    setConfirmed(false);
    setMessage(null);
  };

  const handleClearAll = () => {
    setDrafts([]);
    setRoll(emptyRoll);
    setEditingIndex(null);
    setConfirmed(false);
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    localStorage.removeItem(ROLL_STATE_STORAGE_KEY);
    setMessage("Batch cleared.");
  };

  const handleConfirmBatch = () => {
    if (drafts.length === 0) {
      alert("Add at least one roll before confirming.");
      return;
    }
    setConfirmed(true);
    setMessage(`Batch confirmed with ${drafts.length} rolls.`);
  };

  const handleSubmitBatch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!meta.date || !meta.shift || !meta.machine) {
      alert("Please complete the batch metadata before submitting.");
      return;
    }

    if (drafts.length === 0) {
      alert("Add at least one roll to submit.");
      return;
    }

    if (!confirmed) {
      alert("Confirm the batch before submitting.");
      return;
    }

    const payload = {
      stage: "SHEET",
      date: meta.date,
      shift: meta.shift,
      machine: meta.machine,
      operator: meta.operator,
      runs: drafts.map((item) => ({
        code: item.code,
        rollNo: item.rollNo,
        thickness: item.thickness,
        density: item.density,
        tensile: item.tensile,
        inputWidth: item.inputWidth,
        outputWidth: item.outputWidth,
        inputWeight: item.inputWeight,
        outputWeight: item.outputWeight,
        rejection: item.rejection,
      })),
    };

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/production/create-production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to submit batch.");
      }

      setDrafts([]);
      setRoll(emptyRoll);
      setConfirmed(false);
      localStorage.removeItem(DRAFTS_STORAGE_KEY);
      localStorage.removeItem(ROLL_STATE_STORAGE_KEY);
      setMessage(`Batch submitted successfully. Saved ${data.runs ?? drafts.length} rolls.`);
    } catch (error: any) {
      setMessage(error?.message || "Batch submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitBatch} className="grid gap-4 p-4 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold">Sheet Batch Entry</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Date <span className="text-red-500">*</span></span>
          <input
            type="date"
            name="date"
            className="p-3 border rounded-lg"
            value={meta.date}
            onChange={handleMetaChange}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Shift <span className="text-red-500">*</span></span>
          <select
            name="shift"
            className="p-3 border rounded-lg"
            value={meta.shift}
            onChange={handleMetaChange}
          >
            <option value="">Select Shift</option>
            {shifts.map((shiftOption) => (
              <option key={shiftOption} value={shiftOption}>
                {shiftOption}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Operator</span>
          <select
            name="operator"
            className="p-3 border rounded-lg"
            value={meta.operator}
            onChange={handleMetaChange}
          >
            <option value="">Select Operator</option>
            {operators.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Machine <span className="text-red-500">*</span></span>
          <select
            name="machine"
            className="p-3 border rounded-lg"
            value={meta.machine}
            onChange={handleMetaChange}
          >
            <option value="">Select Machine</option>
            {machines.map((machineOption) => (
              <option key={machineOption} value={machineOption}>
                {machineOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 p-4 bg-slate-50 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold">Add Roll to Batch</h3>

        <input
          name="code"
          value={roll.code}
          onChange={handleRollChange}
          placeholder="Product Code"
          className="p-3 border rounded-lg"
        />

        <label className="grid gap-1">
          <span className="text-sm font-medium">Roll No <span className="text-red-500">*</span></span>
          <input
            name="rollNo"
            value={roll.rollNo}
            onChange={handleRollChange}
            placeholder="Roll No"
            className="p-3 border rounded-lg"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            name="thickness"
            value={roll.thickness}
            onChange={handleRollChange}
            placeholder="Thickness"
            className="p-3 border rounded-lg"
          />
          <input
            name="density"
            value={roll.density}
            onChange={handleRollChange}
            placeholder="Density"
            className="p-3 border rounded-lg"
          />
          <input
            name="tensile"
            value={roll.tensile}
            onChange={handleRollChange}
            placeholder="Tensile"
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Input Width <span className="text-red-500">*</span></span>
            <input
              name="inputWidth"
              value={roll.inputWidth}
              onChange={handleRollChange}
              placeholder="Input Width"
              className="p-3 border rounded-lg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Output Width <span className="text-red-500">*</span></span>
            <input
              name="outputWidth"
              value={roll.outputWidth}
              onChange={handleRollChange}
              placeholder="Output Width"
              className="p-3 border rounded-lg"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Input Weight</span>
            <input
              name="inputWeight"
              value={roll.inputWeight}
              onChange={handleRollChange}
              placeholder="Input Weight"
              className="p-3 border rounded-lg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Output Weight <span className="text-red-500">*</span></span>
            <input
              name="outputWeight"
              value={roll.outputWeight}
              onChange={handleRollChange}
              placeholder="Output Weight"
              className="p-3 border rounded-lg"
            />
          </label>
        </div>

        <input
          value={waste}
          disabled
          placeholder="Waste (auto)"
          className="p-3 border rounded-lg bg-gray-100"
        />

        <input
          name="rejection"
          value={roll.rejection}
          onChange={handleRollChange}
          placeholder="Rejection"
          className="p-3 border rounded-lg"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSaveRoll}
            className="bg-black text-white py-3 px-6 rounded-lg"
          >
            {editingIndex !== null ? "Update Roll" : "Add Roll"}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={() => {
                setRoll(emptyRoll);
                setEditingIndex(null);
              }}
              className="border border-gray-300 text-gray-700 py-3 px-6 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 p-4 bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Batch Roll List</h3>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:underline"
          >
            Clear Batch
          </button>
        </div>

        {drafts.length === 0 ? (
          <p className="text-sm text-gray-500">No rolls added yet. Add rolls to submit them together as one batch.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((item, index) => (
              <div key={`${item.rollNo}-${index}`} className="grid gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">Roll {item.rollNo || index + 1}</div>
                    <div className="text-sm text-gray-500">Code: {item.code || "N/A"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditRoll(index)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoll(index)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-1 sm:grid-cols-3 text-sm text-gray-700">
                  <div>Input: {item.inputWidth} × {item.inputWeight || "-"}</div>
                  <div>Output: {item.outputWidth} × {item.outputWeight}</div>
                  <div>Reject: {item.rejection}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleConfirmBatch}
          className="bg-amber-500 text-white py-3 px-6 rounded-lg"
        >
          Confirm Batch
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white py-3 px-6 rounded-lg disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Batch"}
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          {message}
        </div>
      )}
    </form>
  );
}
