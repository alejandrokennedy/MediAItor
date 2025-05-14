/*

- Set up route


*/

"use client"

import { api } from "~/trpc/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const CreateSessionButton = () => {
  const [creatingSession, setCreatingSession] = useState(false);
  const router = useRouter();
  const createSession = api.session.createSession.useMutation({
    onSuccess: (data) => {
      console.log("data", data);
      router.push(`/session/${data.sessionId}`)
    },
    onError: (error) => {
      console.error("Failed to create session:", error);
    },
  });

  const handleCreateSession = async () => {
    if (creatingSession) return;
    try {
      setCreatingSession(true);
      await createSession.mutateAsync();
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <button onClick={handleCreateSession} disabled={creatingSession}>
      {creatingSession ? "Creating Session..." : "Create Session"}
    </button>
  );
}

export default CreateSessionButton