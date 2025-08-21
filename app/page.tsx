"use client"

import { useState, useEffect } from "react"

export default function HomePage() {
  const [totalClaimed, setTotalClaimed] = useState(1247)
  const [walletAddress, setWalletAddress] = useState("")
  const [checkResult, setCheckResult] = useState<"eligible" | "ineligible" | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState("")

  // Simulate initial stat fetch
  useEffect(() => {
    setTotalClaimed(1247)
  }, [])

  const connectWallet = async () => {
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock wallet address
    const mockAddress = "0x" + Math.random().toString(16).substr(2, 40)
    setConnectedAddress(mockAddress)
    setIsConnected(true)
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setConnectedAddress("")
    setCheckResult(null)
    setHasClaimed(false)
  }

  const checkAirdrop = async () => {
    if (!walletAddress.trim()) return
    setIsChecking(true)
    setCheckResult(null)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock eligibility check based on wallet address
    const isEligible = walletAddress.toLowerCase().includes("e") || Math.random() > 0.4
    setCheckResult(isEligible ? "eligible" : "ineligible")

    setIsChecking(false)
  }

  const handleClaim = async () => {
    if (!isConnected) {
      // Prompt to connect wallet
      await connectWallet()
      return
    }

    setIsClaiming(true)
    try {
      // Simulate contract call with $1.5 fee
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

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-blue-100 mb-8 text-center">Check your wallet eligibility</p>

      <div className="mb-6">
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-lg font-semibold transition-colors duration-200 backdrop-blur-sm border border-blue-300/20"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-300/30">
              <span className="text-green-100 text-sm">
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-100 text-sm transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md mb-12 space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter wallet address to check eligibility"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-4 py-3 bg-blue-400/20 border border-blue-300/30 rounded-lg placeholder-blue-200 text-white backdrop-blur-sm focus:outline-none focus:border-blue-300/50"
          />
        </div>

        <button
          onClick={checkAirdrop}
          disabled={!walletAddress.trim() || isChecking}
          className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors duration-200 backdrop-blur-sm border border-blue-300/20"
        >
          {isChecking ? "Checking..." : "Check Airdrop"}
        </button>

        {checkResult && (
          <div
            className={`p-4 rounded-lg backdrop-blur-sm border ${
              checkResult === "eligible"
                ? "bg-green-500/20 border-green-300/30 text-green-100"
                : "bg-red-500/20 border-red-300/30 text-red-100"
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                {checkResult === "eligible" ? "🎉 Eligible!" : "❌ Not Eligible"}
              </div>
              <div className="text-sm">
                {checkResult === "eligible"
                  ? "Your wallet is eligible for the airdrop!"
                  : "Your wallet is not eligible for this airdrop."}
              </div>

              {checkResult === "eligible" && !hasClaimed && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-green-200 mb-2">Claim fee: $1.5 (paid on Base network)</div>
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="px-6 py-2 bg-green-500 hover:bg-green-400 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors duration-200"
                  >
                    {isClaiming
                      ? isConnected
                        ? "Claiming..."
                        : "Connect & Claim"
                      : isConnected
                        ? "Claim Airdrop"
                        : "Connect Wallet to Claim"}
                  </button>
                </div>
              )}

              {hasClaimed && <div className="mt-3 text-green-200 font-semibold">✅ Successfully Claimed!</div>}
            </div>
          </div>
        )}
      </div>

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
