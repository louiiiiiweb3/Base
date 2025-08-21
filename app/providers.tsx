"use client"

import type React from "react"

import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base } from "wagmi/chains"
import "@rainbow-me/rainbowkit/styles.css"

const config = getDefaultConfig({
  appName: "People on Base",
  projectId: "YOUR_PROJECT_ID", // Get this from WalletConnect Cloud
  chains: [base],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
