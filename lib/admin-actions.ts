"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Types ──

export type WaitlistStatus = "pending" | "invited" | "signed_up";
export type EmailStatus = "pending" | "sent" | "failed";

export interface SignupSettings {
  signup_enabled: boolean;
  signup_limit: number;
  current_signup_count: number;
  remaining_slots: number;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  status: WaitlistStatus;
  created_at: string;
  invited_at: string | null;
  signed_up_at: string | null;
}

export interface WaitlistStats {
  pending: number;
  invited: number;
  signed_up: number;
  total: number;
}

export interface EmailQueueEntry {
  id: string;
  to_email: string;
  template: string;
  data: Record<string, unknown>;
  status: EmailStatus;
  attempts: number;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface EmailQueueStats {
  pending: number;
  sent: number;
  failed: number;
}

// ── Helpers ──

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminRecord) {
    throw new Error("Not authorized");
  }

  return { supabase, user };
}

// ── Public Actions ──

export async function getSignupSettings(): Promise<SignupSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("signup_enabled, signup_limit, current_signup_count")
    .eq("id", 1)
    .single();

  if (error) {
    // Return defaults if table doesn't exist yet
    return {
      signup_enabled: true,
      signup_limit: 100,
      current_signup_count: 0,
      remaining_slots: 100,
    };
  }

  return {
    signup_enabled: data.signup_enabled,
    signup_limit: data.signup_limit,
    current_signup_count: data.current_signup_count,
    remaining_slots: Math.max(0, data.signup_limit - data.current_signup_count),
  };
}

export async function checkSignupAvailability(): Promise<{
  available: boolean;
  remainingSlots: number;
  showLimitedBanner: boolean;
}> {
  const settings = await getSignupSettings();

  const available = settings.signup_enabled && settings.remaining_slots > 0;
  const showLimitedBanner =
    settings.signup_enabled &&
    settings.remaining_slots > 0 &&
    settings.remaining_slots <= 20;

  return {
    available,
    remainingSlots: settings.remaining_slots,
    showLimitedBanner,
  };
}

export async function joinWaitlist(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address" };
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from("waitlist")
    .select("id, status")
    .eq("email", email.toLowerCase())
    .single();

  if (existing) {
    if (existing.status === "signed_up") {
      return { success: false, error: "This email has already signed up" };
    }
    if (existing.status === "invited") {
      return {
        success: false,
        error: "You've been invited! Check your email to sign up",
      };
    }
    return { success: false, error: "This email is already on the waitlist" };
  }

  // Insert into waitlist
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.toLowerCase() });

  if (error) {
    console.error("Failed to join waitlist:", error);
    return { success: false, error: "Failed to join waitlist" };
  }

  // Queue confirmation email
  await supabase.from("email_queue").insert({
    to_email: email.toLowerCase(),
    template: "waitlist_confirmation",
    data: { email: email.toLowerCase() },
  });

  return { success: true };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return !!adminRecord;
}

// ── Admin Actions ──

export async function updateSignupSettings(
  enabled: boolean,
  limit: number
): Promise<void> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("app_settings")
    .update({
      signup_enabled: enabled,
      signup_limit: limit,
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin");
}

export async function getWaitlistEntries(
  page: number = 1,
  pageSize: number = 20,
  statusFilter?: WaitlistStatus
): Promise<{ entries: WaitlistEntry[]; total: number }> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("waitlist")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    entries: data as WaitlistEntry[],
    total: count ?? 0,
  };
}

export async function getWaitlistStats(): Promise<WaitlistStats> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("waitlist").select("status");

  if (error) throw new Error(error.message);

  const stats: WaitlistStats = {
    pending: 0,
    invited: 0,
    signed_up: 0,
    total: data.length,
  };

  for (const entry of data) {
    if (entry.status in stats) {
      stats[entry.status as keyof Omit<WaitlistStats, "total">]++;
    }
  }

  return stats;
}

export async function inviteWaitlistUsers(
  count: number
): Promise<{ invited: number; error?: string }> {
  const { supabase } = await requireAdmin();

  // Get oldest pending waitlist entries
  const { data: entries, error: fetchError } = await supabase
    .from("waitlist")
    .select("id, email")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(count);

  if (fetchError) throw new Error(fetchError.message);
  if (!entries || entries.length === 0) {
    return { invited: 0, error: "No pending users to invite" };
  }

  // Update waitlist status to invited
  const ids = entries.map((e) => e.id);
  const { error: updateError } = await supabase
    .from("waitlist")
    .update({ status: "invited", invited_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) throw new Error(updateError.message);

  // Queue invite emails
  const emailInserts = entries.map((entry) => ({
    to_email: entry.email,
    template: "waitlist_invite",
    data: { email: entry.email },
  }));

  const { error: emailError } = await supabase
    .from("email_queue")
    .insert(emailInserts);

  if (emailError) {
    console.error("Failed to queue invite emails:", emailError);
  }

  // Increase signup limit to accommodate invited users
  const { data: settings } = await supabase
    .from("app_settings")
    .select("signup_limit")
    .eq("id", 1)
    .single();

  if (settings) {
    await supabase
      .from("app_settings")
      .update({ signup_limit: settings.signup_limit + entries.length })
      .eq("id", 1);
  }

  revalidatePath("/dashboard/admin");
  return { invited: entries.length };
}

export async function getEmailQueueStats(): Promise<EmailQueueStats> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("email_queue").select("status");

  if (error) throw new Error(error.message);

  const stats: EmailQueueStats = {
    pending: 0,
    sent: 0,
    failed: 0,
  };

  for (const entry of data) {
    if (entry.status in stats) {
      stats[entry.status as keyof EmailQueueStats]++;
    }
  }

  return stats;
}

export async function getEmailQueueEntries(
  page: number = 1,
  pageSize: number = 20
): Promise<{ entries: EmailQueueEntry[]; total: number }> {
  const { supabase } = await requireAdmin();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("email_queue")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    entries: data as EmailQueueEntry[],
    total: count ?? 0,
  };
}

export async function processEmailQueue(): Promise<{
  processed: boolean;
  error?: string;
}> {
  const { supabase } = await requireAdmin();

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
    return { processed: false, error: "No pending emails" };
  }

  try {
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

      return { processed: false, error: invokeError.message };
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

    revalidatePath("/dashboard/admin");
    return { processed: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("email_queue")
      .update({
        status: "failed",
        attempts: email.attempts + 1,
        error: errorMessage,
      })
      .eq("id", email.id);

    return { processed: false, error: errorMessage };
  }
}

export async function retryFailedEmail(
  emailId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("email_queue")
    .update({ status: "pending", error: null })
    .eq("id", emailId)
    .eq("status", "failed");

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  return { success: true };
}
