"use client"

import { useState } from "react"
import { Rocket, Image as ImageIcon, Wallet, CheckCircle, Copy } from "lucide-react"

const LAUNCHPAD_CONTRACT = "0x1234567890abcdef1234567890abcdef12345678"
const CHAIN_ID = "0xe708" // Linea Mainnet

function isValidEthereumAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim())
}

interface LaunchpadForm {
  tokenName: string
  tokenSymbol: string
  description: string
  supply: string
  liquidity: string
  image: string | null
}

interface LaunchpadPageProps {
  isConnected: boolean
  connectedAddress: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
}

export default function LaunchpadPage({
  isConnected,
  connectedAddress,
  connectWallet,
  disconnectWallet,
  isConnecting,
}: LaunchpadPageProps) {
  const [form, setForm] = useState<LaunchpadForm>({
    tokenName: "",
    tokenSymbol: "",
    description: "",
    supply: "",
    liquidity: "",
    image: null,
  })
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)
  const [copied, setCopied] = useState(false)
  const [launchStatus, setLaunchStatus] = useState<{
    sending: boolean
    txHash?: string
    error?: string
    success?: boolean
  }>({ sending: false })

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(connectedAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string)
        setForm((prev) => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleLaunch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!window.ethereum) {
      alert("No wallet detected")
      return
    }
    if (
      !form.tokenName || !form.tokenSymbol || !form.description ||
      !form.supply || !form.liquidity ||
      !isValidEthereumAddress(connectedAddress)
    ) {
      alert("Fill in all fields and connect wallet")
      return
    }

    setLaunched(true)
    setLaunchStatus({ sending: true })

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      })

      const tokenData = JSON.stringify(form)
      const data = "0x" + Buffer.from(tokenData).toString("hex")

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAddress,
            to: LAUNCHPAD_CONTRACT,
            value: "0x0",
            data: data,
            gas: "0x2dc6c0", // example gas
          },
        ],
      })
      setLaunchStatus({ sending: false, txHash, success: true })
      setTimeout(() => {
        setForm({
          tokenName: "",
          tokenSymbol: "",
          description: "",
          supply: "",
          liquidity: "",
          image: null,
        })
        setPreviewImageUrl(null)
        setLaunched(false)
        setLaunchStatus({ sending: false })
      }, 3800)
    } catch (err: any) {
      setLaunchStatus({ sending: false, error: err?.message || "Transaction failed" })
      setTimeout(() => {
        setLaunched(false)
        setLaunchStatus({ sending: false })
      }, 3800)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-800 via-purple-900 to-slate-900 px-2">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900/90 border-2 border-pink-400/40 shadow-2xl px-8 py-10 backdrop-blur-lg flex flex-col items-center relative">
        <div className="absolute left-6 top-8 text-pink-300/80 animate-bounce">
          <Rocket className="w-8 h-8" />
        </div>
        <h1 className="text-center text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-pink-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
          🚀 Launchpad.fun
        </h1>

        {/* Wallet Section */}
        {isConnected ? (
          <div className="mb-6 flex items-center gap-3">
            <div className="px-3 py-2 bg-green-500/20 rounded-lg border border-green-300/30 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-200" />
              <span className="text-green-100 text-sm">
                Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
              <button onClick={copyToClipboard} className="ml-2 p-1 rounded hover:bg-green-200/20">
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-green-300" />}
              </button>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-3 py-2 bg-pink-500/10 hover:bg-pink-500/30 rounded-lg text-pink-100 text-xs font-bold transition duration-200"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="mb-6 px-6 py-3 bg-pink-500 hover:bg-pink-400 rounded-lg font-bold text-pink-900 text-lg shadow-lg border-pink-400 border transition"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        {/* Form */}
        <form className="w-full space-y-5" onSubmit={handleLaunch}>
          {/* Token Inputs */}
          {/* ... same as before, but using connectedAddress to enable/disable */}
        </form>

        {/* Preview */}
        {/* ... same as before */}

        {/* Launch Modal */}
        {launched && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
            {/* Modal content unchanged */}
          </div>
        )}
      </div>
    </div>
  )
}
