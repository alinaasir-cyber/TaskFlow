import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["pending", "completed"]).optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one task field to update.",
  });

export async function PUT(request: Request, context: RouteContext<"/api/tasks/[id]">) {
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

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task details." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const result = await prisma.task.updateMany({
      where: { id, userId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }

    const task = await prisma.task.findFirst({ where: { id, userId } });
    return Response.json({ task });
  } catch (error) {
    console.error("TaskFlow task update failed.", error);
    return Response.json({ error: "Unable to update task." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/tasks/[id]">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const result = await prisma.task.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("TaskFlow task deletion failed.", error);
    return Response.json({ error: "Unable to delete task." }, { status: 500 });
  }
}
