import { Children, createContext, useState, useContext } from "react";

const AppContext = createContext(null);

export function AppProvider ({ children }) {
    const [mode, setMode] = useState("child")
    const [activeTaskId, setActiveTaskId] = useState(2);
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