import { Children, createContext, useState, useContext } from "react";

const AppContext = createContext(null);

export function AppProvider ({ children }) {
    const [mode, setMode] = useState("parent")
    const value = {mode, setMode}

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    return useContext(AppContext);
}