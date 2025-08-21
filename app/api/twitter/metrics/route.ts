import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const authorization = request.headers.get("authorization")

    if (!authorization || !userId) {
      return NextResponse.json({ error: "Missing authorization or user_id" }, { status: 400 })
    }

    // Get user's recent tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at`,
      {
        headers: {
          Authorization: authorization,
        },
      },
    )

    if (!tweetsResponse.ok) {
      throw new Error("Failed to fetch tweets")
    }

    const tweetsData = await tweetsResponse.json()
    const tweets = tweetsData.data || []

    // Calculate metrics from recent tweets
    let totalLikes = 0
    let totalRetweets = 0
    let totalReplies = 0
    let totalImpressions = 0

    tweets.forEach((tweet: any) => {
      totalLikes += tweet.public_metrics.like_count
      totalRetweets += tweet.public_metrics.retweet_count
      totalReplies += tweet.public_metrics.reply_count
      totalImpressions += tweet.public_metrics.impression_count || 0
    })

    // Get user profile for follower count
    const userResponse = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`, {
      headers: {
        Authorization: authorization,
      },
    })

    const userData = await userResponse.json()
    const followers = userData.data.public_metrics.followers_count

    // Calculate engagement rate
    const engagementRate = totalImpressions > 0 ? (totalLikes + totalRetweets + totalReplies) / totalImpressions : 0

    const metrics = {
      tweets: tweets.length,
      retweets: totalRetweets,
      likes: totalLikes,
      replies: totalReplies,
      followers,
      engagement_rate: engagementRate,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Twitter metrics fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
