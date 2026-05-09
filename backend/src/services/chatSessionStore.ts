import { BaseMessage } from "@langchain/core/messages";

export interface QuestionContext {
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  difficulty: string;
  tags: string[];
}

export interface ChatSession {
  messages: BaseMessage[];
  lastAccessed: Date;
  questionContext: QuestionContext;
}

const sessions = new Map<string, ChatSession>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_PAIRS = 20; // Keep last 20 exchanges (40 messages)

// Cleanup stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastAccessed.getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

export function getSession(sessionId: string): ChatSession | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccessed = new Date();
  }
  return session;
}

export function createSession(sessionId: string, questionContext: QuestionContext): ChatSession {
  const session: ChatSession = {
    messages: [],
    lastAccessed: new Date(),
    questionContext,
  };
  sessions.set(sessionId, session);
  return session;
}

export function appendMessage(sessionId: string, message: BaseMessage): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messages.push(message);
    session.lastAccessed = new Date();
    trimHistory(sessionId);
  }
}

export function trimHistory(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    // Keep max (MAX_HISTORY_PAIRS * 2) messages
    const maxMessages = MAX_HISTORY_PAIRS * 2;
    if (session.messages.length > maxMessages) {
      session.messages = session.messages.slice(-maxMessages);
    }
  }
}
