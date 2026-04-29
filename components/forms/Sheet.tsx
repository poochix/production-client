"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

// Sheet production form options and metadata
const shifts = ["A", "B", "C"];
const machines = ["Sheet Line 1", "Sheet Line 2"];
const operators = ["Ramesh", "Suresh", "Amit"];



// Local storage keys used so the Sheet form keeps state when the user navigates away or refreshes.
const META_STORAGE_KEY = "sheet_meta";
const DRAFTS_STORAGE_KEY = "sheet_drafts";
const ROLL_STATE_STORAGE_KEY = "sheet_roll_state";
const CONFIRMED_STORAGE_KEY = "sheet_confirmed";
const TRACKING_STORAGE_KEY = "production_roll_tracking";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"; // backend express server

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





export default function SheetForm() {
  const [meta, setMeta] = useState<Meta>({
    date: "",
    shift: "",
    operator: "",
    machine: "",
  });

  const [roll, setRoll] = useState<RollDraft>({
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
  });

  const [drafts, setDrafts] = useState<RollDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    // Load all Sheet form state from localStorage when the component mounts.
    const today = new Date().toISOString().slice(0, 10);

    const savedMeta = localStorage.getItem(META_STORAGE_KEY);
    if (savedMeta) {
      try {
        const parsed = JSON.parse(savedMeta);
        setMeta({
          date: parsed.date || today,
          shift: parsed.shift || "",
          operator: parsed.operator || "",
          machine: parsed.machine || "",
        });
      } catch (error) {
        console.warn("Could not parse saved sheet metadata", error);
        setMeta((prev) => ({ ...prev, date: today }));
      }
    } else {
      setMeta((prev) => ({ ...prev, date: today }));
    }

    const savedRoll = localStorage.getItem(ROLL_STATE_STORAGE_KEY);
    if (savedRoll) {
      try {
        setRoll(JSON.parse(savedRoll));
      } catch (error) {
        console.warn("Could not parse saved roll fields", error);
      }
    }

    const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (error) {
        console.warn("Could not parse saved sheet drafts", error);
      }
    }

    const savedConfirmed = localStorage.getItem(CONFIRMED_STORAGE_KEY);
    if (savedConfirmed) {
      setConfirmed(savedConfirmed === "true");
    }
  }, []);

  useEffect(() => {
    // Persist metadata, drafted rolls, current roll draft, and confirmation flag to localStorage.
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem(ROLL_STATE_STORAGE_KEY, JSON.stringify(roll));
  }, [roll]);

  useEffect(() => {
    localStorage.setItem(CONFIRMED_STORAGE_KEY, JSON.stringify(confirmed));
  }, [confirmed]);

  useEffect(() => {
    if (drafts.length === 0) {
      return;
    }

    const tracked = drafts.map((draft) => ({
      rollNo: draft.rollNo,
      stage: "SHEET",
      code: draft.code,
      inputWeight: Number(draft.inputWeight),
      outputWeight: Number(draft.outputWeight),
    }));
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(tracked));
  }, [drafts]);

  const handleMetaChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Keep metadata live in localStorage as the user changes it.
    const nextMeta = { ...meta, [e.target.name]: e.target.value };
    setMeta(nextMeta);
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(nextMeta));
  };

  const handleRollChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Preserve the current roll entry immediately so switching forms doesn't lose the draft.
    const nextRoll = { ...roll, [e.target.name]: e.target.value };
    setRoll(nextRoll);
    localStorage.setItem(ROLL_STATE_STORAGE_KEY, JSON.stringify(nextRoll));
  };

  const waste =
    roll.inputWeight && roll.outputWeight
      ? Number(roll.inputWeight) - Number(roll.outputWeight)
      : 0;

  const handleSaveRoll = () => {
    if (!roll.rollNo || !roll.outputWeight || !roll.inputWidth || !roll.outputWidth) {
      alert("Fill required roll fields before saving. Input weight is optional for Sheet stage.");
      return;
    }

    const nextRoll = {
      ...roll,
      rejection: roll.rejection || "0",
    };

    const nextDrafts = editingIndex !== null
      ? drafts.map((draft, idx) => (idx === editingIndex ? nextRoll : draft))
      : [...drafts, nextRoll];

    setDrafts(nextDrafts);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    setConfirmed(false);
    localStorage.setItem(CONFIRMED_STORAGE_KEY, "false");

    setRoll(emptyRoll);
    setEditingIndex(null);
    localStorage.setItem(ROLL_STATE_STORAGE_KEY, JSON.stringify(emptyRoll));
  };

  const handleEditRoll = (index: number) => {
    const selectedRoll = drafts[index];
    setRoll(selectedRoll);
    setEditingIndex(index);
    setConfirmed(false);
    localStorage.setItem(CONFIRMED_STORAGE_KEY, "false");
  };

  const handleCancelEdit = () => {
    setRoll(emptyRoll);
    setEditingIndex(null);
    localStorage.setItem(ROLL_STATE_STORAGE_KEY, JSON.stringify(emptyRoll));
  };

  const handleRemoveRoll = (index: number) => {
    const nextDrafts = drafts.filter((_, i) => i !== index);
    setDrafts(nextDrafts);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    setConfirmed(false);
    localStorage.setItem(CONFIRMED_STORAGE_KEY, "false");
  };

  const handleConfirm = () => {
    if (drafts.length === 0) {
      alert("Add at least one roll to confirm.");
      return;
    }
    setConfirmed(true);
    localStorage.setItem(CONFIRMED_STORAGE_KEY, "true");
    setMessage(`Confirmed ${drafts.length} roll(s) for submission.`);
  };

  const handleSubmitAll = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!meta.date || !meta.shift || !meta.machine) {
      alert("Fill the shift info before submitting.");
      return;
    }

    if (drafts.length === 0) {
      alert("Add at least one roll before submitting.");
      return;
    }

    if (!confirmed) {
      alert("Confirm the rolls before submitting.");
      return;
    }

    const payload = {
      stage: "SHEET",
      date: meta.date,
      shift: meta.shift,
      machine: meta.machine,
      operator: meta.operator,
      runs: drafts.map((draft) => ({
        code: draft.code,
        inputRollNumber: draft.rollNo,
        inputWeight: Number(draft.inputWeight),
        outputWeight: Number(draft.outputWeight),
        inputWidth: Number(draft.inputWidth),
        outputWidth: Number(draft.outputWidth),
        thickness: Number(draft.thickness || 0),
        density: Number(draft.density || 0),
        tensile: Number(draft.tensile || 0),
        rejection: Number(draft.rejection || 0),
      })),
    };

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/production/create-production`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to submit sheet production");
      }

      const tracked = drafts.map((draft) => ({
        rollNo: draft.rollNo,
        stage: "SHEET",
        code: draft.code,
        inputWeight: Number(draft.inputWeight),
        outputWeight: Number(draft.outputWeight),
      }));
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(tracked));

      setMessage(`Saved ${data.runs ?? drafts.length} roll(s) successfully.`);
      setDrafts([]);
      setRoll({
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
      });
      setConfirmed(false);
      localStorage.removeItem(DRAFTS_STORAGE_KEY);
      localStorage.removeItem(ROLL_STATE_STORAGE_KEY);
      localStorage.setItem(CONFIRMED_STORAGE_KEY, "false");
    } catch (error: any) {
      setMessage(error.message || "Failed to submit sheet production");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitAll} className="grid gap-4 p-4 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold">Sheet Production Form</h2>

      <div className="grid gap-3">
        <div className="text-sm text-gray-500">
          Required fields are marked with <span className="text-red-500">*</span>
        </div>

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
            {shifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Operator <span className="text-red-500">*</span></span>
          <select
            name="operator"
            className="p-3 border rounded-lg"
            value={meta.operator}
            onChange={handleMetaChange}
          >
            <option value="">Select Operator</option>
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
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
            {machines.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold">Add Roll Details</h3>

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
            <span className="text-sm font-medium">Input Weight <span className="text-gray-400">(optional)</span></span>
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
          name="waste"
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveRoll}
            className="bg-black text-white py-3 px-6 rounded-lg"
          >
            {editingIndex !== null ? "Save Roll Changes" : "Add Roll"}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="border border-gray-300 text-gray-700 py-3 px-6 rounded-lg"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Drafted Rolls</h3>
        {drafts.length === 0 ? (
          <p className="text-sm text-gray-500">No rolls added yet.</p>
        ) : (
          <div className="grid gap-3">
            {drafts.map((draft, index) => (
              <div key={`${draft.rollNo}-${index}`} className="flex flex-col gap-2 p-3 border rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Roll {index + 1}: {draft.rollNo}</p>
                    <p className="text-sm text-gray-600">Code: {draft.code || "N/A"}</p>
                  </div>
                  <div className="flex gap-3">
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
                <div className="grid gap-2 md:grid-cols-3 text-sm text-gray-700">
                  <span>Input: {draft.inputWeight} kg</span>
                  <span>Output: {draft.outputWeight} kg</span>
                  <span>Waste: {Number(draft.inputWeight || 0) - Number(draft.outputWeight || 0)} kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={handleConfirm}
          className="bg-blue-600 text-white py-3 rounded-lg"
        >
          Confirm {drafts.length} roll{drafts.length === 1 ? "" : "s"}
        </button>

        <button
          type="submit"
          disabled={submitting || !confirmed}
          className="bg-black text-white py-3 rounded-lg disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit All Rolls"}
        </button>
      </div>

      {message ? (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
          {message}
        </div>
      ) : null}
    </form>
  );
}
