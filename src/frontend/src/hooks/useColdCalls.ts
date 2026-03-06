import { useCallback, useState } from "react";

export enum CallStatus {
  voicemail = "voicemail",
  noAnswer = "noAnswer",
  interested = "interested",
  notInterested = "notInterested",
  appointments = "appointments",
  purchased = "purchased",
}

export interface ColdCallEntry {
  id: string;
  status: CallStatus;
  contactName: string;
  createdAt: number;
  callDate: string;
  company: string;
  notes?: string;
  phone: string;
  appointmentTime?: string;
  meetingLocation?: string;
}

export interface ColdCallEntryInput {
  status: CallStatus;
  contactName: string;
  callDate: string;
  company: string;
  notes?: string;
  phone: string;
  appointmentTime?: string;
  meetingLocation?: string;
}

const STORAGE_KEY = "hotbox_cold_calls";

function loadFromStorage(): ColdCallEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ColdCallEntry[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: ColdCallEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useColdCalls() {
  const [entries, setEntries] = useState<ColdCallEntry[]>(() =>
    loadFromStorage(),
  );

  const addEntry = useCallback((input: ColdCallEntryInput): ColdCallEntry => {
    const entry: ColdCallEntry = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    };
    setEntries((prev) => {
      const next = [entry, ...prev];
      saveToStorage(next);
      return next;
    });
    return entry;
  }, []);

  const updateEntry = useCallback(
    (id: string, input: ColdCallEntryInput): ColdCallEntry => {
      let updated: ColdCallEntry | undefined;
      setEntries((prev) => {
        const next = prev.map((e) => {
          if (e.id === id) {
            updated = { ...e, ...input };
            return updated;
          }
          return e;
        });
        saveToStorage(next);
        return next;
      });
      if (!updated) throw new Error("Entry not found");
      return updated;
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  return { entries, addEntry, updateEntry, deleteEntry };
}
