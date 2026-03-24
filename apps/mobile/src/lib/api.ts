import { createTrackMyWorthApiClient } from "@track-my-worth/api-client";
import { mobileSupabase } from "./supabase";

export const mobileApi = createTrackMyWorthApiClient(mobileSupabase);
