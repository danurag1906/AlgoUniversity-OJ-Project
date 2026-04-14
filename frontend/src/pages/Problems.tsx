import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchQuestions, type QuestionListItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ProblemsPage() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions({
        search: search || undefined,
        difficulty: difficulty || undefined,
        tags: selectedTag || undefined,
      });
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [difficulty, selectedTag]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const clearFilters = () => {
    setSearch("");
    setDifficulty("");
    setSelectedTag("");
  };

  const hasFilters = search || difficulty || selectedTag;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
          <p className="text-muted-foreground mt-1">
            Practice DSA problems and improve your coding skills
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:flex-1"
                id="search-problems"
              />
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="sm:w-40" id="filter-difficulty">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="sm:w-48" id="filter-tag">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {hasFilters
                  ? "No problems match your filters"
                  : "No problems available yet"}
              </CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-4">Tags</div>
            </div>

            {questions.map((question, index) => (
              <Link key={question._id} to={`/problems/${question._id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                  <CardContent className="py-4 px-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground font-mono">
                        {index + 1}
                      </div>
                      <div className="col-span-5">
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {question.title}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Badge
                          variant="outline"
                          className={difficultyColors[question.difficulty]}
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <div className="col-span-4 flex flex-wrap gap-1">
                        {question.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[11px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags.length > 3 && (
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                            +{question.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {!loading && questions.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {questions.length} problem{questions.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
