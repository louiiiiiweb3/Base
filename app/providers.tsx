"use client"

import type React from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createConfig, http } from "wagmi"
import { base, linea } from "wagmi/chains"
import { injected, metaMask } from "wagmi/connectors"

const config = createConfig({
  chains: [base, linea],
  connectors: [injected(), metaMask()],
  transports: {
    [base.id]: http(),
    [linea.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
