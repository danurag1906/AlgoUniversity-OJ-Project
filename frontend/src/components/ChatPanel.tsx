import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlock = match || String(children).includes("\n");

  if (isBlock) {
    const lang = match ? match[1] : "text";
    return (
      <div className="relative group rounded-md bg-zinc-950 my-4 overflow-hidden border border-zinc-800 not-prose">
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
          <span className="text-xs font-mono text-zinc-400">{lang}</span>
          <button
            onClick={handleCopy}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="overflow-x-auto p-4 text-sm">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={lang === "text" ? undefined : lang}
            PreTag="div"
            customStyle={{ margin: 0, padding: 0, background: "transparent" }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code className="bg-muted-foreground/20 rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
      {children}
    </code>
  );
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  questionId: string;
  language: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ChatPanel({ questionId, language }: ChatPanelProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !session) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]); // placeholder
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          questionId,
          sessionId: sessionIdRef.current,
          language,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // The last element is either an incomplete line or an empty string, keep it in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: "Error: " + data.error };
                return updated;
              });
              break;
            }
            if (data.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + data.content };
                return updated;
              });
            }
          } catch (e) {
            console.error("Failed to parse SSE line:", line, e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.content === "") {
            updated[updated.length - 1] = { ...last, content: "Sorry, I encountered an error." };
        }
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!session) {
    return (
      <Card className="h-full flex flex-col border-none shadow-none">
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-4">
            <span className="text-4xl">🤖</span>
            <p>Sign in to chat with our AI tutor for hints and approaches!</p>
            <Link to="/signin">
                <Button>Sign In to Chat</Button>
            </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-2 h-full">
                <span className="text-4xl">💡</span>
                <p className="text-sm">Ask me for hints, patterns, or intuition on how to approach this problem.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setInput("What pattern does this problem use?")}>What pattern?</Button>
                    <Button variant="outline" size="sm" onClick={() => setInput("Can you walk me through the sample testcase?")}>Explain sample</Button>
                    <Button variant="outline" size="sm" onClick={() => setInput("What time complexity is expected based on constraints?")}>Analyze constraints</Button>
                </div>
            </div>
        ) : (
            messages.map((msg, index) => (
            <div
                key={index}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
                <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                    msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                >
                {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert prose-p:leading-snug prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0 max-w-[85vw] sm:max-w-none">
                        {isTyping && index === messages.length - 1 && msg.content === "" ? (
                            <div className="flex gap-1.5 items-center py-2 h-6">
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></span>
                            </div>
                        ) : (
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{ code: CodeBlock }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        )}
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
                </div>
            </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a hint..."
            className="flex-1 min-h-[40px] max-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            rows={1}
            disabled={isTyping}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isTyping} size="icon" className="h-[40px] w-[40px] shrink-0">
            {isTyping ? (
                 <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
                "↑"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
