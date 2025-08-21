"use client"

import type React from "react"

// Simple provider wrapper without Web3 dependencies
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
