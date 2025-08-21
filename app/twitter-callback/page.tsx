"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { twitterAPI } from "@/lib/twitter-api"

export default function TwitterCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        console.error("Twitter auth error:", error)
        router.push("/?twitter_error=" + error)
        return
      }

      if (code) {
        try {
          await twitterAPI.exchangeCodeForToken(code)
          router.push("/?twitter_connected=true")
        } catch (error) {
          console.error("Token exchange failed:", error)
          router.push("/?twitter_error=token_exchange_failed")
        }
      } else {
        router.push("/?twitter_error=no_code")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-white">Processing Twitter authentication...</p>
      </div>
    </div>
  )
}
