"use client"

import { useEffect, useState } from "react"
import { createClient } from "./supabase/client"
import type { Account } from "../components/AccountMenu"

const SIGNED_OUT: Account = { email: null, isAnonymous: false }

/** The signed-in user's email and demo flag, for display only (access is enforced by RLS). */
export function useAccount(): Account {
  const [account, setAccount] = useState<Account>(SIGNED_OUT)

  useEffect(() => {
    const supabase = createClient()
    const read = (user: { email?: string; is_anonymous?: boolean } | undefined) =>
      setAccount(user ? { email: user.email ?? null, isAnonymous: user.is_anonymous === true } : SIGNED_OUT)

    supabase.auth.getSession().then(({ data }) => read(data.session?.user))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => read(session?.user))
    return () => data.subscription.unsubscribe()
  }, [])

  return account
}
