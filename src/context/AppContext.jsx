import { Children, createContext, useState, useContext } from "react";

export const AppContext = createContext(null);

export function AppProvider ({ children }) {
    const [mode, setMode] = useState("child")
    const [activeTaskId, setActiveTaskId] = useState(null);
    const value = {mode, setMode, activeTaskId, setActiveTaskId}

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    return useContext(AppContext);
}