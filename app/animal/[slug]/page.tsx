"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnimalProfilePage() {
  const { slug } = useParams();
  const [animal, setAnimal] = useState(null);

  useEffect(() => {
    fetch("/data/master-tracker.json")
      .then((res) => res.json())
      .then((data) => {
        const match = data.find((a) =>
          a.Name.toLowerCase().replace(/\s+/g, "-") === slug
        );
        setAnimal(match);
      });
  }, [slug]);

  if (!animal) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">🐾 {animal.Name}'s Full Profile</h1>
      <p className="text-sm text-gray-600">/animal/{slug}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <p><strong>📍 Location:</strong> {animal.Location}</p>
        <p><strong>🐾 Species:</strong> {animal.Species}</p>
        <p><strong>📊 Status:</strong> {animal.Status}</p>
        <p><strong>⚖️ Weight:</strong> {animal.Weight}</p>
        <p><strong>🗓 SOAP Date:</strong> {animal["SOAP Date"]}</p>
        <p><strong>📅 Recheck Due:</strong> {animal["Recheck Due"]}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">💊 Medications</h2>
        <p className="whitespace-pre-line bg-gray-100 p-4 rounded text-sm leading-relaxed">
          {animal["Current Meds"] || "No current medications listed."}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">🧠 Case Summary</h2>
        <p className="whitespace-pre-line bg-gray-100 p-4 rounded text-sm leading-relaxed">
          {animal["Case Summary"] || "No case summary available."}
        </p>
      </div>

      <div className="mt-8">
        <a href="/tracker" className="text-blue-600 hover:underline text-sm">← Back to Tracker</a>
      </div>
    </div>
  );
}
