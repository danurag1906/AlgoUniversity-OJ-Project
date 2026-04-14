import { useEffect, useState, useRef } from "react";
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
  uploadTestCases,
  type QuestionListItem,
  type CreateQuestionPayload,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const ALL_TAGS = [
  "Array",
  "String",
  "Hash Table",
  "Math",
  "Sorting",
  "Greedy",
  "Binary Search",
  "DP",
  "Graph",
  "Tree",
  "Stack",
  "Queue",
  "Linked List",
  "Recursion",
  "Backtracking",
  "Sliding Window",
  "Two Pointers",
  "Bit Manipulation",
  "Heap",
  "Trie",
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Hard: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

interface QuestionForm {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
}

const emptyForm: QuestionForm = {
  title: "",
  description: "",
  difficulty: "Easy",
  tags: [],
  sampleInput: "",
  sampleOutput: "",
  constraints: "",
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<QuestionForm>({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Test case upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<Record<string, { type: string; text: string }>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (e) {
      console.error("Failed to load questions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleCreate = async () => {
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setCreating(true);
    try {
      const payload: CreateQuestionPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        tags: form.tags,
        sampleInput: form.sampleInput.trim(),
        sampleOutput: form.sampleOutput.trim(),
        constraints: form.constraints.trim(),
      };
      await createQuestion(payload);
      setDialogOpen(false);
      setForm({ ...emptyForm });
      loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create question");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(id);
      loadQuestions();
    } catch (e) {
      console.error("Failed to delete question:", e);
    }
  };

  const handleTestCaseUpload = async (questionId: string, file: File) => {
    setUploadingId(questionId);
    try {
      await uploadTestCases(questionId, file);
      setUploadMessage({
        ...uploadMessage,
        [questionId]: { type: "success", text: `Uploaded: ${file.name}` },
      });
    } catch (e) {
      setUploadMessage({
        ...uploadMessage,
        [questionId]: {
          type: "error",
          text: e instanceof Error ? e.message : "Upload failed",
        },
      });
    } finally {
      setUploadingId(null);
    }
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground text-sm">
            Create, manage, and upload test cases for coding problems
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button id="create-question-btn">+ New Question</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Fill in the details for the new coding problem
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="question-title">Title</Label>
                <Input
                  id="question-title"
                  placeholder="e.g., Two Sum"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="question-description">Description</Label>
                <Textarea
                  id="question-description"
                  placeholder="Describe the problem statement..."
                  rows={6}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(val) => setForm({ ...form, difficulty: val })}
                >
                  <SelectTrigger id="question-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={form.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer select-none transition-colors"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sample Input */}
              <div className="space-y-2">
                <Label htmlFor="sample-input">Sample Input</Label>
                <Textarea
                  id="sample-input"
                  placeholder="1 2 3"
                  rows={3}
                  className="font-mono text-sm"
                  value={form.sampleInput}
                  onChange={(e) => setForm({ ...form, sampleInput: e.target.value })}
                />
              </div>

              {/* Sample Output */}
              <div className="space-y-2">
                <Label htmlFor="sample-output">Sample Output</Label>
                <Textarea
                  id="sample-output"
                  placeholder="6"
                  rows={3}
                  className="font-mono text-sm"
                  value={form.sampleOutput}
                  onChange={(e) => setForm({ ...form, sampleOutput: e.target.value })}
                />
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  placeholder="1 ≤ n ≤ 10^5"
                  rows={3}
                  className="font-mono text-sm"
                  value={form.constraints}
                  onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setForm({ ...emptyForm });
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  id="save-question-btn"
                >
                  {creating ? "Creating..." : "Create Question"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      {loading ? (
        <p className="text-muted-foreground">Loading questions...</p>
      ) : questions.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              No questions yet. Create your first one!
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q._id}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold truncate">{q.title}</span>
                      <Badge
                        variant="outline"
                        className={difficultyColors[q.difficulty]}
                      >
                        {q.difficulty}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {q.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Upload message */}
                    {uploadMessage[q._id] && (
                      <p
                        className={`text-xs mt-1 ${
                          uploadMessage[q._id].type === "success"
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {uploadMessage[q._id].text}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Upload Test Cases */}
                    <div>
                      <input
                        type="file"
                        accept=".zip"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && uploadingId === null) {
                            handleTestCaseUpload(q._id, file);
                          }
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingId === q._id}
                        onClick={() => {
                          setUploadingId(null);
                          // Use a fresh file input to avoid conflicts
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".zip";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleTestCaseUpload(q._id, file);
                          };
                          input.click();
                        }}
                      >
                        {uploadingId === q._id ? "Uploading..." : "📁 Upload Tests"}
                      </Button>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(q._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
