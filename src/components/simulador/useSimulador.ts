"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rng, type Rng } from "@/lib/random";
import { useTicker } from "@/lib/useTicker";
import {
  applyShock,
  initialState,
  QUARTERS,
  step,
  type Controls,
  type ShockKind,
  type SimEvent,
  type State,
} from "./simuladorModel";

export type ShockMark = { t: number; kind: ShockKind };

/** Drives the integrated model quarter by quarter with a seeded PRNG. */
export function useSimulador(initial: Controls, { seed: seed0 = 7, speed: speed0 = 0.1 } = {}) {
  const [controls, setControlsState] = useState<Controls>(initial);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const [seed, setSeed] = useState(seed0);
  const [speed, setSpeed] = useState(speed0);
  const rngRef = useRef<Rng>(rng(seed0));
  const statesRef = useRef<State[]>([initialState()]);
  const eventsRef = useRef<SimEvent[]>([]);
  const shocksRef = useRef<ShockMark[]>([]);

  const doStep = useCallback(() => {
    const states = statesRef.current;
    const last = states[states.length - 1];
    if (last.t >= QUARTERS) return;
    const r = rngRef.current;
    const { state, events } = step(last, controlsRef.current, () => r.normal());
    states.push(state);
    eventsRef.current.push(...events);
  }, []);

  const ticker = useTicker(doStep, { speed });
  const states = statesRef.current;
  const current = states[states.length - 1];
  const done = current.t >= QUARTERS;

  const { running, pause } = ticker;
  useEffect(() => {
    if (done && running) pause();
  }, [done, running, pause]);

  const reset = (newSeed = seed) => {
    rngRef.current = rng(newSeed);
    statesRef.current = [initialState()];
    eventsRef.current = [];
    shocksRef.current = [];
    ticker.refresh();
  };

  const setControls = (patch: Partial<Controls>) => {
    setControlsState((c) => {
      const next = { ...c, ...patch };
      // switching to manual starts from the Selic currently in force
      if (patch.taylor === false && c.taylor && patch.selic === undefined) next.selic = statesRef.current[statesRef.current.length - 1].selic;
      return next;
    });
  };

  const shock = (kind: ShockKind) => {
    const st = statesRef.current;
    st[st.length - 1] = applyShock(st[st.length - 1], kind);
    shocksRef.current.push({ t: st[st.length - 1].t, kind });
    ticker.refresh();
  };

  const loadPreset = (c: Controls) => {
    setControlsState(c);
    controlsRef.current = c;
    reset();
    ticker.play();
  };

  return {
    controls,
    setControls,
    seed,
    setSeed: (s: number) => {
      setSeed(s);
      reset(s);
    },
    speed,
    setSpeed,
    states,
    current,
    events: eventsRef.current,
    shocks: shocksRef.current,
    done,
    running: ticker.running,
    toggle: () => {
      if (done) {
        reset();
        ticker.play();
      } else ticker.toggle();
    },
    stepOnce: () => ticker.tick(),
    reset: () => reset(),
    shock,
    loadPreset,
    frame: ticker.frame,
  };
}
