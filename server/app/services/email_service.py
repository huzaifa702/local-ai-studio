import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, purpose: str = "Sign Up Verification") -> bool:
        """
        Dispatches a 6-digit verification code to the user's email.
        Uses real SMTP if configured (e.g. Gmail / SendGrid / Custom SMTP),
        or logs to server terminal for instant verification.
        """
        smtp_host = os.getenv("SMTP_HOST", "").strip()
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_pass = os.getenv("SMTP_PASS", "").strip()
        smtp_from = os.getenv("SMTP_FROM", smtp_user or "verify@guts-ai.local").strip()

        subject = f"Your Guts AI {purpose} Code: {otp_code}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
                .container {{ max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                .header {{ display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }}
                .logo {{ font-size: 20px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }}
                .badge {{ display: inline-block; background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }}
                h1 {{ font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff; }}
                p {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }}
                .otp-box {{ background: #090d16; border: 1px solid #4f46e5; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; letter-spacing: 10px; font-size: 32px; font-weight: 800; color: #38bdf8; font-family: monospace; }}
                .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; margin-top: 24px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="logo">⚡ GUTS AI STUDIO</span>
                </div>
                <span class="badge">{purpose}</span>
                <h1>Verify Your Account</h1>
                <p>Use the 6-digit confirmation code below to complete your {purpose.lower()}. This code is valid for <strong>10 minutes</strong>.</p>
                <div class="otp-box">{otp_code}</div>
                <p>If you did not request this verification code, you can safely ignore this email.</p>
                <div class="footer">
                    Guts AI • Private Multi-Model Workspace • 100% Local Intelligence
                </div>
            </div>
        </body>
        </html>
        """

        # Log OTP clearly in server output (ASCII safe for Windows console)
        print("\n" + "=" * 60)
        print(f"== [GUTS AI EMAIL SERVICE] - {purpose.upper()} ==")
        print(f"   Recipient : {to_email}")
        print(f"   OTP Code  : {otp_code} (Valid for 10 minutes)")
        print("=" * 60 + "\n")

        # Attempt SMTP delivery if configured
        if smtp_host and smtp_user and smtp_pass:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = smtp_from
                msg["To"] = to_email

                text_part = MIMEText(f"Your Guts AI {purpose} code is: {otp_code}. Valid for 10 minutes.", "plain")
                html_part = MIMEText(html_content, "html")
                msg.attach(text_part)
                msg.attach(html_part)

                with smtplib.SMTP(smtp_host, smtp_port, timeout=10.0) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, [to_email], msg.as_string())
                
                logger.info(f"Successfully sent OTP email to {to_email} via SMTP {smtp_host}")
                return True
            except Exception as e:
                logger.error(f"Failed to dispatch email via SMTP ({smtp_host}): {e}")
                return True

        return True

email_service = EmailService()
