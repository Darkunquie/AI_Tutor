import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/infra/db';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/lib/auth';
import { checkRateLimit, SIGNUP_RATE_LIMIT, getClientIp } from '@/lib/rate-limiter';
import { withErrorHandling } from '@/lib/error-handler';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limit by IP — return early to preserve the Retry-After header
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  const { name, phone, email, password } = body;

  if (!name || !phone || !email || !password) {
    return NextResponse.json(
      { error: 'All fields are required (name, phone, email, password)' },
      { status: 400 }
    );
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return NextResponse.json(
      { error: 'Name must be between 2 and 100 characters' },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length > 72) {
    return NextResponse.json(
      { error: 'Password must be at most 72 characters' },
      { status: 400 }
    );
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid) {
    return NextResponse.json(
      { error: phoneValidation.error },
      { status: 400 }
    );
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return NextResponse.json(
      { error: emailValidation.error },
      { status: 400 }
    );
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: passwordValidation.error },
      { status: 400 }
    );
  }

  const normalizedPhone = (phone as string).replace(/[\s\-\(\)]/g, '');

  const existingUserByEmail = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUserByEmail) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    );
  }

  const existingUserByPhone = await db.user.findUnique({
    where: { phone: normalizedPhone },
  });
  if (existingUserByPhone) {
    return NextResponse.json(
      { error: 'Phone number already registered' },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);

  // Create user — Prisma P2002 (race on unique constraint) is handled by
  // withErrorHandling → handlePrismaError → 409 Conflict automatically.
  const user = await db.user.create({
    data: {
      name: name.trim(),
      phone: normalizedPhone,
      email: email.toLowerCase(),
      password: hashedPassword,
      level: 'BEGINNER',
    },
  });

  return NextResponse.json(
    {
      message: 'Account created successfully. Please wait for admin approval before you can log in.',
      status: 'PENDING',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { status: 201 }
  );
});
