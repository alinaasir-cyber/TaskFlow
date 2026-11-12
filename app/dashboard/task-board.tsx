"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type TaskStatus = "pending" | "completed";
type TaskPriority = "Low" | "Medium" | "High";
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
};
type Filter = "all" | TaskStatus;

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-rose-50 text-rose-700",
};

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [isCreating, setIsCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === "all" || task.status === filter),
    [filter, tasks],
  );
  const activeCount = tasks.filter((task) => task.status === "pending").length;
  const completedCount = tasks.length - activeCount;

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks", { signal: controller.signal });
        const result: { tasks?: Task[]; error?: string } = await response.json();
        if (!response.ok || !result.tasks) {
          setError(result.error ?? "Unable to load tasks.");
          return;
        }

        setTasks(result.tasks);
      } catch {
        if (!controller.signal.aborted) {
          setError("We couldn't load your tasks. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();
    return () => controller.abort();
  }, []);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });

      const result: { task?: Task; error?: string } = await response.json();
      if (!response.ok || !result.task) {
        setError(result.error ?? "Unable to create task.");
        return;
      }

      setTasks((current) => [result.task!, ...current]);
      setTitle("");
      setDescription("");
      setPriority("Medium");
    } catch {
      setError("We couldn't reach TaskFlow. Check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateTask(id: string, changes: Partial<Pick<Task, "status">>) {
    setError("");
    setBusyTaskId(id);

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const result: { task?: Task; error?: string } = await response.json();
      if (!response.ok || !result.task) {
        setError(result.error ?? "Unable to update task.");
        return;
      }

      setTasks((current) => current.map((task) => (task.id === id ? result.task! : task)));
    } catch {
      setError("We couldn't reach TaskFlow. Check your connection and try again.");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function deleteTask(id: string) {
    setError("");
    setBusyTaskId(id);

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result: unknown = await response.json();
        setError(getErrorMessage(result) ?? "Unable to delete task.");
        return;
      }

      setTasks((current) => current.filter((task) => task.id !== id));
    } catch {
      setError("We couldn't reach TaskFlow. Check your connection and try again.");
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={createTask}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-lg font-medium text-indigo-600">
            +
          </span>
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="task-title">
              Task title
            </label>
            <input
              autoComplete="off"
              className="w-full border-0 bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
              id="task-title"
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
              required
              value={title}
            />
            <label className="sr-only" htmlFor="task-description">
              Task description
            </label>
            <input
              className="mt-2 w-full border-0 bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              id="task-description"
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a little detail (optional)"
              value={description}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Priority
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              value={priority}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <button
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating || !title.trim()}
            type="submit"
          >
            {isCreating ? "Adding task..." : "Add task"}
          </button>
        </div>
      </form>

      <section aria-labelledby="tasks-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900" id="tasks-heading">
              Your tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeCount} active · {completedCount} completed
            </p>
          </div>
          <div aria-label="Filter tasks" className="flex w-fit rounded-xl bg-slate-100 p-1" role="group">
            {(
              [
                ["all", "All"],
                ["pending", "Active"],
                ["completed", "Completed"],
              ] as const
            ).map(([value, label]) => (
              <button
                aria-pressed={filter === value}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            aria-live="polite"
            className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <div aria-busy={isLoading} className="mt-5 space-y-3">
          {isLoading &&
            [0, 1, 2].map((item) => (
              <div
                aria-hidden="true"
                className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
                key={item}
              />
            ))}

          {visibleTasks.map((task) => {
            const isBusy = busyTaskId === task.id;

            return (
              <article
                className={`flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:gap-4 sm:p-5 ${
                  task.status === "completed" ? "opacity-75" : ""
                }`}
                key={task.id}
              >
                <input
                  aria-label={`Mark "${task.title}" ${
                    task.status === "completed" ? "active" : "completed"
                  }`}
                  checked={task.status === "completed"}
                  className="mt-1 size-5 shrink-0 cursor-pointer accent-indigo-600"
                  disabled={isBusy}
                  onChange={() =>
                    updateTask(task.id, {
                      status: task.status === "completed" ? "pending" : "completed",
                    })
                  }
                  type="checkbox"
                />
                <div className="min-w-0 flex-1">
                  <h3
                    className={`break-words font-medium text-slate-900 ${
                      task.status === "completed" ? "text-slate-400 line-through" : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
                    >
                      {task.priority} priority
                    </span>
                    <span className="text-xs text-slate-400">Added {formatDate(task.createdAt)}</span>
                  </div>
                </div>
                <button
                  aria-label={`Delete "${task.title}"`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => deleteTask(task.id)}
                  type="button"
                >
                  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                    <path
                      d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </button>
              </article>
            );
          })}

          {!isLoading && visibleTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                ✓
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "pending"
                    ? "You’re all caught up"
                    : "A fresh start"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {filter === "all"
                  ? "Add a task above to get your day moving."
                  : "Tasks in this filter will show up here."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
