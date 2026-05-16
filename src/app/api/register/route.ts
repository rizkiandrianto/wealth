import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isRegistrationEnabled } from "@/lib/settings";

export async function POST(req: Request) {
  if (!(await isRegistrationEnabled())) {
    return NextResponse.json(
      { error: "Registration is currently disabled", code: "REGISTRATION_DISABLED" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const { name, email, password } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashed })
    .returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json(user, { status: 201 });
}
