import { hash } from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(72)
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must be no more than 72 bytes.",
    ),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration details." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await hash(parsed.data.password, 12),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("TaskFlow account registration failed.", error);
    return Response.json({ error: "Unable to create your account." }, { status: 500 });
  }

  return Response.json({ message: "Account created." }, { status: 201 });
}
