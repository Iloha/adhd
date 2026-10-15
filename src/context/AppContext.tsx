"use client"

import { createContext, useState, useContext, type ReactNode } from "react";

interface AppContextValue {
    activeTaskId: string | null
    setActiveTaskId: (id: string | null) => void
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider ({ children }: { children: ReactNode }) {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const value = {activeTaskId, setActiveTaskId}

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error("useApp must be used within an AppProvider")
    return ctx
}
