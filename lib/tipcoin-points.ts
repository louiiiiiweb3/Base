export interface TweetMetrics {
  views: number
  likes: number
  replies: number
  quotes: number
  retweets: number
  type: "original" | "tipped_quote" | "tipped_reply" | "replied_kickback"
  has_tip_hashtag: boolean
  is_verified_user?: boolean
}

export interface DailyLimits {
  original_tweets: number
  tipped_quotes: number
  tipped_replies: number
  max_original_tweets: 5
  max_tipped_quotes: 10
  max_tipped_replies: 15
}

export interface PointCalculation {
  base_points: number
  multiplier: number
  final_points: number
  capped_points: number
  breakdown: {
    views: number
    likes: number
    replies: number
    quotes: number
    retweets: number
  }
}

export class TipCoinPointSystem {
  // Base point values
  private static readonly BASE_POINTS = {
    VIEW: 1,
    LIKE: 100,
    REPLY: 250,
    QUOTE: 500,
    RETWEET: 1000,
  }

  // Multipliers based on tweet type
  private static readonly MULTIPLIERS = {
    ORIGINAL: 30,
    TIPPED_QUOTE: 10,
    TIPPED_REPLY: 1,
    REPLIED_KICKBACK: 0.1,
  }

  // Daily limits and maximum points per tweet type
  private static readonly LIMITS = {
    ORIGINAL_TWEETS_PER_DAY: 5,
    TIPPED_QUOTES_PER_DAY: 10,
    TIPPED_REPLIES_PER_DAY: 15,
    MAX_POINTS_ORIGINAL: 18_000_000,
    MAX_POINTS_QUOTE: 1_000_000,
    MAX_POINTS_REPLY: 25_000,
  }

  static calculateTweetPoints(metrics: TweetMetrics): PointCalculation {
    // Calculate base engagement points
    const breakdown = {
      views: metrics.views * this.BASE_POINTS.VIEW,
      likes: metrics.likes * this.BASE_POINTS.LIKE,
      replies: metrics.replies * this.BASE_POINTS.REPLY,
      quotes: metrics.quotes * this.BASE_POINTS.QUOTE,
      retweets: metrics.retweets * this.BASE_POINTS.RETWEET,
    }

    const base_points = Object.values(breakdown).reduce((sum, points) => sum + points, 0)

    // Determine multiplier based on tweet type
    let multiplier = 1
    let max_points = Number.POSITIVE_INFINITY

    switch (metrics.type) {
      case "original":
        multiplier = this.MULTIPLIERS.ORIGINAL
        max_points = this.LIMITS.MAX_POINTS_ORIGINAL
        break
      case "tipped_quote":
        multiplier = this.MULTIPLIERS.TIPPED_QUOTE
        max_points = this.LIMITS.MAX_POINTS_QUOTE
        break
      case "tipped_reply":
        multiplier = this.MULTIPLIERS.TIPPED_REPLY
        max_points = this.LIMITS.MAX_POINTS_REPLY
        break
      case "replied_kickback":
        multiplier = this.MULTIPLIERS.REPLIED_KICKBACK
        // No daily limit for kickbacks
        break
    }

    const final_points = base_points * multiplier
    const capped_points = Math.min(final_points, max_points)

    return {
      base_points,
      multiplier,
      final_points,
      capped_points,
      breakdown,
    }
  }

  static calculateWeeklyPoints(tweets: TweetMetrics[], dailyLimits: DailyLimits): number {
    let totalPoints = 0
    const dailyCount = {
      original: 0,
      tipped_quote: 0,
      tipped_reply: 0,
    }

    // Sort tweets by date (assuming they're provided in chronological order)
    for (const tweet of tweets) {
      // Check daily limits
      let canCount = true

      switch (tweet.type) {
        case "original":
          if (dailyCount.original >= this.LIMITS.ORIGINAL_TWEETS_PER_DAY) {
            canCount = false
          } else {
            dailyCount.original++
          }
          break
        case "tipped_quote":
          if (dailyCount.tipped_quote >= this.LIMITS.TIPPED_QUOTES_PER_DAY) {
            canCount = false
          } else {
            dailyCount.tipped_quote++
          }
          break
        case "tipped_reply":
          if (dailyCount.tipped_reply >= this.LIMITS.TIPPED_REPLIES_PER_DAY) {
            canCount = false
          } else {
            dailyCount.tipped_reply++
          }
          break
        case "replied_kickback":
          // No daily limit for kickbacks, but requires verified user
          canCount = tweet.is_verified_user || false
          break
      }

      if (canCount) {
        const calculation = this.calculateTweetPoints(tweet)
        totalPoints += calculation.capped_points
      }
    }

    return totalPoints
  }

  static generateExampleCalculation(): PointCalculation {
    const exampleTweet: TweetMetrics = {
      views: 100,
      likes: 10,
      replies: 5,
      quotes: 3,
      retweets: 2,
      type: "original",
      has_tip_hashtag: true,
    }

    return this.calculateTweetPoints(exampleTweet)
  }

  static formatPoints(points: number): string {
    if (points >= 1_000_000) {
      return `${(points / 1_000_000).toFixed(1)}M`
    } else if (points >= 1_000) {
      return `${(points / 1_000).toFixed(1)}K`
    }
    return points.toLocaleString()
  }
}
