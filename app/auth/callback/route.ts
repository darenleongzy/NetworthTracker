import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Validates redirect path to prevent open redirect attacks.
 * Only allows paths starting with /dashboard.
 */
function isAllowedRedirectPath(path: string): boolean {
  // Must start with / and not contain protocol indicators or double slashes
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":")) {
    return false;
  }
  // Only allow dashboard routes
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate redirect path to prevent open redirect attacks
  const redirectPath = isAllowedRedirectPath(next) ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
