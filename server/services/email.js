import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'Hilal Calendar <noreply@hilalshaban.com>'

export async function sendOtpEmail(to, code) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0d9488; margin-bottom: 8px;">Hilal Calendar</h2>
        <p style="color: #475569;">Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes.</p>
      </div>
    `
  })
  if (error) {
    console.error('Failed to send OTP email:', error)
    throw new Error('Failed to send email')
  }
}

export async function sendReminderEmail(to, title, description, hijriDate) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reminder: ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0d9488; margin-bottom: 8px;">Hilal Calendar</h2>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #0f172a; margin: 0 0 8px 0;">${title}</h3>
          <p style="color: #64748b; margin: 0 0 12px 0;">${hijriDate}</p>
          ${description ? `<p style="color: #475569; margin: 0;">${description}</p>` : ''}
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          You set this reminder on Hilal Calendar.
          Visit <a href="https://hilalshaban.com" style="color: #0d9488;">hilalshaban.com</a> to manage your reminders.
        </p>
      </div>
    `
  })
  if (error) {
    console.error('Failed to send reminder email:', error)
  }
  return !error
}
