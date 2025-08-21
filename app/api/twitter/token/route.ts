import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier, redirect_uri } = await request.json()

    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        code_verifier,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed")
    }

    const tokenData = await tokenResponse.json()
    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("Twitter token exchange error:", error)
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 })
  }
}
