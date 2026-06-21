import { useState, useCallback } from "react";

const KEY = "bunker_ghost_mode";

export function useGhostMode() {
  const [isGhostMode, _set] = useState(() => localStorage.getItem(KEY) === "1");

  const setGhostMode = useCallback((val: boolean) => {
    _set(val);
    localStorage.setItem(KEY, val ? "1" : "0");
  }, []);

  return { isGhostMode, setGhostMode };
}
