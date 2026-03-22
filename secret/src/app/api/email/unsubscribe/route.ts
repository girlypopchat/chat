import { NextRequest, NextResponse } from 'next/server'
import { updateEmailPreferences } from '@/lib/email'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const type = searchParams.get('type') || 'all'

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=missing_email`)
    }

    const user = await db.user.findFirst({
      where: {
        stytchId: {
          contains: email,
        },
      },
    })

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=user_not_found`)
    }

    let updates: Record<string, boolean> = {}
    
    if (type === 'all') {
      updates = {
        welcome: false,
        notifications: false,
        newsletters: false,
        marketing: false,
        system: false,
        enabled: false,
      }
    } else if (type === 'notifications') {
      updates.notifications = false
    } else if (type === 'newsletters') {
      updates.newsletters = false
    } else if (type === 'marketing') {
      updates.marketing = false
    }

    await updateEmailPreferences(user.id, updates)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribe Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              max-width: 500px;
              text-align: center;
              margin: 20px;
            }
            .icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-radius: 50%;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .icon span {
              font-size: 40px;
            }
            h1 {
              color: #1f2937;
              margin: 0 0 15px;
              font-size: 28px;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin: 15px 0;
            }
            a {
              display: inline-block;
              background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <span>✓</span>
            </div>
            <h1>You're Unsubscribed!</h1>
            <p>${type === 'all' ? 'You have been unsubscribed from all emails.' : `You have been unsubscribed from ${type} emails.`}</p>
            <p>We're sorry to see you go! You can always update your preferences in your account settings.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat">Back to GirlyPopChat</a>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unsubscribe_failed`)
  }
}