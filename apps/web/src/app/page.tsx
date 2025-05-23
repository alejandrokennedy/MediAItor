/*
- check whether user is logged in
  - conditionally show session creation button
*/

// import Link from "next/link";
import { api, HydrateClient } from "~/trpc/server";
import CreateSessionButton from "./_components/CreateSessionButton";

export default async function Home() {
  let loggedInUser = null
  let errorMessage = null
  
  try {
    loggedInUser = await api.user.syncCurrentUser()
    console.log("user", loggedInUser)
  } catch (error: unknown) {
    if (error && typeof error === "object" && 'code' in error && error.code === 'UNAUTHORIZED') {
      console.log("user not logged in");
    } else {
      errorMessage = String(error);
      console.error("Error", error);
    }
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Medi <span className="text-[hsl(280,100%,70%)]">AI</span> tor
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            {/* <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/usage/first-steps"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">First Steps →</h3>
            <div className="text-lg">
              Just the basics - Everything you need to know to set up your
              database and authentication.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/introduction"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">Documentation →</h3>
            <div className="text-lg">
              Learn more about Create T3 App, the libraries it uses, and how
              to deploy it.
            </div>
          </Link> */}
          </div>

          {errorMessage ? (
            <p className="text-red-400">{`An unexpected error occurred: ${errorMessage}`}</p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {loggedInUser ? (
                <>
                  <p>Welcome, {loggedInUser.user.name}</p>
                  <CreateSessionButton />
                </>
              ) : (
                <p>{"Log in to start a session"}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
