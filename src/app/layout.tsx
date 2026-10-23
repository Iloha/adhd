import "./globals.css"
import { AppProvider } from "../context/AppContext"
import { TasksProvider } from "../context/TasksContext"
import DemoBanner from "../components/DemoBanner"
import { createClient } from "../lib/supabase/server"
import { getChildModeChildId } from "../lib/childModeServer"

export const metadata = {
  title: "Task Helper",
  description: "A task helper for kids with ADHD, with parent and child modes.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  const isDemo = data?.claims?.is_anonymous === true
  const childModeChildId = await getChildModeChildId()

  return (
    <html lang="en">
      <body>
        {/* key: when the signed-in user changes, remount so no data or selection leaks between users */}
        <AppProvider key={`${userId ?? "signed-out"}:${childModeChildId ?? "parent"}`}>
          <TasksProvider forcedChildId={childModeChildId}>
            <DemoBanner isDemo={isDemo && !childModeChildId} />
            {children}
          </TasksProvider>
        </AppProvider>
      </body>
    </html>
  )
}
