import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization")
    if (!authorization) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const response = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=public_metrics,verified,profile_image_url",
      {
        headers: {
          Authorization: authorization,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    const userData = await response.json()

    // Transform Twitter API response to our format
    const user = {
      id: userData.data.id,
      username: userData.data.username,
      name: userData.data.name,
      followers_count: userData.data.public_metrics.followers_count,
      following_count: userData.data.public_metrics.following_count,
      tweet_count: userData.data.public_metrics.tweet_count,
      verified: userData.data.verified || false,
      profile_image_url: userData.data.profile_image_url,
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Twitter user fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
