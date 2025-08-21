"use client"

import { useState, useEffect } from "react"

export default function HomePage() {
  const [totalClaimed, setTotalClaimed] = useState(1247)
  const [walletAddress, setWalletAddress] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState("")
  const [isClaiming, setIsClaiming] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)

  // Load stats (mock)
  useEffect(() => {
    setTotalClaimed(1247)
  }, [])

  const connectWallet = async () => {
    try {
      // Replace with real wallet connection (e.g. wagmi / ethers)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsConnected(true)
      setConnectedAddress(walletAddress)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const handleClaim = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    setIsClaiming(true)
    try {
      // Simulate contract claim with $1.5 fee
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setHasClaimed(true)
      setTotalClaimed((prev) => prev + 1)
    } catch (error) {
      console.error("Claim failed:", error)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col items-center justify-center text-white px-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-400/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-blue-300/20">
          <span className="text-2xl font-bold text-white">P</span>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center tracking-wide">PEOPLEONBASE</h1>
      <p className="text-lg md:text-xl text-blue-100 mb-8 text-center">Claim your airdrop</p>

      <div className="w-full max-w-md mb-12 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Paste your wallet address here..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-4 py-3 bg-blue-400/20 border border-blue-300/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent backdrop-blur-sm"
          />
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={!walletAddress.trim() || isClaiming || hasClaimed}
          className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors duration-200"
        >
          {isClaiming
            ? "Claiming..."
            : !isConnected
            ? "Connect Wallet & Claim ($1.5 fee)"
            : hasClaimed
            ? "Already Claimed"
            : "Claim Airdrop"}
        </button>

        {isConnected && (
          <div className="text-xs text-green-200 text-center">
            Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
          </div>
        )}

        {hasClaimed && (
          <div className="mt-3 text-green-200 font-semibold text-center">
            ✅ Successfully Claimed!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-center space-y-6">
        <div className="text-blue-200 text-sm uppercase tracking-wider">AIRDROP STATS</div>
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-yellow-400">{totalClaimed}</div>
          <div className="text-lg text-blue-200 mt-2">Claimed</div>
        </div>
      </div>
    </div>
  )
}
