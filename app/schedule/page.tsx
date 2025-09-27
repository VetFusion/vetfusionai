"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { addDays, startOfWeek, endOfWeek, format, parseISO, isSameDay } from "date-fns";

type Appt = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  assignee: string | null;
  animal: string | null;
  type: string | null;
};

const AREAS = ["MR","BR","ICU","JH","KR","MC"];

export default function SchedulePage() {
  const [view, setView] = useState<"week"|"day">("week");
  const [when, setWhen] = useState(new Date());
  const [appts, setAppts] = useState<Appt[]>([]);

  useEffect(() => {
    (async () => {
      const from = view === "week" ? startOfWeek(when, { weekStartsOn: 0 }) : when;
      const to = view === "week" ? endOfWeek(when, { weekStartsOn: 0 }) : addDays(when, 1);
      const { data, error } = await supabase
        .from("appointments")
        .select("id, title, start_time, end_time, location, assignee, animal, type")
        .gte("start_time", from.toISOString())
        .lt("start_time", to.toISOString())
        .order("start_time", { ascending: true });
      if (error) console.error(error);
      setAppts(data || []);
    })();
  }, [view, when]);

  const days = useMemo(() => {
    if (view === "day") return [when];
    const s = startOfWeek(when, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [view, when]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold">📅 Schedule</h1>
          <div className="ml-auto flex items-center gap-2">
            <button className={`px-3 py-1 rounded ${view==='day'?'bg-teal-700':'bg-gray-800'}`} onClick={()=>setView("day")}>Day</button>
            <button className={`px-3 py-1 rounded ${view==='week'?'bg-teal-700':'bg-gray-800'}`} onClick={()=>setView("week")}>Week</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {days.map(d => (
          <section key={d.toISOString()}>
            <h2 className="text-lg font-semibold mb-3">{format(d, "EEEE MMM d")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {AREAS.map(area => (
                <div key={area} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{area}</span>
                    <span className="text-xs text-gray-400">Room lane</span>
                  </div>
                  <ul className="space-y-2">
                    {appts
                      .filter(a => (a.location || "").toUpperCase().startsWith(area) && isSameDay(parseISO(a.start_time), d))
                      .map(a => (
                        <li key={a.id} className="p-2 rounded-lg bg-gray-800/60">
                          <div className="text-sm font-medium">{a.title}</div>
                          <div className="text-xs text-gray-300">
                            {format(parseISO(a.start_time), "h:mma")} – {format(parseISO(a.end_time), "h:mma")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {[a.location, a.assignee, a.animal, a.type].filter(Boolean).join(" • ")}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
