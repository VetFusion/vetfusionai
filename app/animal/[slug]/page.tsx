"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Animal {
  id: number;
  Name: string;
  Location?: string;
  Species?: string;
  Status?: string;
  Weight?: string;
  SOAP_Date?: string;
  Recheck_Due?: string;
  Current_Meds?: string;
  Case_Summary?: string;
}

export default function AnimalProfile() {
  const params = useParams<{ slug: string }>();
  const { slug } = params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAnimal() {
      const animalName = decodeURIComponent(slug.replace(/-/g, " "));
      const { data, error } = await supabase
        .from("master_tracker")
        .select("*")
        .eq("Name", animalName)
        .single();

      if (error) {
        console.error("Error fetching animal:", error);
        setAnimal(null);
      } else {
        setAnimal(data as Animal);
      }
      setLoading(false);
    }

    fetchAnimal();
  }, [slug]);

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
        Loading animal details...
      </div>
    );

  if (!animal)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
        Animal not found.
        <Link href="/tracker">
          <span className="text-blue-500 hover:underline mt-2">← Back to Tracker</span>
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6">
      <Link href="/tracker">
        <span className="text-blue-500 hover:underline">← Back to Tracker</span>
      </Link>

      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-4">
        <h1 className="text-3xl font-bold mb-4">🐾 {animal.Name}'s Profile</h1>

        <div className="space-y-4">
          {[
            ["📍 Location", animal.Location],
            ["🐶 Species", animal.Species],
            ["📊 Status", animal.Status],
            ["⚖️ Weight", animal.Weight],
            ["📅 SOAP Date", animal.SOAP_Date],
            ["🔔 Recheck Due", animal.Recheck_Due],
            ["💊 Current Medications", animal.Current_Meds],
            ["📜 Case Summary", animal.Case_Summary],
          ].map(([label, value]) => (
            <div key={label}>
              <p><strong>{label}:</strong></p>
              <div className="p-2 border rounded bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white w-full whitespace-pre-wrap">
                {value || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
