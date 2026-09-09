import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, applicationId } = await req.json()

    if (!email || !applicationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'UIUJEF <no-reply@uiujef.org>', // Make sure this domain is verified in Resend, otherwise use 'onboarding@resend.dev' if testing. 
      // Actually, if we don't have a verified domain, we can use a fallback or the user will configure it. Let's use a placeholder that they can change, or 'noreply@uiujef.org'.
      // Better to use a standard address.
      to: email,
      subject: 'Event Registration Confirmation - UIUJEF',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F26522; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">UIU Junior Economists' Forum</h2>
          </div>
          <div style="padding: 30px;">
            <h3 style="color: #333; margin-top: 0;">Registration Confirmed!</h3>
            <p style="color: #555; line-height: 1.6;">Hello ${name || 'Applicant'},</p>
            <p style="color: #555; line-height: 1.6;">Thank you for registering for our event. Your application has been successfully received.</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px dashed #ccc;">
              <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold;">Application ID</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-family: monospace; color: #333; font-weight: bold;">${applicationId}</p>
            </div>
            <p style="color: #555; line-height: 1.6; font-size: 14px;">Please keep this Application ID safe. You may need it for future reference or entry to the event.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #eaeaea;">
            <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} UIUJEF. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('[Resend Error]:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[SendEmail API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
