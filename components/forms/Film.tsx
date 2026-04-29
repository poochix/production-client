"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

const META_STORAGE_KEY = "film_meta";
const FORM_STORAGE_KEY = "film_form";
const TRACKING_STORAGE_KEY = "production_roll_tracking";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const shifts = ["A", "B", "C"];
const machines = ["Sheet Line 1", "Sheet Line 2"];
const operators = ["Ramesh", "Suresh", "Amit"];

type Meta = {
  date: string;
  shift: string;
  operator: string;
  machine: string;
};

type FilmData = {
  code: string;
  inputRollNumber: string;
  inputWeight: string;
  inputWidth: string;
  outputWeight: string;
  outputWidth: string;
  thickness: string;
  density: string;
  tensile: string;
  rejection: string;
};

export default function FilmForm() {
  const [meta, setMeta] = useState<Meta>({
    date: "",
    shift: "",
    operator: "",
    machine: "",
  });

  const [form, setForm] = useState<FilmData>({
    code: "",
    inputRollNumber: "",
    inputWeight: "",
    inputWidth: "",
    outputWeight: "",
    outputWidth: "",
    thickness: "",
    density: "",
    tensile: "",
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
        console.warn("Could not parse saved film metadata", error);
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
        console.warn("Could not parse saved film form", error);
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
    form.inputWeight && form.outputWeight
      ? Number(form.inputWeight) - Number(form.outputWeight)
      : 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!meta.date || !meta.shift || !meta.machine) {
      alert("Fill date, shift, and machine before submitting.");
      return;
    }

    if (!form.inputRollNumber || !form.outputWeight) {
      alert("Fill input roll number and output weight before submitting.");
      return;
    }

    const payload = {
      stage: "FILM",
      date: meta.date,
      shift: meta.shift,
      machine: meta.machine,
      operator: meta.operator,
      runs: [
        {
          code: form.code,
          inputRollNumber: form.inputRollNumber,
          inputWeight: Number(form.inputWeight || 0),
          inputWidth: Number(form.inputWidth || 0),
          outputWeight: Number(form.outputWeight || 0),
          outputWidth: Number(form.outputWidth || 0),
          thickness: Number(form.thickness || 0),
          density: Number(form.density || 0),
          tensile: Number(form.tensile || 0),
          rejection: Number(form.rejection || 0),
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
        throw new Error(data.error || data.message || "Failed to submit film production");
      }

      const tracked = [
        {
          rollNo: form.inputRollNumber,
          stage: "FILM",
          code: form.code,
          inputWeight: Number(form.inputWeight || 0),
          outputWeight: Number(form.outputWeight || 0),
        },
      ];
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(tracked));

      setMessage(`Saved ${data.runs ?? 1} film roll(s) successfully.`);
    } catch (error: any) {
      setMessage(error.message || "Failed to submit film production");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-4 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold">Film Entry</h2>

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
        <h3 className="text-lg font-semibold">Roll Details</h3>

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
            list="film-rolls"
          />
        </label>
        <datalist id="film-rolls">
          {availableRolls.map((roll) => (
            <option key={roll} value={roll} />
          ))}
        </datalist>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="inputWidth"
            value={form.inputWidth}
            onChange={handleFormChange}
            placeholder="Input Width"
            className="p-3 border rounded-lg"
          />
          <input
            name="outputWidth"
            value={form.outputWidth}
            onChange={handleFormChange}
            placeholder="Output Width"
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="thickness"
            value={form.thickness}
            onChange={handleFormChange}
            placeholder="Thickness"
            className="p-3 border rounded-lg"
          />
          <input
            name="density"
            value={form.density}
            onChange={handleFormChange}
            placeholder="Density"
            className="p-3 border rounded-lg"
          />
        </div>

        <input
          name="tensile"
          value={form.tensile}
          onChange={handleFormChange}
          placeholder="Tensile Strength"
          className="p-3 border rounded-lg"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Input Weight <span className="text-gray-400">(optional)</span></span>
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
              name="outputWeight"
              type="number"
              value={form.outputWeight}
              onChange={handleFormChange}
              placeholder="Output Weight"
              className="p-3 border rounded-lg"
            />
          </label>
        </div>

        <input
          name="rejection"
          type="number"
          value={form.rejection}
          onChange={handleFormChange}
          placeholder="Rejection"
          className="p-3 border rounded-lg"
        />

        <input
          value={waste}
          disabled
          placeholder="Waste (Auto)"
          className="p-3 border rounded-lg bg-gray-100"
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
