import "./globals.css"
import "../App.css"
import { AppProvider } from "../context/AppContext"
import { TasksProvider } from "../context/TasksContext"
import Header from "../components/Header"

export const metadata = {
  title: "Task Helper",
  description: "A task helper for kids with ADHD, with parent and child modes.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <TasksProvider>
            {children}
            <Header />
          </TasksProvider>
        </AppProvider>
      </body>
    </html>
  )
}
