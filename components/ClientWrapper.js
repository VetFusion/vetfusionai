"use client";
import { useEffect, useState } from "react";

export default function ClientWrapper({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready ? children : null;
}

