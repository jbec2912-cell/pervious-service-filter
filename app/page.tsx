"use client";

import { useMemo, useState } from "react";
import { transformCsv } from "@/utils/transform";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{ url: string; kept: number; dropped: number } | null>(null);

  const fileName = useMemo(() => file?.name ?? "No file chosen", [file]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setMessage("");
    setStatus("idle");
  };

  const onConvert = async () => {
    if (!file) {
      setMessage("Choose a CSV export first.");
      setStatus("error");
      return;
    }
    setStatus("working");
    setMessage("Processing...");
    setResult(null);
    try {
      const { csv, kept, dropped } = await transformCsv(file, { maxYear: 2024, minEquity: -6000 });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      setResult({ url, kept, dropped });
      setMessage(`Created filtered CSV (${kept} kept, ${dropped} dropped).`);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Failed to process file. Make sure it is the quote export CSV.");
    }
  };

  return (
    <div className="card">
      <h1>Previous Service Filter</h1>
      <p>Upload the quote export CSV, apply filters, and download the cleaned Previous Service list.</p>

      <label htmlFor="file">Quote CSV export</label>
      <input id="file" type="file" accept=".csv,text/csv" onChange={handleFile} />
      <p className="muted">Selected: {fileName}</p>

      <div className="flex-row" style={{ marginTop: 10 }}>
        <button onClick={onConvert} disabled={status === "working"}>
          {status === "working" ? "Working..." : "Convert and download"}
        </button>
        {result && (
          <a className="link" href={result.url} download="Previous Service Customer.csv">
            Download CSV
          </a>
        )}
      </div>

      {message && (
        <div className="summary" aria-live="polite">
          <div className="badge">Status</div>
          <div style={{ marginTop: 6 }}>{message}</div>
          {result && (
            <div style={{ marginTop: 6 }}>
              <strong>Kept:</strong> {result.kept} &nbsp; | &nbsp; <strong>Dropped:</strong> {result.dropped}
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: 18, fontSize: 14, color: "#94a3b8" }}>
        Filters: requires first name and phone; drops TradeYear 2025+; drops TradeEquity below -6000. Dates formatted to M/D/YY.
      </p>
    </div>
  );
}
