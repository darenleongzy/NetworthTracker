"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function sendCoupleInviteEmail(
  to: string,
  senderEmail: string,
  isReminder = false
) {
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.functions.invoke("send-waitlist-email", {
    body: {
      to,
      template: "couple_invite",
      data: { senderEmail, isReminder },
    },
  });

  if (error) {
    console.error("Failed to send couple invite email:", error.message);
  }
}

export async function sendCoupleInvite(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!emailPattern.test(normalizedEmail)) {
    throw new Error("Enter a valid email address");
  }

  const { supabase, user } = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("create_couple_invite", {
    target_email: normalizedEmail,
  });

  if (error) throw new Error(error.message);
  const invite = data?.[0] as { invitee_email?: string } | undefined;
  await sendCoupleInviteEmail(invite?.invitee_email ?? normalizedEmail, user.email ?? "", false);
  revalidatePath("/dashboard/couple");
}

export async function respondToCoupleInvite(connectionId: string, acceptInvite: boolean) {
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("respond_to_couple_invite", {
    connection_id: connectionId,
    accept_invite: acceptInvite,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/couple");
}

export async function dismissCoupleInviteNotification(notificationId: string) {
  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("couple_invite_notifications")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/couple");
}

export async function resendCoupleInvite(connectionId: string) {
  const { supabase, user } = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("resend_couple_invite", {
    connection_id: connectionId,
  });

  if (error) throw new Error(error.message);
  const invite = data?.[0] as { invitee_email?: string } | undefined;
  await sendCoupleInviteEmail(invite?.invitee_email ?? "", user.email ?? "", true);
  revalidatePath("/dashboard/couple");
}

export async function updateCoupleGoal(
  connectionId: string,
  goalAmount: number,
  includeCpf: boolean
) {
  if (!Number.isFinite(goalAmount) || goalAmount < 0) {
    throw new Error("Goal amount must be zero or more");
  }

  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("update_couple_goal", {
    connection_id: connectionId,
    next_goal_amount: goalAmount,
    next_goal_include_cpf: includeCpf,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/couple");
}
