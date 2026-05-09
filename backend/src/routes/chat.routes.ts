import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { streamChat } from "../services/chatService.js";
import { getSession, createSession, appendMessage } from "../services/chatSessionStore.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import Question from "../models/Question.js";

const router = Router();

// POST /api/chat
// Body: { message: string, questionId: string, sessionId: string }
// Response: text/event-stream (SSE)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { message, questionId, sessionId, language } = req.body;

  // Validate inputs
  if (!message || !questionId || !sessionId) {
    res.status(400).json({ error: "message, questionId, and sessionId are required" });
    return;
  }

  // Get or create session
  let session = getSession(sessionId);
  if (!session) {
    // Fetch question details to provide context
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    session = createSession(sessionId, {
      title: question.title,
      description: question.description,
      constraints: question.constraints,
      sampleInput: question.sampleInput,
      sampleOutput: question.sampleOutput,
      difficulty: question.difficulty,
      tags: question.tags,
    });
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Add user message to history
    appendMessage(sessionId, new HumanMessage(message));

    console.log(`[Chat] Starting AI stream for question: ${questionId} (session: ${sessionId})`);

    // Stream the response
    let fullResponse = "";
    for await (const chunk of streamChat(message, session.messages, session.questionContext, language)) {
      fullResponse += chunk;
      // SSE format: "data: <content>\n\n"
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    // Add assistant response to history
    appendMessage(sessionId, new AIMessage(fullResponse));

    console.log(`[Chat] Stream completed successfully for session: ${sessionId}`);

    // Signal end of stream
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error(`[Chat] Error during stream for session ${sessionId}:`, error);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

export default router;
