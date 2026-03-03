// Supabase Edge Function: send-waitlist-email
// Sends waitlist confirmation and invite emails using Supabase's built-in SMTP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://yourapp.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yourapp.com";

interface EmailRequest {
  to: string;
  template: "waitlist_confirmation" | "waitlist_invite";
  data: Record<string, unknown>;
}

function getEmailContent(
  template: string,
  _data: Record<string, unknown>
): { subject: string; html: string } {
  switch (template) {
    case "waitlist_confirmation":
      return {
        subject: "You're on the waitlist!",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">You're on the waitlist!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Thanks for your interest in NetWorth Tracker!</p>
    <p>We're currently in limited launch mode to ensure the best experience for our users. You've been added to our waitlist and we'll notify you as soon as a spot opens up.</p>
    <p>In the meantime, feel free to reply to this email if you have any questions.</p>
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">— The NetWorth Team</p>
  </div>
</body>
</html>
        `.trim(),
      };

    case "waitlist_invite":
      return {
        subject: "You're invited! Your NetWorth Tracker account awaits",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Your spot is ready!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Great news! A spot has opened up and you're invited to join NetWorth Tracker.</p>
    <p>Click the button below to create your account and start tracking your net worth:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${SITE_URL}/signup" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Create Your Account</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This invitation doesn't expire, but spots are limited, so we recommend signing up soon.</p>
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">— The NetWorth Team</p>
  </div>
</body>
</html>
        `.trim(),
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { to, template, data } = (await req.json()) as EmailRequest;

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, template" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { subject, html } = getEmailContent(template, data);

    // Use Supabase's built-in email sending (via Resend integration)
    // This requires setting up SMTP in Supabase dashboard
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - email would be sent to:", to);
      console.log("Subject:", subject);
      // In development, just log and return success
      return new Response(
        JSON.stringify({ success: true, message: "Email logged (no API key)" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
