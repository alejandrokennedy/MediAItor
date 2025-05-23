"use client"

import { useEffect, useRef } from "react"
import { api } from "~/trpc/react"
import { useUser } from "@clerk/nextjs"

export function UserSync() {
  const { isSignedIn, isLoaded } = useUser()
  const syncUser = api.user.syncCurrentUser.useMutation()
  const syncUserRef = useRef(syncUser)

  useEffect(() => {
    // Only attempt to sync when Clerk has loaded and the user is signed in
    if (isLoaded && isSignedIn) {
      console.log("User is signed in, syncing with database...")

      syncUserRef.current.mutate(undefined, {
        onSuccess: (data) => {
          console.log("user sync result:", data)
        },
        onError: (error) => {
          console.log("Failed to sync user:", error)
        }
      })
    }
    
  }, [isLoaded, isSignedIn])
  
  return null;
}