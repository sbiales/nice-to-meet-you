import { Resend } from 'resend'
import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

async function sendViaMailpit(options: SendEmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    ignoreTLS: true,
  })

  await transporter.sendMail({
    from: options.from ?? 'noreply@nicetomeetyou.local',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

async function sendViaResend(options: SendEmailOptions): Promise<void> {
  const resend = getResendClient()
  await resend.emails.send({
    from: options.from ?? 'Nice To Meet You <noreply@nicetomeetyou.app>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return sendViaResend(options)
  }
  return sendViaMailpit(options)
}
