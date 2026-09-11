import { redirect } from "next/navigation";
import { getProfileAction } from "@/lib/profile/actions";
import { ProfileView } from "./profile-view";

export default async function ProfilePage() {
  const result = await getProfileAction();

  if (!result.success || !result.profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-900 py-12 px-4">
      <ProfileView initialProfile={result.profile} />
    </div>
  );
}
