"use client"

import { useState } from "react"
import { Rocket, Image as ImageIcon, Wallet, CheckCircle, Copy } from "lucide-react"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      on: (event: string, callback: (val: any) => void) => void
      removeListener: (event: string, callback: (val: any) => void) => void
    }
  }
}

// Replace this with your Launchpad Factory Contract Address
const LAUNCHPAD_CONTRACT = "0x1234567890abcdef1234567890abcdef12345678"
const CHAIN_ID = "0xe708" // Linea Mainnet; change if you deploy elsewhere

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

export default function LaunchpadPage() {
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
  const [walletAddress, setWalletAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [launchStatus, setLaunchStatus] = useState<{
    sending: boolean
    txHash?: string
    error?: string
    success?: boolean
  }>({ sending: false })

  // Wallet connect
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask/Coinbase wallet not detected!")
      return
    }
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setWalletAddress(accounts[0])
    } catch (err) { }
    setIsConnecting(false)
  }

  // Copy address
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  // Monitor wallet changes
  if (typeof window !== "undefined" && window.ethereum && walletAddress) {
    window.ethereum.on?.("accountsChanged", (accs: string[]) => {
      if (accs?.length > 0) setWalletAddress(accs)
    })
  }

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.
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
    // Input checks
    if (
      !form.tokenName || !form.tokenSymbol || !form.description ||
      !form.supply || !form.liquidity ||
      !isValidEthereumAddress(walletAddress)
    ) {
      alert("Fill in all fields and connect wallet")
      return
    }

    setLaunched(true)
    setLaunchStatus({ sending: true })

    try {
      // Switch to chain if not already
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      })

      // Dummy token data encoding (replace with proper ABI/call for your contract)
      const tokenData = JSON.stringify({
        tokenName: form.tokenName,
        tokenSymbol: form.tokenSymbol,
        description: form.description,
        supply: form.supply,
        liquidity: form.liquidity,
        image: form.image,
      })
      // Example hex encoding for calldata (for real contract use ABI.encode)
      const data = "0x" + Buffer.from(tokenData).toString("hex")

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: LAUNCHPAD_CONTRACT,
            value: "0x0",
            data: data,
            gas: "0x2dc6c0", // 3000000, just example
          },
        ],
      })
      setLaunchStatus({ sending: false, txHash, success: true })
      // Reset form after 3s
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
        setLaunchStatus({})
      }, 3800)
    } catch (err: any) {
      setLaunchStatus({ sending: false, error: err?.message || "Transaction failed" })
      setTimeout(() => {
        setLaunched(false)
        setLaunchStatus({})
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
        <p className="mb-7 text-center text-pink-200 text-lg font-semibold">
          Launch your token in seconds.<br />
          No presale. No dev. Just memes.<br />
          Built on Linea.
        </p>

        {/* WALLET SECTION */}
        {walletAddress ? (
          <div className="mb-6 flex items-center gap-3">
            <div className="px-3 py-2 bg-green-500/20 rounded-lg border border-green-300/30 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-200" />
              <span className="text-green-100 text-sm">
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-1 rounded hover:bg-green-200/20"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-green-300" />}
              </button>
            </div>
            <button
              onClick={() => setWalletAddress("")}
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

        {/* FORM */}
        <form
          className="w-full space-y-5"
          onSubmit={handleLaunch}
        >
          <div>
            <label className="block text-pink-100 font-bold mb-1">Token Name</label>
            <input
              name="tokenName"
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-300/30 text-pink-100 focus:outline-none focus:border-pink-300"
              placeholder="E.g. PUMPY"
              value={form.tokenName}
              onChange={handleInput}
              required
              disabled={!walletAddress || launched}
            />
          </div>
          <div>
            <label className="block text-pink-100 font-bold mb-1">Token Symbol</label>
            <input
              name="tokenSymbol"
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-300/30 text-pink-100 focus:outline-none focus:border-pink-300"
              placeholder="E.g. PUMP"
              value={form.tokenSymbol}
              onChange={handleInput}
              required
              maxLength={6}
              disabled={!walletAddress || launched}
            />
          </div>
          <div>
            <label className="block text-pink-100 font-bold mb-1">Description</label>
            <textarea
              name="description"
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-300/30 text-pink-100 focus:outline-none focus:border-pink-300"
              placeholder="Your meme story"
              value={form.description}
              onChange={handleInput}
              required
              rows={3}
              disabled={!walletAddress || launched}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-pink-100 font-bold mb-1">Total Supply</label>
              <input
                name="supply"
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-300/30 text-pink-100 focus:outline-none focus:border-pink-300"
                placeholder="E.g. 420690000"
                value={form.supply}
                onChange={handleInput}
                required
                type="number"
                min="1"
                disabled={!walletAddress || launched}
              />
            </div>
            <div className="flex-1">
              <label className="block text-pink-100 font-bold mb-1">Initial Liquidity (ETH)</label>
              <input
                name="liquidity"
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-300/30 text-pink-100 focus:outline-none focus:border-pink-300"
                placeholder="E.g. 0.05"
                value={form.liquidity}
                onChange={handleInput}
                required
                type="number"
                min="0"
                step="0.0001"
                disabled={!walletAddress || launched}
              />
            </div>
          </div>
          <div>
            <label className="block text-pink-100 font-bold mb-1">Token Image</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="token-image-upload"
                onChange={handleImageUpload}
                disabled={!walletAddress || launched}
              />
              <label
                htmlFor="token-image-upload"
                className={`p-2 px-4 bg-pink-500/30 rounded shadow-lg font-bold text-pink-200 hover:bg-pink-500/50 transition-all cursor-pointer flex items-center gap-2 ${launched ? "opacity-70 pointer-events-none" : ""}`}
              >
                <ImageIcon className="w-5 h-5" />
                {previewImageUrl ? "Change" : "Upload"}
              </label>
              {previewImageUrl && (
                <img
                  src={previewImageUrl}
                  className="w-12 h-12 rounded-full shadow-lg border-2 border-pink-300 object-cover"
                  alt="Token preview"
                />
              )}
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-4 bg-gradient-to-r from-pink-500 via-yellow-300 to-red-500 rounded-lg font-bold text-lg text-black shadow-lg hover:scale-105 transition-transform duration-200 animate-bounce ${(!walletAddress || launched) ? "opacity-60 pointer-events-none" : ""}`}
              disabled={!walletAddress || launched}
            >
              🚀 LAUNCH TOKEN
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-10 w-full px-4 py-8 rounded-xl bg-black/20 border border-pink-300/20 shadow-lg space-y-3 flex flex-col items-center">
          <h3 className="font-bold text-pink-200 text-lg mb-2 tracking-wide">Live Preview</h3>
          <div className="flex items-center gap-4">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={form.tokenName || "Token"}
                className="w-16 h-16 rounded-full border-2 border-pink-300 shadow-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-pink-300 bg-pink-400/30 flex items-center justify-center">
                <ImageIcon className="w-9 h-9 text-pink-300 opacity-60" />
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-pink-100">
                {form.tokenName || "Token Name"} <span className="text-pink-200">[{form.tokenSymbol || "TKN"}]</span>
              </div>
              <div className="text-pink-200 text-sm">{form.description || "Your meme token description..."}</div>
              <div className="pt-2 flex gap-6 items-center text-pink-400">
                <span>Supply: <span className="font-bold">{form.supply || "??"}</span></span>
                <span>Liquidity: <span className="font-bold">{form.liquidity || "??"} ETH</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Modal */}
        {launched && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-pink-700 via-yellow-400 to-red-800 rounded-2xl shadow-xl px-8 py-12 flex flex-col items-center border-4 border-pink-400 animate-pulse">
              <Rocket className="w-16 h-16 text-pink-300 mb-4 animate-bounce" />
              <h3 className="text-3xl font-bold text-black mb-3">
                {launchStatus.sending
                  ? "Launching..."
                  : launchStatus.error
                  ? "Error"
                  : launchStatus.success
                  ? "Success!" : ""}
              </h3>
              {launchStatus.sending && (
                <p className="text-lg text-black font-semibold">Your meme token is being blasted off! 🚀</p>
              )}
              {launchStatus.txHash && (
                <p className="text-green-800 font-bold mt-2">TX Hash:<br />
                  <span className="text-black text-xs">{launchStatus.txHash.slice(0, 12)}...{launchStatus.txHash.slice(-8)}</span>
                </p>
              )}
              {launchStatus.error && (
                <p className="text-pink-900 font-bold mt-2">{launchStatus.error}</p>
              )}
              <p className="text-pink-700 font-bold mt-2">(This is a demo preview!)</p>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .animate-bounce {
          animation: bounce 1.8s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-16px); }
          60% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
