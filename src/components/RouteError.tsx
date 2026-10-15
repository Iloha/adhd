"use client"

import Button from "./Button"

function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
      <p className="text-gray-500">{error?.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}

export default RouteError
