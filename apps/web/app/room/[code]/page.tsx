import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoomDetailsAction } from "@/lib/room/actions";
import { RoomClientView } from "./room-client-view";

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/room/${code}`);
  }

  // Fetch room details and enforce membership authorization
  const result = await getRoomDetailsAction(code);

  if (!result.success || !result.room || !result.members) {
    // If not a member or room not found, redirect back to dashboard
    redirect("/dashboard");
  }

  return (
    <RoomClientView
      room={result.room}
      members={result.members}
      partner={result.partner || null}
      currentUserId={user.id}
      isOwner={result.isOwner || false}
    />
  );
}
