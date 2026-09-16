import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCouplesQuizSessionAction } from "@/lib/quiz/actions";
import { CouplesQuizClient } from "./quiz-client";

interface CouplesQuizPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function CouplesQuizPage({ params }: CouplesQuizPageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/activity/couples-quiz/${sessionId}`);

  const result = await getCouplesQuizSessionAction({ sessionId });
  if (!result.success || !result.session) redirect("/dashboard");

  return (
    <CouplesQuizClient
      currentUserId={user.id}
      session={result.session}
      initialState={result.state || {}}
    />
  );
}
