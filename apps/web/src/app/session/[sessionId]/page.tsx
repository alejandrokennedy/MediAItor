import { api } from "~/trpc/server"

type Params = Promise<{ sessionId: string }>

export default async function SessionPage({ params }: { params: Params}) {
  try {
    const { sessionId } = await params
    
    const session = await api.session.getSession({
      sessionId
    });

    console.log("session", session)

    if (!session) {
      return <div>Session not found</div>;
    }

    return (
      <>
        <h1>Session Page</h1>
        <p>Session ID: {session.id}</p>
        <p>Created: {session.createdAt.toLocaleString()}</p>
        <p>Status: {session.stage}</p>
        <p>Participants:</p>
        <ul>
          {session.participants.map(participant => (
            <li key={participant.id}>
              User ID: {participant.userId} - Status: {participant.status}
            </li>
          ))}
        </ul>
        <p>Messages:</p>
        <ul>
          {session.messages.map(message => (
            <li key={message.id}>
              User ID: {message.userId} - Message: {message.content}
            </li>
          ))}
        </ul>
        <p>Is Solo: {session.isSolo}</p>
        <p>Stage: {session.stage}</p>
        {/* If you have more session data, display it here */}
      </>
    );
  } catch (error) {
    // Handle any errors that might occur during the query
    console.error("Error fetching session:", error);
    return <div>Error loading session</div>;
  }
}