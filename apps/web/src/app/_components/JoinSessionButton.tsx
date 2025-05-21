/*
- Call joinSession procedure
*/

"use client"

import { api } from "~/trpc/react"

export default function JoinSessionButton( { sessionId }: { sessionId: string }) {

  const joinSession = api.session.joinSession.useMutation({
    onSuccess: () => {
      console.log('success!')
    },
    onError: (error) => {
      console.error('Error joining session', error)
    }
  })

  const handleJoinSession = () => {
    
    console.log("joining session:", sessionId)
    
    joinSession.mutate({ sessionId })
  }
  
  return <button onClick={handleJoinSession}>Join Session</button>
}