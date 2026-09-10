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
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background-image: url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; padding: 60px 20px; text-align: center; position: relative; }
          .header-overlay { position: absolute; inset: 0; background-color: rgba(11, 17, 32, 0.75); }
          .header-content { position: relative; z-index: 10; color: #ffffff; }
          .logo { width: 80px; margin-bottom: 20px; }
          .title { margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px; }
          .body-content { padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px; }
          .greeting { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px; }
          .id-box { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
          .id-label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin: 0 0 8px 0; }
          .id-value { font-size: 28px; font-family: monospace; font-weight: bold; color: #f26522; margin: 0; letter-spacing: 2px; }
          .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; background-color: #f26522; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; margin-top: 20px; }
        </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="header-overlay"></div>
              <div class="header-content">
                <img src="https://uiujef.org/logo.png" alt="UIUJEF Logo" class="logo" />
                <h1 class="title">Registration Confirmed!</h1>
              </div>
            </div>
            <div class="body-content">
              <div class="greeting">Hello ${name},</div>
              <p>Thank you for registering for our upcoming event. Your application has been successfully received and recorded in our system.</p>
              
              <div class="id-box">
                <p class="id-label">Your Application ID</p>
                <p class="id-value">${applicationId}</p>
              </div>
              
              <p>Please keep this Application ID safe. You will need it to track your registration status and for entry to the event venue.</p>
              
              <div style="text-align: center;">
                <a href="https://uiujef.org" class="btn">Visit Website</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} UIU Junior Economists' Forum. All rights reserved.</p>
              <p>United International University</p>
            </div>
          </div>
        </body>
        </html>
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
