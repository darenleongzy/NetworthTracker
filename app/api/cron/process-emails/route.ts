import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This endpoint is called by Vercel Cron every 15 minutes
// It processes 1 email per call to respect the 4 emails/hour rate limit

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get the oldest pending email
    const { data: email, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(fetchError.message);
    }

    if (!email) {
      return NextResponse.json({ message: "No pending emails" });
    }

    // Call the edge function to send the email
    const { error: invokeError } = await supabase.functions.invoke(
      "send-waitlist-email",
      {
        body: {
          to: email.to_email,
          template: email.template,
          data: email.data,
        },
      }
    );

    if (invokeError) {
      // Update as failed
      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          attempts: email.attempts + 1,
          error: invokeError.message,
        })
        .eq("id", email.id);

      return NextResponse.json(
        { error: "Failed to send email", details: invokeError.message },
        { status: 500 }
      );
    }

    // Update as sent
    await supabase
      .from("email_queue")
      .update({
        status: "sent",
        attempts: email.attempts + 1,
        sent_at: new Date().toISOString(),
      })
      .eq("id", email.id);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${email.to_email}`,
    });
  } catch (err) {
    console.error("Error processing email queue:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
