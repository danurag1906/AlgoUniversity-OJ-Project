import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useSession } from "@/lib/auth-client";
import {
  fetchQuestion,
  runCode,
  submitCode,
  fetchMySubmissions,
  type Question,
  type Submission,
  type ExecutionResult,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const LANGUAGE_MAP: Record<
  string,
  { label: string; monacoLang: string; defaultCode: string }
> = {
  cpp: {
    label: "C++",
    monacoLang: "cpp",
    defaultCode: `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <map>
#include <set>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
  },
  java: {
    label: "Java",
    monacoLang: "java",
    defaultCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        
    }
}`,
  },
  python: {
    label: "Python",
    monacoLang: "python",
    defaultCode: `# Your code here
`,
  },
};

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Hard: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusColors: Record<string, string> = {
  Pending: "text-yellow-600",
  Accepted: "text-emerald-600",
  "Wrong Answer": "text-rose-600",
  "Runtime Error": "text-rose-600",
  "Time Limit Exceeded": "text-amber-600",
  "Compilation Error": "text-rose-600",
};

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>("cpp");
  const [code, setCode] = useState(LANGUAGE_MAP.cpp.defaultCode);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState("description");
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [resultMode, setResultMode] = useState<"run" | "submit" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadQuestion = async () => {
      setLoading(true);
      try {
        const data = await fetchQuestion(id);
        setQuestion(data);
      } catch (error) {
        console.error("Failed to load question:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuestion();
  }, [id]);

  useEffect(() => {
    if (!id || !session) return;
    const loadSubmissions = async () => {
      try {
        const data = await fetchMySubmissions(id);
        setSubmissions(data);
      } catch (error) {
        console.error("Failed to load submissions:", error);
      }
    };
    loadSubmissions();
  }, [id, session]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(LANGUAGE_MAP[newLang].defaultCode);
  };

  // Run against sample test case only
  const handleRun = async () => {
    if (!id || !session) return;
    setRunning(true);
    setExecutionResult(null);
    setErrorMessage(null);
    setResultMode("run");
    try {
      const response = await runCode(id, language, code);
      setExecutionResult(response.result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Run failed"
      );
    } finally {
      setRunning(false);
    }
  };

  // Submit against all test cases
  const handleSubmit = async () => {
    if (!id || !session) return;
    setSubmitting(true);
    setExecutionResult(null);
    setErrorMessage(null);
    setResultMode("submit");
    try {
      const response = await submitCode(id, language, code);
      setExecutionResult(response.result);
      // Refresh submissions list
      const updatedSubmissions = await fetchMySubmissions(id);
      setSubmissions(updatedSubmissions);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Question Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/problems">
              <Button>Back to Problems</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = running || submitting;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          to="/problems"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          ← Back to Problems
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel — Problem Description */}
          <div className="space-y-4">
            {/* Title & Difficulty */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{question.title}</h1>
                <Badge
                  variant="outline"
                  className={difficultyColors[question.difficulty]}
                >
                  {question.difficulty}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="submissions">
                  Submissions{" "}
                  {submissions.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({submissions.length})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4 mt-4">
                {/* Description */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {question.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Constraints */}
                {question.constraints && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Constraints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                        {question.constraints}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Sample Test Cases */}
                {(question.sampleInput || question.sampleOutput) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Sample Test Case
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {question.sampleInput && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Input
                          </p>
                          <pre className="bg-muted rounded-md px-3 py-2 text-sm font-mono overflow-x-auto">
                            {question.sampleInput}
                          </pre>
                        </div>
                      )}
                      {question.sampleOutput && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Output
                          </p>
                          <pre className="bg-muted rounded-md px-3 py-2 text-sm font-mono overflow-x-auto">
                            {question.sampleOutput}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                {!session ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-3">
                        Sign in to view your submissions
                      </p>
                      <Link to="/signin">
                        <Button size="sm">Sign In</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : submissions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No submissions yet. Write your solution and submit!
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <Card key={sub._id}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className={`font-medium text-sm ${
                                  statusColors[sub.status] || "text-foreground"
                                }`}
                              >
                                {sub.status}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {LANGUAGE_MAP[sub.language]?.label ||
                                  sub.language}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(sub.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel — Code Editor + Results */}
          <div className="space-y-3">
            {/* Language Selector + Actions */}
            <div className="flex items-center justify-between">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-36" id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                {session ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRun}
                      disabled={isProcessing || !code.trim()}
                      className="min-w-[80px]"
                      id="run-code-btn"
                    >
                      {running ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Running
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          ▶ Run
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing || !code.trim()}
                      className="min-w-[100px]"
                      id="submit-code-btn"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Submitting
                        </span>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </>
                ) : (
                  <Link to="/signin">
                    <Button id="signin-to-submit-btn">
                      Sign In to Submit
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Code Editor */}
            <Card className="overflow-hidden">
              <div className="border-b px-4 py-2 bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {LANGUAGE_MAP[language].label} Editor
                </span>
              </div>
              <div className="h-[400px]">
                <Editor
                  height="100%"
                  language={LANGUAGE_MAP[language].monacoLang}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    roundedSelection: true,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "on",
                  }}
                />
              </div>
            </Card>

            {/* Results Panel */}
            <ResultsPanel
              executionResult={executionResult}
              resultMode={resultMode}
              errorMessage={errorMessage}
              isProcessing={isProcessing}
            />

            <Separator />

            {/* Info for non-logged-in users */}
            {!session && (
              <Card className="bg-muted/30">
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    You can view the problem and write code, but{" "}
                    <Link
                      to="/signin"
                      className="text-primary font-medium hover:underline"
                    >
                      sign in
                    </Link>{" "}
                    to run and submit your solution.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Results Panel Component ----

function ResultsPanel({
  executionResult,
  resultMode,
  errorMessage,
  isProcessing,
}: {
  executionResult: ExecutionResult | null;
  resultMode: "run" | "submit" | null;
  errorMessage: string | null;
  isProcessing: boolean;
}) {
  // Show a loading state while processing
  if (isProcessing) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3">
            <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">
              {resultMode === "run"
                ? "Running against sample test case..."
                : "Running against all test cases..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if there was one
  if (errorMessage) {
    return (
      <Card className="border-rose-500/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-rose-600">Error</span>
          </div>
          <p className="text-sm text-rose-600">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // No result yet
  if (!executionResult) return null;

  const isAccepted = executionResult.overallStatus === "Accepted";
  const statusColor = isAccepted ? "text-emerald-600" : "text-rose-600";
  const borderColor = isAccepted ? "border-emerald-500/30" : "border-rose-500/30";
  const bgColor = isAccepted ? "bg-emerald-500/5" : "bg-rose-500/5";

  return (
    <Card className={borderColor}>
      <CardContent className="py-4 space-y-3">
        {/* Overall status header */}
        <div className={`flex items-center justify-between rounded-md px-3 py-2 ${bgColor}`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${statusColor}`}>
              {executionResult.overallStatus}
            </span>
            <Badge variant="outline" className="text-xs">
              {resultMode === "run" ? "Sample Run" : "Submission"}
            </Badge>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {executionResult.totalPassed}/{executionResult.totalTestCases} passed
          </span>
        </div>

        {/* Compilation error */}
        {executionResult.compilationError && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Compilation Error
            </p>
            <pre className="bg-rose-500/5 border border-rose-500/20 rounded-md px-3 py-2 text-xs font-mono text-rose-600 overflow-x-auto max-h-40 overflow-y-auto">
              {executionResult.compilationError}
            </pre>
          </div>
        )}

        {/* Test case results */}
        {executionResult.testCases.length > 0 && (
          <div className="space-y-2">
            {executionResult.testCases.map((tc) => (
              <TestCaseCard key={tc.testCase} tc={tc} resultMode={resultMode} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Single Test Case Card ----

function TestCaseCard({
  tc,
  resultMode,
}: {
  tc: {
    testCase: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    error?: string;
  };
  resultMode: "run" | "submit" | null;
}) {
  const [expanded, setExpanded] = useState(
    // Auto-expand if it's a run (only 1 test case) or if it failed
    resultMode === "run" || !tc.passed
  );

  return (
    <div
      className={`rounded-md border ${
        tc.passed ? "border-emerald-500/20" : "border-rose-500/20"
      }`}
    >
      {/* Test case header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors rounded-md"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${
              tc.passed ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {tc.passed ? "✓" : "✗"}
          </span>
          <span className="text-sm font-medium">Test Case {tc.testCase}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              statusColors[tc.status] || "text-foreground"
            }`}
          >
            {tc.status}
          </span>
          <span className="text-xs text-muted-foreground">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t">
          {/* Input */}
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Input
            </p>
            <pre className="bg-muted rounded px-2 py-1.5 text-xs font-mono overflow-x-auto max-h-24 overflow-y-auto">
              {tc.input || "(empty)"}
            </pre>
          </div>

          {/* Expected Output */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Expected Output
            </p>
            <pre className="bg-muted rounded px-2 py-1.5 text-xs font-mono overflow-x-auto max-h-24 overflow-y-auto">
              {tc.expectedOutput || "(empty)"}
            </pre>
          </div>

          {/* Your Output */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Your Output
            </p>
            <pre
              className={`rounded px-2 py-1.5 text-xs font-mono overflow-x-auto max-h-24 overflow-y-auto ${
                tc.passed
                  ? "bg-emerald-500/5 text-emerald-700"
                  : "bg-rose-500/5 text-rose-700"
              }`}
            >
              {tc.actualOutput || "(no output)"}
            </pre>
          </div>

          {/* Runtime error */}
          {tc.error && (
            <div>
              <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">
                Error
              </p>
              <pre className="bg-rose-500/5 border border-rose-500/20 rounded px-2 py-1.5 text-xs font-mono text-rose-600 overflow-x-auto max-h-24 overflow-y-auto">
                {tc.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
