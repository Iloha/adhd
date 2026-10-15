"use client"

import { createContext, useState, useContext } from "react";

export const AppContext = createContext(null);

export function AppProvider ({ children }) {
    const [activeTaskId, setActiveTaskId] = useState(null);
    const value = {activeTaskId, setActiveTaskId}

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    return useContext(AppContext);
}
