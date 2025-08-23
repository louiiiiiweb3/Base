"use client"

import { useState, useEffect } from "react"
import AirdropPage from "@/components/airdrop-page"
import AirdropPage from "@/components/Launchpad-page"

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

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      <AirdropPage
        isConnected={isConnected}
        connectedAddress={connectedAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        isConnecting={isConnecting}
      />
    </div>
  )
}
