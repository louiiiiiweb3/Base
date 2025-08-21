"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Twitter, TrendingUp, Coins, Award, Star, Zap } from "lucide-react"
import { twitterAPI, type TwitterUser, type TwitterMetrics } from "@/lib/twitter-api"
import { TipCoinPointSystem, type TweetMetrics, type PointCalculation } from "@/lib/tipcoin-points"

interface KaitoPageProps {
  isConnected: boolean
  connectedAddress: string
  connectWallet: () => void
  disconnectWallet: () => void
  isConnecting: boolean
}

export default function KaitoPage({
  isConnected,
  connectedAddress,
  connectWallet,
  disconnectWallet,
  isConnecting,
}: KaitoPageProps) {
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null)
  const [twitterMetrics, setTwitterMetrics] = useState<TwitterMetrics | null>(null)
  const [isTwitterConnected, setIsTwitterConnected] = useState(false)
  const [isLoadingTwitter, setIsLoadingTwitter] = useState(false)
  const [engagementScore, setEngagementScore] = useState(0)
  const [earnedTokens, setEarnedTokens] = useState(0)
  const [weeklyPoints, setWeeklyPoints] = useState(0)
  const [exampleCalculation, setExampleCalculation] = useState<PointCalculation | null>(null)

  const [userStats, setUserStats] = useState({
    totalEarned: 0,
    weeklyEarned: 0,
    rank: 0,
    engagementScore: 0,
    twitterFollowers: 0,
    totalTweets: 0,
    retweets: 0,
    likes: 0,
  })

  const [leaderboard] = useState([
    { rank: 1, address: "0x1234...5678", earned: 15420.8, score: 9.8 },
    { rank: 2, address: "0x2345...6789", earned: 12350.4, score: 9.6 },
    { rank: 3, address: "0x3456...7890", earned: 10890.2, score: 9.4 },
    { rank: 4, address: "0x4567...8901", earned: 9876.5, score: 9.2 },
    { rank: 5, address: "0x5678...9012", earned: 8765.3, score: 9.0 },
  ])

  useEffect(() => {
    const checkTwitterAuth = async () => {
      if (twitterAPI.isAuthenticated()) {
        setIsTwitterConnected(true)
        await loadTwitterData()
      }
    }
    checkTwitterAuth()
  }, [])

  useEffect(() => {
    // Generate example calculation on component mount
    const example = TipCoinPointSystem.generateExampleCalculation()
    setExampleCalculation(example)
  }, [])

  const loadTwitterData = async () => {
    try {
      setIsLoadingTwitter(true)

      // Get user profile
      const user = await twitterAPI.getUserProfile()
      setTwitterUser(user)

      // Get user metrics
      const metrics = await twitterAPI.getUserMetrics(user.id)
      setTwitterMetrics(metrics)

      // Mock tweet data for demonstration (in real implementation, this would come from Twitter API)
      const mockTweets: TweetMetrics[] = [
        {
          views: metrics.tweets * 50, // Estimate views
          likes: metrics.likes,
          replies: Math.floor(metrics.likes * 0.1),
          quotes: Math.floor(metrics.retweets * 0.3),
          retweets: metrics.retweets,
          type: "original",
          has_tip_hashtag: true,
        },
        {
          views: metrics.tweets * 30,
          likes: Math.floor(metrics.likes * 0.6),
          replies: Math.floor(metrics.likes * 0.05),
          quotes: Math.floor(metrics.retweets * 0.2),
          retweets: Math.floor(metrics.retweets * 0.7),
          type: "tipped_quote",
          has_tip_hashtag: true,
        },
      ]

      const weeklyPointsCalculated = TipCoinPointSystem.calculateWeeklyPoints(mockTweets, {
        original_tweets: 3,
        tipped_quotes: 5,
        tipped_replies: 8,
        max_original_tweets: 5,
        max_tipped_quotes: 10,
        max_tipped_replies: 15,
      })

      setWeeklyPoints(weeklyPointsCalculated)

      // Convert points to tokens (1000 points = 1 KAITO token for example)
      const tokensEarned = weeklyPointsCalculated / 1000

      setEngagementScore(Math.min(10, weeklyPointsCalculated / 100000)) // Scale to 0-10
      setEarnedTokens(tokensEarned)

      // Update user stats with TipCoin system data
      setUserStats({
        totalEarned: tokensEarned * 4, // Simulate total over multiple weeks
        weeklyEarned: tokensEarned,
        rank: Math.floor(Math.random() * 100) + 1,
        engagementScore: Math.min(10, weeklyPointsCalculated / 100000),
        twitterFollowers: user.followers_count,
        totalTweets: metrics.tweets,
        retweets: metrics.retweets,
        likes: metrics.likes,
      })
    } catch (error) {
      console.error("Failed to load Twitter data:", error)
    } finally {
      setIsLoadingTwitter(false)
    }
  }

  const handleTwitterConnect = async () => {
    try {
      setIsLoadingTwitter(true)
      const authURL = await twitterAPI.initiateAuth()
      window.location.href = authURL
    } catch (error) {
      console.error("Twitter connection failed:", error)
      setIsLoadingTwitter(false)
    }
  }

  const handleTwitterDisconnect = () => {
    twitterAPI.logout()
    setIsTwitterConnected(false)
    setTwitterUser(null)
    setTwitterMetrics(null)
    setEngagementScore(0)
    setEarnedTokens(0)
    setWeeklyPoints(0)
    setExampleCalculation(null)
    // Reset to default stats
    setUserStats({
      totalEarned: 0,
      weeklyEarned: 0,
      rank: 0,
      engagementScore: 0,
      twitterFollowers: 0,
      totalTweets: 0,
      retweets: 0,
      likes: 0,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ... existing background code ... */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(120,200,255,0.3),transparent_50%)]" />

        {/* Floating Elements */}
        <div
          className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        />
        <div
          className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-20 animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            KAITO
          </h1>
          <p className="text-xl text-gray-300 mb-6">Earn Crypto Rewards for Social Media Engagement</p>
          <div className="flex justify-center gap-4">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/30">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-300">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(connectedAddress)}
                    className="p-1 h-auto text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 bg-transparent"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>

        {isConnected ? (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-sm border border-purple-500/30">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="earn" className="data-[state=active]:bg-purple-600">
                Earn
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-purple-600">
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Total Earned</CardTitle>
                    <Coins className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{userStats.totalEarned.toFixed(1)} KAITO</div>
                    <p className="text-xs text-gray-400">
                      {isTwitterConnected ? "Based on real activity" : "Connect Twitter to earn"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Weekly Earned</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{userStats.weeklyEarned.toFixed(1)} KAITO</div>
                    <p className="text-xs text-gray-400">
                      {isTwitterConnected ? "From recent activity" : "Connect to start earning"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Global Rank</CardTitle>
                    <Award className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {userStats.rank > 0 ? `#${userStats.rank}` : "--"}
                    </div>
                    <p className="text-xs text-gray-400">
                      {isTwitterConnected ? "Based on engagement" : "Connect to get ranked"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Engagement Score</CardTitle>
                    <Star className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{userStats.engagementScore.toFixed(1)}/10</div>
                    <Progress value={userStats.engagementScore * 10} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    Social Media Activity
                    {isTwitterConnected && twitterUser && (
                      <Badge variant="secondary" className="bg-blue-600">
                        @{twitterUser.username}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {isTwitterConnected
                      ? "Your real Twitter engagement metrics"
                      : "Connect Twitter to see real metrics"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{userStats.totalTweets}</div>
                      <div className="text-sm text-gray-400">Tweets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{userStats.retweets}</div>
                      <div className="text-sm text-gray-400">Retweets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400">{userStats.likes}</div>
                      <div className="text-sm text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{userStats.twitterFollowers}</div>
                      <div className="text-sm text-gray-400">Followers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earn" className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Connect Your Social Accounts</CardTitle>
                  <CardDescription className="text-gray-400">
                    Link your social media to start earning KAITO tokens based on real activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Twitter className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          Twitter/X
                          {isTwitterConnected && (
                            <Badge variant="secondary" className="bg-green-600">
                              Connected
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {isTwitterConnected
                            ? `Connected as @${twitterUser?.username}`
                            : "Earn tokens for tweets, retweets, and engagement"}
                        </div>
                      </div>
                    </div>
                    {!isTwitterConnected ? (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleTwitterConnect}
                        disabled={isLoadingTwitter}
                      >
                        {isLoadingTwitter ? "Connecting..." : "Connect"}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadTwitterData}
                          disabled={isLoadingTwitter}
                          className="border-purple-500/30 bg-transparent"
                        >
                          {isLoadingTwitter ? "Refreshing..." : "Refresh"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTwitterDisconnect}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10 bg-transparent"
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* TipCoin point system explanation */}
                  <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">TipCoin Point System</CardTitle>
                      <CardDescription className="text-gray-400">
                        Earn points based on Twitter/X engagement with multipliers for different tweet types
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-white mb-3">Base Points</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-300">1 View</span>
                              <span className="text-purple-400">1 point</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">1 Like</span>
                              <span className="text-purple-400">100 points</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">1 Reply</span>
                              <span className="text-purple-400">250 points</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">1 Quote</span>
                              <span className="text-purple-400">500 points</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">1 Retweet</span>
                              <span className="text-purple-400">1,000 points</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-3">Multipliers</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Original Tweet</span>
                              <span className="text-green-400">30x (max 5/day)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Tipped Quote</span>
                              <span className="text-blue-400">10x (max 10/day)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Tipped Reply</span>
                              <span className="text-yellow-400">1x (max 15/day)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Reply Kickback</span>
                              <span className="text-pink-400">0.1x (verified only)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {exampleCalculation && (
                        <div className="border border-purple-500/30 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-3">Example Calculation</h4>
                          <div className="text-sm space-y-2">
                            <div className="text-gray-300">
                              Original tweet with: 100 views, 10 likes, 5 replies, 3 quotes, 2 retweets
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <div className="text-gray-400">Base Points:</div>
                                <div className="text-purple-400 font-mono">
                                  {TipCoinPointSystem.formatPoints(exampleCalculation.base_points)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400">Final Points (30x):</div>
                                <div className="text-green-400 font-mono font-bold">
                                  {TipCoinPointSystem.formatPoints(exampleCalculation.final_points)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="font-semibold text-white">Your Weekly Points</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                          {TipCoinPointSystem.formatPoints(weeklyPoints)} points
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          ≈ {(weeklyPoints / 1000).toFixed(1)} KAITO tokens
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ... existing task cards ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-purple-900/20 border border-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Daily Tasks</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tweet with #KAITO</span>
                          <Badge variant="secondary">+10 KAITO</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Retweet official posts</span>
                          <Badge variant="secondary">+5 KAITO</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Engage with community</span>
                          <Badge variant="secondary">+3 KAITO</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-900/20 border border-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Bonus Rewards</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Weekly streak</span>
                          <Badge variant="secondary">+50 KAITO</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Refer friends</span>
                          <Badge variant="secondary">+100 KAITO</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Top engager</span>
                          <Badge variant="secondary">+200 KAITO</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ... existing leaderboard and rewards tabs ... */}
            <TabsContent value="leaderboard" className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Top Earners</CardTitle>
                  <CardDescription className="text-gray-400">Weekly leaderboard rankings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              user.rank === 1
                                ? "bg-yellow-500 text-black"
                                : user.rank === 2
                                  ? "bg-gray-400 text-black"
                                  : user.rank === 3
                                    ? "bg-orange-500 text-black"
                                    : "bg-purple-600 text-white"
                            }`}
                          >
                            {user.rank}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.address}</div>
                            <div className="text-sm text-gray-400">Score: {user.score}/10</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-400">{user.earned} KAITO</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Claim Your Rewards</CardTitle>
                  <CardDescription className="text-gray-400">Available tokens ready for withdrawal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-6">
                    <div>
                      <div className="text-4xl font-bold text-purple-400 mb-2">
                        {userStats.weeklyEarned.toFixed(1)} KAITO
                      </div>
                      <div className="text-gray-400">Available to claim</div>
                    </div>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                      <Zap className="w-4 h-4 mr-2" />
                      Claim Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Reward History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border border-purple-500/20 rounded">
                      <span className="text-gray-300">Weekly engagement bonus</span>
                      <span className="text-green-400">+{(userStats.weeklyEarned * 0.6).toFixed(1)} KAITO</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-purple-500/20 rounded">
                      <span className="text-gray-300">Daily tweet rewards</span>
                      <span className="text-green-400">+{(userStats.weeklyEarned * 0.3).toFixed(1)} KAITO</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-purple-500/20 rounded">
                      <span className="text-gray-300">Community engagement</span>
                      <span className="text-green-400">+{(userStats.weeklyEarned * 0.1).toFixed(1)} KAITO</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center space-y-8">
            <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/30 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Welcome to Kaito</CardTitle>
                <CardDescription className="text-gray-400">
                  The revolutionary social reward platform that pays you for your social media engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <Twitter className="w-8 h-8 text-blue-400 mx-auto" />
                    <h3 className="font-semibold text-white">Engage</h3>
                    <p className="text-sm text-gray-400">Tweet, retweet, and interact on social media</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Coins className="w-8 h-8 text-purple-400 mx-auto" />
                    <h3 className="font-semibold text-white">Earn</h3>
                    <p className="text-sm text-gray-400">Get rewarded with KAITO tokens for your activity</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Award className="w-8 h-8 text-yellow-400 mx-auto" />
                    <h3 className="font-semibold text-white">Compete</h3>
                    <p className="text-sm text-gray-400">Climb the leaderboard and earn bonus rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
