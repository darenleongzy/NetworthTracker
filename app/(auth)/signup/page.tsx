import { checkSignupAvailability } from "@/lib/admin-actions";
import { SignupForm } from "@/components/signup-form";
import { WaitlistForm } from "@/components/waitlist-form";

export default async function SignupPage() {
  const availability = await checkSignupAvailability();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {availability.available ? (
        <SignupForm
          showLimitedBanner={availability.showLimitedBanner}
          remainingSlots={availability.remainingSlots}
        />
      ) : (
        <WaitlistForm />
      )}
    </div>
  );
}
