import { exec, spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import util from "util";

const execAsync = util.promisify(exec);

const TIME_LIMIT_MS = 5_000; // 5 seconds per testcase

export interface TestCaseInput {
  input: string;
  expectedOutput: string;
}

export interface TestCaseResult {
  testCase: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded" | "Compilation Error";
  error?: string;
}

export interface ExecutionResult {
  overallStatus:
    | "Accepted"
    | "Wrong Answer"
    | "Compilation Error"
    | "Runtime Error"
    | "Time Limit Exceeded";
  testCases: TestCaseResult[];
  compilationError?: string;
  totalPassed: number;
  totalTestCases: number;
}

async function createTempDir(): Promise<string> {
  const dirName = `oj-exec-${crypto.randomUUID()}`;
  const dirPath = path.join(os.tmpdir(), dirName);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

function normalizeOutput(output: string): string {
  if (!output) return "";
  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

async function prepareCode(
  tmpDir: string,
  language: string,
  code: string
): Promise<{ runCommand: string; args: string[]; compilationError?: string }> {
  if (language === "cpp") {
    const sourceFile = path.join(tmpDir, "solution.cpp");
    const binaryFile = path.join(tmpDir, "solution");
    await fs.writeFile(sourceFile, code);

    const compiler = os.platform() === "darwin" ? "c++" : "g++";
    try {
      await execAsync(`"${compiler}" -o "${binaryFile}" "${sourceFile}" -std=c++17 -O2`, {
        timeout: 10_000,
      });
    } catch (err: any) {
      return {
        runCommand: "",
        args: [],
        compilationError: err.stderr?.toString() || err.message || "Compilation failed",
      };
    }
    return { runCommand: binaryFile, args: [] };
  }

  if (language === "java") {
    const sourceFile = path.join(tmpDir, "Main.java");
    await fs.writeFile(sourceFile, code);

    try {
      await execAsync(`javac "${sourceFile}"`, { timeout: 10_000 });
    } catch (err: any) {
      return {
        runCommand: "",
        args: [],
        compilationError: err.stderr?.toString() || err.message || "Compilation failed",
      };
    }
    return { runCommand: "java", args: ["-cp", tmpDir, "Main"] };
  }

  if (language === "python") {
    const sourceFile = path.join(tmpDir, "solution.py");
    await fs.writeFile(sourceFile, code);
    const pythonCmd = os.platform() === "win32" ? "python" : "python3";
    return { runCommand: pythonCmd, args: [sourceFile] };
  }

  return { runCommand: "", args: [], compilationError: "Unsupported language" };
}

function runSingleTestCaseAsync(
  runCommand: string,
  args: string[],
  testCase: TestCaseInput,
  testCaseNumber: number
): Promise<TestCaseResult> {
  return new Promise((resolve) => {
    const result: TestCaseResult = {
      testCase: testCaseNumber,
      passed: false,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: "",
      status: "Runtime Error",
    };

    let stdout = "";
    let stderr = "";

    const process = spawn(runCommand, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Write input natively to the spawn process
    if (testCase.input) {
      process.stdin.write(testCase.input + "\n");
    }
    process.stdin.end();

    let timeoutId = setTimeout(() => {
      // If code runs infinitely, kill it!
      process.kill("SIGKILL");
      result.status = "Time Limit Exceeded";
      result.error = "Execution timed out (infinite loop?)";
      resolve(result);
    }, TIME_LIMIT_MS);

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code, signal) => {
      clearTimeout(timeoutId);
      
      // If we already resolved from a timeout kill, do nothing
      if (result.status === "Time Limit Exceeded") return;

      result.actualOutput = stdout;

      if (code !== 0 && code !== null) {
        result.status = "Runtime Error";
        result.error = stderr.slice(0, 800) || `Process exited with code ${code}`;
        resolve(result);
        return;
      }
      
      if (signal === "SIGKILL" || signal === "SIGTERM") {
        result.status = "Time Limit Exceeded";
        result.error = "Process was killed";
        resolve(result);
        return;
      }

      const normalizedActual = normalizeOutput(result.actualOutput);
      const normalizedExpected = normalizeOutput(testCase.expectedOutput);

      if (normalizedActual === normalizedExpected) {
        result.passed = true;
        result.status = "Accepted";
      } else {
        result.status = "Wrong Answer";
        // Attach stderr just in case there were warnings/errors printed along with normal output
        if (stderr.trim()) result.error = stderr;
      }

      resolve(result);
    });

    process.on("error", (error) => {
      clearTimeout(timeoutId);
      if (result.status === "Time Limit Exceeded") return;
      result.status = "Runtime Error";
      result.error = error.message;
      resolve(result);
    });
  });
}

// Main execution function using totally non-blocking local OS child processes
export async function executeCode(
  language: string,
  code: string,
  testCases: TestCaseInput[]
): Promise<ExecutionResult> {
  const tmpDir = await createTempDir();

  try {
    // Step 1: Compile (Async)
    const { runCommand, args, compilationError } = await prepareCode(tmpDir, language, code);

    if (compilationError || !runCommand) {
      return {
        overallStatus: "Compilation Error",
        testCases: [],
        compilationError,
        totalPassed: 0,
        totalTestCases: testCases.length,
      };
    }

    // Step 2: Run all test cases in sequence using Spawn
    const results: TestCaseResult[] = [];
    let allPassed = true;
    let hasRuntimeError = false;
    let hasTLE = false;

    for (let i = 0; i < testCases.length; i++) {
      const tcResult = await runSingleTestCaseAsync(runCommand, args, testCases[i], i + 1);
      results.push(tcResult);

      if (!tcResult.passed) {
        allPassed = false;
        if (tcResult.status === "Runtime Error") hasRuntimeError = true;
        if (tcResult.status === "Time Limit Exceeded") hasTLE = true;
      }
    }

    // Determine overall status
    let overallStatus: ExecutionResult["overallStatus"];
    if (allPassed) {
      overallStatus = "Accepted";
    } else if (hasTLE) {
      overallStatus = "Time Limit Exceeded";
    } else if (hasRuntimeError) {
      overallStatus = "Runtime Error";
    } else {
      overallStatus = "Wrong Answer";
    }

    const totalPassed = results.filter((r) => r.passed).length;

    return {
      overallStatus,
      testCases: results,
      totalPassed,
      totalTestCases: testCases.length,
    };
  } finally {
    await cleanupTempDir(tmpDir);
  }
}
