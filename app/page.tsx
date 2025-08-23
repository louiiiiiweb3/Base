"use client"

import { useState, useEffect } from "react"
import AirdropPage from "@/components/airdrop-page"
import KaitoPage from "@/components/kaito-page"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (accounts: string[]) => void) => void
      removeListener: (event: string, callback: (accounts: string[]) => void) => void
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
    }
  }
}

const LINEA_CHAIN_ID = "0xe708" // Linea mainnet chain ID (59144)
const LOGO_URL = "https://i.ibb.co/rRxLFDwh/Chat-GPT-Image-Aug-23-2025-01-22-50-PM.png"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<"airdrop" | "kaito">("airdrop")
  const [isConnected, setIsConnected] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    checkWalletConnection()
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setConnectedAddress(accounts[0])
          setIsConnected(true)
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        }
      }
    }
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined") {
      alert("Wallet connection is only available in browser environment")
      return
    }

    if (!window.ethereum) {
      alert("Please install MetaMask, Coinbase Wallet, or another Web3 wallet to connect")
      return
    }

    setIsConnecting(true)
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setConnectedAddress(accounts[0])
        setIsConnected(true)

        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LINEA_CHAIN_ID }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: LINEA_CHAIN_ID,
                    chainName: "Linea",
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://rpc.linea.build"],
                    blockExplorerUrls: ["https://lineascan.build"],
                  },
                ],
              })
            } catch (addError) {
              console.error("Failed to add Linea network:", addError)
              alert("Please manually add Linea network to your wallet")
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      if (error.code === 4001) {
        alert("Wallet connection was rejected by user")
      } else {
        alert("Failed to connect wallet. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setConnectedAddress("")
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <div className={`relative z-20 backdrop-blur-sm border-emerald-500 border-b-2
        ${currentPage === "kaito" ? "bg-black" : "bg-transparent"}
      `}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo added here */}
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-10 w-10 rounded-full shadow-md"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text gap-0 leading-7 text-transparent shadow-none">
                LineaWaves 
              </h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => setCurrentPage("airdrop")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 font-bold bg-sky-600 ${
                    currentPage === "airdrop"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-300 hover:text-white hover:bg-purple-600/20"
                  }`}
                >
                  Airdrop
                </button>
                <button
                  onClick={() => setCurrentPage("kaito")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 font-bold bg-cyan-600 ${
                    currentPage === "kaito"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-300 hover:text-white hover:bg-purple-600/20"
                  }`}
                >
                  {"Waves"}
                </button>
              </nav>
            </div>

            {/* Wallet Status in Header */}
            {isConnected && (
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/30">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300 font-bold">
                  {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      {currentPage === "airdrop" ? (
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
          <AirdropPage
            isConnected={isConnected}
            connectedAddress={connectedAddress}
            connectWallet={connectWallet}
            disconnectWallet={disconnectWallet}
            isConnecting={isConnecting}
          />
        </div>
      ) : (
        <KaitoPage
          isConnected={isConnected}
          connectedAddress={connectedAddress}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          isConnecting={isConnecting}
        />
      )}
    </div>
  )
}
