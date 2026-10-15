import "./globals.css"
import { AppProvider } from "../context/AppContext"

export const metadata = {
  title: "Task Helper",
  description: "A task helper for kids with ADHD, with parent and child modes.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
