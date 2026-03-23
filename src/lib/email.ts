import { Resend } from 'resend'
import { db } from './db'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.NEXT_PUBLIC_APP_EMAIL || 'noreply@girlypopchat.com'
const fromName = process.env.RESEND_FROM_NAME || 'GirlyPopChat'

export type EmailType = 'welcome' | 'notification' | 'newsletter' | 'invite' | 'system'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  type: EmailType
  userId?: string
  metadata?: Record<string, any>
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const { to, subject, html, type, userId, metadata } = options

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    })

    const emailLog = await db.emailLog.create({
      data: {
        userId,
        type,
        subject,
        toEmail: to,
        status: 'sent',
        messageId: result.data?.id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sentAt: new Date(),
      },
    })

    return { success: true, emailLog }
  } catch (error: any) {
    console.error('Email send error:', error)
    
    await db.emailLog.create({
      data: {
        userId: options.userId,
        type: options.type,
        subject: options.subject,
        toEmail: options.to,
        status: 'failed',
        error: error.message || 'Unknown error',
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    })

    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(userId: string, email: string) {
  const prefs = await getUserEmailPreferences(userId)
  if (!prefs?.welcome || !prefs?.enabled) return { skipped: true, reason: 'user_preference' }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GirlyPopChat!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%); min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">✨</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: #1f2937;">Welcome to GirlyPopChat!</h1>
              <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">Your beta adventure begins now</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hey there! 🌸 We're so excited to have you as one of our first beta testers. GirlyPopChat is all about connecting with friends in cozy, safe spaces.
            </p>
            
            <div style="background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #7c3aed; font-size: 18px;">Quick Start Guide</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                <li>✅ Verify your age (18+)</li>
                <li>✅ Create your cute identity</li>
                <li>✅ Join the <strong>#general</strong> room</li>
                <li>✅ Try the broadcast feature!</li>
                <li>✅ Send some DMs to friends</li>
              </ul>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Got questions? Found a bug? We're all ears! Your feedback helps us make GirlyPopChat amazing for everyone.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Jump Into Chat →
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 30px 0 0;">
              Love & sparkles,<br>
              The GirlyPopChat Team 💖
            </p>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&type=all" style="color: #9ca3af;">Unsubscribe from all emails</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to GirlyPopChat! ✨',
    html,
    type: 'welcome',
    userId,
  })
}

export async function sendNotificationEmail(
  userId: string,
  email: string,
  subject: string,
  message: string,
  metadata?: Record<string, any>
) {
  const prefs = await getUserEmailPreferences(userId)
  if (!prefs?.notifications || !prefs?.enabled) return { skipped: true, reason: 'user_preference' }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%); min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🔔</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; color: #1f2937;">${subject}</h1>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
              ${message}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Open GirlyPopChat →
              </a>
            </div>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&type=notifications" style="color: #9ca3af;">Unsubscribe from notifications</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject,
    html,
    type: 'notification',
    userId,
    metadata,
  })
}

export async function sendInviteEmail(inviteCode: string, email: string, inviterName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to GirlyPopChat! 💖</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%); min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">💌</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: #1f2937;">You're Invited!</h1>
              <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">Join GirlyPopChat beta</p>
            </div>
            
            ${inviterName ? `<p style="color: #374151; line-height: 1.6; margin-bottom: 20px;"><strong>${inviterName}</strong> wants you to join the fun!</p>` : ''}
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              We're building the coziest social platform and we'd love for you to be part of our beta. Here's your exclusive invite code:
            </p>
            
            <div style="background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border: 2px dashed #c084fc; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="margin: 0; font-size: 32px; font-weight: 700; color: #7c3aed; letter-spacing: 3px;">${inviteCode}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">Use this code when signing up:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login?invite=${inviteCode}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Sign Up Now →
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              This invite code is single-use and expires in 30 days.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'You\'re invited to GirlyPopChat! 💖',
    html,
    type: 'invite',
    metadata: { inviteCode, inviterName },
  })
}

export async function getUserEmailPreferences(userId: string) {
  let prefs = await db.emailPreference.findUnique({
    where: { userId },
  })
  
  if (!prefs) {
    prefs = await db.emailPreference.create({
      data: { userId },
    })
  }
  
  return prefs
}

export async function updateEmailPreferences(
  userId: string,
  updates: Partial<{
    welcome: boolean
    notifications: boolean
    newsletters: boolean
    marketing: boolean
    system: boolean
    enabled: boolean
  }>
) {
  return db.emailPreference.update({
    where: { userId },
    data: updates,
  })
}

export async function getUserEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  })
  return user
}