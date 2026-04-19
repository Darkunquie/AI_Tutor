import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken, validateEmail, needsRehash, hashPassword } from '@/lib/auth';
import { checkRateLimit, LOGIN_RATE_LIMIT, getClientIp } from '@/lib/rate-limiter';
import { withErrorHandling } from '@/lib/error-handler';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limit by IP — return early to preserve the Retry-After header
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
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
  const { email, password, rememberMe } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  if (typeof email !== 'string' || email.length > 254) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 }
    );
  }
  if (typeof password !== 'string' || password.length > 72) {
    return NextResponse.json(
      { error: 'Invalid password' },
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

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Dummy compare to prevent timing-based user enumeration
    await comparePassword(password, '$2b$12$Ov1XZN0aMoBFahFfbJqKb.WT6EhjLLSEbH6xNQSF8YExT5SBn2oa.');
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    // Don't reveal lockout — same generic message
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const nextCount = (user.failedLoginCount || 0) + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextCount,
        lockedUntil: nextCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  if (user.status === 'PENDING') {
    return NextResponse.json(
      { error: 'Your account is pending approval. Please wait for an admin to approve your account.', status: 'PENDING' },
      { status: 403 }
    );
  }

  if (user.status === 'REJECTED') {
    return NextResponse.json(
      { error: 'Your account has been rejected. Please contact the administrator.', status: 'REJECTED' },
      { status: 403 }
    );
  }

  // Reset failed login count and record login metadata
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    },
  });

  // Lazy rehash if bcrypt rounds are outdated
  if (needsRehash(user.password)) {
    const newHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });
  }

  const token = generateToken(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    rememberMe === true
  );

  return NextResponse.json(
    {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        role: user.role,
        status: user.status,
      },
    },
    { status: 200 }
  );
});
