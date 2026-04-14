const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Helper to make authenticated API requests (sends cookies)
async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  return response;
}

// Helper for multipart form data (file uploads)
async function apiUpload(path: string, formData: FormData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return response;
}

// ---- Question APIs ----

export interface Question {
  _id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
  testCaseFileName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionListItem {
  _id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  createdAt: string;
}

export interface QuestionFilters {
  difficulty?: string;
  tags?: string;
  search?: string;
}

export async function fetchQuestions(filters: QuestionFilters = {}): Promise<QuestionListItem[]> {
  const params = new URLSearchParams();
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.tags) params.set("tags", filters.tags);
  if (filters.search) params.set("search", filters.search);

  const queryString = params.toString();
  const path = `/api/questions${queryString ? `?${queryString}` : ""}`;

  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return data.questions;
}

export async function fetchQuestion(id: string): Promise<Question> {
  const res = await apiFetch(`/api/questions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch question");
  const data = await res.json();
  return data.question;
}

// ---- Admin Question APIs ----

export interface CreateQuestionPayload {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<Question> {
  const res = await apiFetch("/api/admin/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create question");
  }
  const data = await res.json();
  return data.question;
}

export async function updateQuestion(
  id: string,
  payload: Partial<CreateQuestionPayload>
): Promise<Question> {
  const res = await apiFetch(`/api/admin/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update question");
  }
  const data = await res.json();
  return data.question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/questions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete question");
  }
}

export async function uploadTestCases(questionId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("testcases", file);
  const res = await apiUpload(`/api/admin/questions/${questionId}/testcases`, formData);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to upload test cases");
  }
}

// ---- Submission & Execution APIs ----

export interface TestCaseResult {
  testCase: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: string;
  error?: string;
}

export interface ExecutionResult {
  overallStatus: string;
  testCases: TestCaseResult[];
  compilationError?: string;
  totalPassed: number;
  totalTestCases: number;
}

export interface Submission {
  _id: string;
  questionId: string;
  userId: string;
  language: "cpp" | "java" | "python";
  code: string;
  status: string;
  createdAt: string;
}

export interface SubmitResponse {
  submission: Submission;
  result: ExecutionResult;
}

export interface RunResponse {
  result: ExecutionResult;
}

// Run code against sample test case only (quick feedback)
export async function runCode(
  questionId: string,
  language: string,
  code: string
): Promise<RunResponse> {
  const res = await apiFetch("/api/run", {
    method: "POST",
    body: JSON.stringify({ questionId, language, code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to run code");
  }
  const data = await res.json();
  return data;
}

// Submit code against ALL test cases (saves submission)
export async function submitCode(
  questionId: string,
  language: string,
  code: string
): Promise<SubmitResponse> {
  const res = await apiFetch("/api/submissions", {
    method: "POST",
    body: JSON.stringify({ questionId, language, code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit code");
  }
  const data = await res.json();
  return data;
}

export async function fetchMySubmissions(questionId?: string): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (questionId) params.set("questionId", questionId);
  const queryString = params.toString();
  const path = `/api/submissions/me${queryString ? `?${queryString}` : ""}`;

  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Failed to fetch submissions");
  const data = await res.json();
  return data.submissions;
}

// ---- Admin Stats ----

export async function fetchAdminStats() {
  const res = await apiFetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  const data = await res.json();
  return data.stats;
}

