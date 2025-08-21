// Twitter API integration for real social media metrics
export interface TwitterUser {
  id: string
  username: string
  name: string
  followers_count: number
  following_count: number
  tweet_count: number
  verified: boolean
  profile_image_url: string
}

export interface TwitterMetrics {
  tweets: number
  retweets: number
  likes: number
  replies: number
  followers: number
  engagement_rate: number
}

class TwitterAPI {
  private accessToken: string | null = null
  private baseURL = "https://api.twitter.com/2"

  // OAuth 2.0 PKCE flow for Twitter authentication
  async initiateAuth(): Promise<string> {
    try {
      // Generate code verifier and challenge for PKCE
      const codeVerifier = this.generateCodeVerifier()
      const codeChallenge = await this.generateCodeChallenge(codeVerifier)

      // Store code verifier in localStorage for later use
      localStorage.setItem("twitter_code_verifier", codeVerifier)

      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || "",
        redirect_uri: `${window.location.origin}/twitter-callback`,
        scope: "tweet.read users.read follows.read offline.access",
        state: this.generateState(),
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      })

      const authURL = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
      return authURL
    } catch (error) {
      console.error("Twitter auth initiation failed:", error)
      throw new Error("Failed to initiate Twitter authentication")
    }
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<void> {
    try {
      const codeVerifier = localStorage.getItem("twitter_code_verifier")
      if (!codeVerifier) {
        throw new Error("Code verifier not found")
      }

      const response = await fetch("/api/twitter/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          redirect_uri: `${window.location.origin}/twitter-callback`,
        }),
      })

      if (!response.ok) {
        throw new Error("Token exchange failed")
      }

      const data = await response.json()
      this.accessToken = data.access_token
      localStorage.setItem("twitter_access_token", data.access_token)
      localStorage.removeItem("twitter_code_verifier")
    } catch (error) {
      console.error("Token exchange failed:", error)
      throw new Error("Failed to exchange code for token")
    }
  }

  // Get authenticated user's profile
  async getUserProfile(): Promise<TwitterUser> {
    try {
      const token = this.accessToken || localStorage.getItem("twitter_access_token")
      if (!token) {
        throw new Error("No access token available")
      }

      const response = await fetch("/api/twitter/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get user profile:", error)
      throw new Error("Failed to fetch user profile")
    }
  }

  // Get user's recent activity metrics
  async getUserMetrics(userId: string): Promise<TwitterMetrics> {
    try {
      const token = this.accessToken || localStorage.getItem("twitter_access_token")
      if (!token) {
        throw new Error("No access token available")
      }

      const response = await fetch(`/api/twitter/metrics?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user metrics")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get user metrics:", error)
      throw new Error("Failed to fetch user metrics")
    }
  }

  // Calculate engagement score based on real metrics
  calculateEngagementScore(metrics: TwitterMetrics): number {
    const { tweets, retweets, likes, replies, followers, engagement_rate } = metrics

    // Weighted scoring algorithm
    const activityScore = Math.min((tweets * 0.3 + retweets * 0.2 + likes * 0.1 + replies * 0.4) / 100, 3)
    const followersScore = Math.min(Math.log10(followers + 1) / 2, 2)
    const engagementScore = Math.min(engagement_rate * 5, 5)

    return Math.min(activityScore + followersScore + engagementScore, 10)
  }

  // Calculate KAITO token rewards based on activity
  calculateRewards(metrics: TwitterMetrics, previousMetrics?: TwitterMetrics): number {
    const baseReward = 1 // Base reward per activity
    const bonusMultiplier = 1.5 // Bonus for high engagement

    let totalRewards = 0

    // Calculate new activity since last check
    const newTweets = previousMetrics ? metrics.tweets - previousMetrics.tweets : metrics.tweets
    const newRetweets = previousMetrics ? metrics.retweets - previousMetrics.retweets : metrics.retweets
    const newLikes = previousMetrics ? metrics.likes - previousMetrics.likes : metrics.likes
    const newReplies = previousMetrics ? metrics.replies - previousMetrics.replies : metrics.replies

    // Reward calculation
    totalRewards += newTweets * baseReward * 3 // Tweets worth more
    totalRewards += newRetweets * baseReward * 2
    totalRewards += newLikes * baseReward * 0.5
    totalRewards += newReplies * baseReward * 2.5

    // Apply engagement bonus
    if (metrics.engagement_rate > 0.05) {
      // 5% engagement rate threshold
      totalRewards *= bonusMultiplier
    }

    return Math.round(totalRewards * 100) / 100 // Round to 2 decimal places
  }

  // Utility functions
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")
  }

  private generateState(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.accessToken || localStorage.getItem("twitter_access_token"))
  }

  // Logout
  logout(): void {
    this.accessToken = null
    localStorage.removeItem("twitter_access_token")
  }
}

export const twitterAPI = new TwitterAPI()
