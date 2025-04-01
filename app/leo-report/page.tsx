"use client";

import React, { useState } from "react";
import { format } from "date-fns";

interface AnimalReportEntry {
  name: string;
  species: string;
  location: string;
  diagnosis?: string;
  chronic?: boolean;
  acute?: boolean;
  stable?: boolean;
  serious?: boolean;
  critical?: boolean;
  notes?: string;
}

export default function LeoDailyReport() {
  const [date] = useState(() => format(new Date(), "MMMM d, yyyy"));

  const mockCriticalCases: AnimalReportEntry[] = [
    {
      name: "Jackie",
      species: "K9S",
      location: "Hospital",
      diagnosis: "Doing Well",
      stable: true,
    },
    {
      name: "Mouse",
      species: "K9N",
      location: "Hospital",
      diagnosis: "Post-radiation, stable",
      stable: true,
    },
    {
      name: "Nick",
      species: "K9N",
      location: "D-2",
      diagnosis: "Malignant melanoma + seizures",
      serious: true,
      critical: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">
        Leo's Daily Report – {date}
      </h1>

      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => {
            import("html2pdf.js").then((html2pdf) => {
              const report = document.body;
              html2pdf
                .default()
                .from(report)
                .set({
                  margin: 0.5,
                  filename: `Leo-Report-${date}.pdf`,
                  html2canvas: { scale: 2 },
                  jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait",
                  },
                })
                .save();
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          📄 Save as PDF
        </button>
        <button
          onClick={() => {
            const reportHTML = document.body.innerHTML;
            fetch("/api/send-leo-report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ html: reportHTML, date }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) alert("✅ Report emailed successfully!");
                else alert("❌ Failed to send email: " + data.error);
              })
              .catch(() => alert("❌ Failed to connect to email server."));
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          📧 Email Report
        </button>
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2 mb-4">
          Critical and Hospitalized Cases
        </h2>
        <div className="space-y-4">
          {mockCriticalCases.map((entry, idx) => (
            <div
              key={idx}
              className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow"
            >
              <div className="flex justify-between">
                <h3 className="text-xl font-semibold">{entry.name}</h3>
                <p className="text-sm text-gray-400">
                  {entry.species} – {entry.location}
                </p>
              </div>
              <p className="mt-2 text-gray-300">
                Diagnosis: {entry.diagnosis}
              </p>
              <div className="mt-2 flex gap-2 text-sm">
                {entry.chronic && (
                  <span className="px-2 py-1 rounded bg-yellow-700">
                    Chronic
                  </span>
                )}
                {entry.acute && (
                  <span className="px-2 py-1 rounded bg-orange-600">
                    Acute
                  </span>
                )}
                {entry.stable && (
                  <span className="px-2 py-1 rounded bg-green-700">
                    Stable
                  </span>
                )}
                {entry.serious && (
                  <span className="px-2 py-1 rounded bg-red-600">
                    Serious
                  </span>
                )}
                {entry.critical && (
                  <span className="px-2 py-1 rounded bg-red-800 font-bold">
                    Critical
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add other report sections here */}
    </div>
  );
}
