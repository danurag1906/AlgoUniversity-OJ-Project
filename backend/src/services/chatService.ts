import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { QuestionContext } from "./chatSessionStore.js";

// Use gemini-2.0-flash as it is free/cheap and extremely capable for this task.
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  temperature: 0.7,
  streaming: true,
});

const systemPrompt = `You are an AI tutor for a competitive programming platform called AlgoUniversity.

Your role is to help students develop problem-solving intuition — NOT to give direct solutions.

## Rules:
1. **Never provide complete code solutions** unless the user explicitly asks: "give me code", "show me the code", "write code for me", or similar clear requests.
2. When giving hints, guide the user through:
   - Pattern recognition (what type of problem is this?)
   - Key observations about the constraints (what do they tell us about expected time complexity?)
   - Conceptual approach (what data structure or algorithm paradigm applies?)
   - Step-by-step intuition building (walk through the sample test case)
3. Use the Socratic method — ask guiding questions when appropriate.
4. If the user asks for code, provide it with detailed explanations of WHY each part works, not just WHAT it does.
5. Be encouraging and supportive. Never make the user feel stupid.
6. Keep responses concise but thorough. Use markdown formatting.

## Problem Context:
- **Title**: {title}
- **Difficulty**: {difficulty}
- **Tags**: {tags}
- **Description**: {description}
- **Constraints**: {constraints}
- **Sample Input**: {sampleInput}
- **Sample Output**: {sampleOutput}

## User Context:
- **Selected Language**: {language} (If you provide any code, you MUST write it in this language!)
`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chain = prompt.pipe(model);

export async function* streamChat(
  input: string,
  history: BaseMessage[],
  questionContext: QuestionContext,
  language?: string
): AsyncGenerator<string> {
  const stream = await chain.stream({
    input,
    history,
    title: questionContext.title || "N/A",
    difficulty: questionContext.difficulty || "N/A",
    tags: questionContext.tags?.join(", ") || "N/A",
    description: questionContext.description || "N/A",
    constraints: questionContext.constraints || "N/A",
    sampleInput: questionContext.sampleInput || "N/A",
    sampleOutput: questionContext.sampleOutput || "N/A",
    language: language || "Any",
  });

  for await (const chunk of stream) {
    const content = chunk.content;
    if (typeof content === "string" && content.length > 0) {
      yield content;
    }
  }
}
