"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

const META_STORAGE_KEY = "slitter_meta";
const FORM_STORAGE_KEY = "slitter_form";
const TRACKING_STORAGE_KEY = "production_roll_tracking";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const shifts = ["A", "B", "C"];
const machines = ["Slitter 1", "Slitter 2", "Slitter 3"];
const operators = ["Ramesh", "Suresh", "Amit"];

type Meta = {
  date: string;
  shift: string;
  operator: string;
  machine: string;
};

type SlitterData = {
  code: string;
  inputRollNumber: string;
  inputWeight: string;
  numberOfSlits: string;
  slitWidth: string;
  totalOutputWeight: string;
  rejection: string;
};

export default function SlitterForm() {
  const [meta, setMeta] = useState<Meta>({
    date: "",
    shift: "",
    operator: "",
    machine: "",
  });

  const [form, setForm] = useState<SlitterData>({
    code: "",
    inputRollNumber: "",
    inputWeight: "",
    numberOfSlits: "",
    slitWidth: "",
    totalOutputWeight: "",
    rejection: "",
  });

  const [availableRolls, setAvailableRolls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedMeta = localStorage.getItem(META_STORAGE_KEY);
    if (savedMeta) {
      try {
        const parsed = JSON.parse(savedMeta) as Meta;
        setMeta({
          date: parsed.date || today,
          shift: parsed.shift || "",
          operator: parsed.operator || "",
          machine: parsed.machine || "",
        });
      } catch (error) {
        console.warn("Could not parse saved slitter metadata", error);
        setMeta((prev) => ({ ...prev, date: today }));
      }
    } else {
      setMeta((prev) => ({ ...prev, date: today }));
    }

    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedForm) {
      try {
        setForm(JSON.parse(savedForm));
      } catch (error) {
        console.warn("Could not parse saved slitter form", error);
      }
    }

    const tracking = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (tracking) {
      try {
        const parsed = JSON.parse(tracking) as Array<{ rollNo: string }>;
        setAvailableRolls(parsed.map((item) => item.rollNo));
      } catch (error) {
        console.warn("Could not parse roll tracking data", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const handleMetaChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMeta({
      ...meta,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const waste =
    form.inputWeight && form.totalOutputWeight
      ? Number(form.inputWeight) - Number(form.totalOutputWeight)
      : 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!meta.date || !meta.shift || !meta.machine) {
      alert("Fill date, shift, and machine before submitting.");
      return;
    }

    if (!form.inputRollNumber || !form.inputWeight || !form.totalOutputWeight) {
      alert("Fill input roll number, input weight, and output weight before submitting.");
      return;
    }

    const payload = {
      stage: "SLITTING",
      date: meta.date,
      shift: meta.shift,
      machine: meta.machine,
      operator: meta.operator,
      runs: [
        {
          batchId: `${form.inputRollNumber}-${Date.now()}`,
          inputKg: Number(form.inputWeight),
          outputs: [
            {
              rollNo: form.inputRollNumber,
              width: Number(form.slitWidth || 0),
              measuredWeightKg: Number(form.totalOutputWeight),
              coreWeightKg: 0,
              actualWeightKg: Number(form.totalOutputWeight),
            },
          ],
          trimWasteKg: waste,
          rejectionKg: Number(form.rejection || 0),
        },
      ],
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
        throw new Error(data.error || data.message || "Failed to submit slitter production");
      }

      setMessage(`Saved ${data.runs ?? 1} slitter batch(es) successfully.`);
    } catch (error: any) {
      setMessage(error.message || "Failed to submit slitter production");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-4 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold">Slitter Entry</h2>

      <div className="text-sm text-gray-500">
        Required fields are marked with <span className="text-red-500">*</span>
      </div>

      <div className="grid gap-3">
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
        <h3 className="text-lg font-semibold">Batch Details</h3>

        <input
          name="code"
          value={form.code}
          onChange={handleFormChange}
          placeholder="Product Code"
          className="p-3 border rounded-lg"
        />

        <label className="grid gap-1">
          <span className="text-sm font-medium">Input Roll No <span className="text-red-500">*</span></span>
          <input
            name="inputRollNumber"
            value={form.inputRollNumber}
            onChange={handleFormChange}
            placeholder="Input Roll No"
            className="p-3 border rounded-lg"
            list="slitter-rolls"
          />
        </label>
        <datalist id="slitter-rolls">
          {availableRolls.map((roll) => (
            <option key={roll} value={roll} />
          ))}
        </datalist>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Input Weight <span className="text-red-500">*</span></span>
            <input
              name="inputWeight"
              type="number"
              value={form.inputWeight}
              onChange={handleFormChange}
              placeholder="Input Weight"
              className="p-3 border rounded-lg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Output Weight <span className="text-red-500">*</span></span>
            <input
              name="totalOutputWeight"
              type="number"
              value={form.totalOutputWeight}
              onChange={handleFormChange}
              placeholder="Total Output Weight"
              className="p-3 border rounded-lg"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Slit Width <span className="text-red-500">*</span></span>
            <input
              name="slitWidth"
              type="number"
              value={form.slitWidth}
              onChange={handleFormChange}
              placeholder="Slit Width"
              className="p-3 border rounded-lg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">No. of Slits <span className="text-red-500">*</span></span>
            <input
              name="numberOfSlits"
              type="number"
              value={form.numberOfSlits}
              onChange={handleFormChange}
              placeholder="No. of Slits"
              className="p-3 border rounded-lg"
            />
          </label>
        </div>

        <input
          value={waste}
          disabled
          placeholder="Waste (Auto)"
          className="p-3 border rounded-lg bg-gray-100"
        />

        <input
          name="rejection"
          type="number"
          value={form.rejection}
          onChange={handleFormChange}
          placeholder="Rejection"
          className="p-3 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white py-3 rounded-lg text-lg disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>

      {message ? (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
          {message}
        </div>
      ) : null}
    </form>
  );
}
