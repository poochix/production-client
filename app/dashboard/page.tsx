"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

// Dashboard page fetches production data from the backend
// and displays summary results for the selected filter criteria.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const shifts = ["A", "B", "C"];
const stages = ["SHEET", "FILM", "SLITTING"];
const machines = ["Sheet Line 1", "Sheet Line 2"];

export default function Dashboard() {
  const [shiftDay, setShiftDay] = useState("");
  const [shift, setShift] = useState("A");
  const [machine, setMachine] = useState(machines[0]);
  const [stage, setStage] = useState("SHEET");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduction = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        shiftDay,
        shift,
        machine: machine.toLowerCase().trim(),
        stage,
      });

      console.log("querry", query);

      const response = await fetch(`${API_BASE_URL}/api/production/get-Production?${query.toString()}`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || result.error || `Error ${response.status}`);
      }

      const body = await response.json();

      if (!body || Object.keys(body).length === 0) {
        setData(null);
        setError("No production data found for the selected filters.");
      } else {
        setData(body);
      }
    } catch (err: any) {
      setData(null);
      setError(err.message || "Failed to load production data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setShiftDay(today);
  }, []);

  useEffect(() => {
    if (!shiftDay) return;
    fetchProduction();
  }, [shiftDay]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchProduction();
  };

  const summary = data?.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Dashboard</h1>
          <p className="text-sm text-gray-500">Live metrics for the selected production run.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5 bg-white p-4 rounded-2xl shadow">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Shift Date</span>
          <input
            type="date"
            value={shiftDay}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setShiftDay(e.target.value)}
            className="p-3 border rounded-lg"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Shift</span>
          <select
            value={shift}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setShift(e.target.value)}
            className="p-3 border rounded-lg"
          >
            {shifts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Machine</span>
          <select
            value={machine}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setMachine(e.target.value)}
            className="p-3 border rounded-lg"
          >
            {machines.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Stage</span>
          <select
            value={stage}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStage(e.target.value)}
            className="p-3 border rounded-lg"
          >
            {stages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="bg-black text-white py-3 rounded-lg"
        >
          Refresh
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Loading production data…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
          <p className="mt-2 text-sm text-red-600">Try changing the shift, machine or stage.</p>
        </div>
      ) : !summary ? (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-700">
          <p>No production summary found for the selected options.</p>
          <p className="mt-2 text-sm text-yellow-600">Use the refresh button after updating filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard label="Stage" value={stage} />
            <StatusCard label="Shift" value={shift} />
            <StatusCard label="Machine" value={machine} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Total Rolls" value={summary.production.totalRolls} />
            <Card title="Input (kg)" value={summary.production.totalInputKg} />
            <Card title="Output (kg)" value={summary.production.totalOutputKg} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Trim Waste" value={summary.waste.totalTrimWaste} />
            <Card title="Rejection" value={summary.waste.rejectionKg} />
            <Card title="Waste %" value={summary.waste.wastePercent.toFixed(2)} />
            <Card title="Yield %" value={summary.waste.yieldPercent.toFixed(2)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Avg Weight" value={summary.quality.avgWeightPerRoll.toFixed(2)} />
            <Card title="Thickness Avg" value={summary.quality.avgThickness.toFixed(2)} />
            <Card title="Density Avg" value={summary.quality.avgDensity.toFixed(2)} />
            <Card title="Input Width Avg" value={summary.quality.avgInputWidth.toFixed(2)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-semibold">{value}</h2>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border bg-white shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
