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
      from: 'UIUJEF <events@uiujef.org>',
      to: email,
      subject: 'Application Received — UIUJEF',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - UIUJEF</title>
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .btn-primary:hover { background-color: #d9551c !important; }
    .btn-secondary:hover { background-color: #e2e8f0 !important; color: #0f172a !important; }
    @media screen and (max-width: 650px) {
      .email-wrapper { padding: 20px 10px !important; }
      .email-container { width: 100% !important; }
      .mobile-btn { display: block !important; width: 100% !important; margin-bottom: 15px !important; }
      .mobile-btn a { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .app-id-text { font-size: 26px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td class="email-wrapper" align="center" style="padding: 40px 15px; background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'); background-size: cover; background-position: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.2);" class="email-container">
          <tr>
            <td style="background-color: #0f172a; padding: 40px 20px; text-align: center; border-bottom: 4px solid #F26522;">
              <a href="https://uiujef.org" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://uiujef.org/logo.png" alt="UIUJEF Official Logo" width="260" style="width: 260px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
              </a>
              <h1 style="margin: 20px 0 0 0; font-size: 26px; color: #ffffff; font-weight: 800; letter-spacing: 1px;">
                Application <span style="color: #F26522;">Received</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 35px 25px 35px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 700;">Hello ${name},</h2>
              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.7; color: #475569;">
                Thank you for submitting your application to the <strong>United International University Junior Economists' Forum (UIUJEF)</strong>. We have successfully received your submission and our team is currently verifying your records.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(145deg, #fffaf8, #ffffff); border: 2px dashed #F26522; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 25px 15px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Official Application ID</p>
                    <h2 class="app-id-text" style="margin: 0; font-family: monospace, 'Courier New'; font-size: 32px; color: #F26522; font-weight: 900; letter-spacing: 2px;">${applicationId}</h2>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 35px 0; font-size: 13px; line-height: 1.6; color: #64748b; text-align: center;">
                <em>Please keep this ID safe. You will need it to track your real-time status and access event resources.</em>
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: center;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display: inline-block;" class="mobile-btn">
                  <tr>
                    <td style="border-radius: 8px; background: #F26522; text-align: center;">
                      <a href="https://www.uiujef.org/applications" target="_blank" class="btn-primary" style="background: #F26522; font-size: 14px; text-decoration: none; padding: 14px 28px; color: #ffffff; font-weight: 700; display: block; border-radius: 8px;">
                        Track Application
                      </a>
                    </td>
                  </tr>
                </table>
                <span style="display: inline-block; width: 12px; height: 12px;"></span>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display: inline-block;" class="mobile-btn">
                  <tr>
                    <td style="border-radius: 8px; background: #ffffff; text-align: center; border: 1px solid #cbd5e1;">
                      <a href="https://uiujef.org" target="_blank" class="btn-secondary" style="background: #ffffff; font-size: 14px; text-decoration: none; padding: 14px 28px; color: #0f172a; font-weight: 600; display: block; border-radius: 8px;">
                        Visit Website
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f172a; padding: 35px 25px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff; font-weight: 700;">
                United International University<br><span style="color: #F26522;">Junior Economists' Forum</span>
              </p>
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #94a3b8;">
                Empowering future leaders, innovators, and strategic thinkers.<br>Contact: <a href="mailto:uiujef7@gmail.com" style="color: #F26522; text-decoration: none;">uiujef7@gmail.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px;">
                &copy; 2026 UIUJEF. All Rights Reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
