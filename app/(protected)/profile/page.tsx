import { redirect } from "next/navigation";

import { FadeIn } from "@/components/fade-in";
import { ProfileForm } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          eyebrow="Profile"
          title="Manage your workspace identity"
          description="Keep your name, photo, and professional details polished so your account feels consistent and production-ready."
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <ProfileForm user={user} />
      </FadeIn>
    </div>
  );
}
