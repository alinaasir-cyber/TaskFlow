import { z } from "zod";
import { TaskStatus } from "@/generated/prisma/client";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status");
  if (status && status !== "pending" && status !== "completed") {
    return Response.json({ error: "Status must be pending or completed." }, { status: 400 });
  }

  const taskStatus =
    status === "pending"
      ? TaskStatus.pending
      : status === "completed"
        ? TaskStatus.completed
        : undefined;

  try {
    const tasks = await prisma.task.findMany({
      where: { userId, ...(taskStatus ? { status: taskStatus } : {}) },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return Response.json({ tasks });
  } catch (error) {
    console.error("TaskFlow task list request failed.", error);
    return Response.json({ error: "Unable to load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task details." },
      { status: 400 },
    );
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        userId,
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("TaskFlow task creation failed.", error);
    return Response.json({ error: "Unable to create task." }, { status: 500 });
  }
}
