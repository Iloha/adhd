import Link from "next/link"

/** Small banner shown to demo (anonymous) users. Renders nothing for real accounts. */
function DemoBanner({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null

  return (
    <div role="note" className="bg-amber-100 text-amber-950 text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span><strong>Demo mode</strong> - sample data, it may be reset.</span>
      <Link href="/login" className="font-bold underline underline-offset-2 hover:text-amber-800 py-1">
        Create an account
      </Link>
    </div>
  )
}

export default DemoBanner
