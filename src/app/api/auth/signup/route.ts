import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/lib/auth';
import { logger } from '@/lib/utils';
import { checkRateLimit, SIGNUP_RATE_LIMIT } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT);
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
    const { name, phone, email, password, rememberMe } = body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required (name, phone, email, password)' },
        { status: 400 }
      );
    }

    // Validate name
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate password length (upper bound prevents bcrypt DoS)
    if (typeof password !== 'string' || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be at most 128 characters' },
        { status: 400 }
      );
    }

    // Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Normalize phone (remove spaces, dashes)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if email already exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingUserByPhone = await db.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (defaults: role=USER, status=PENDING from Prisma schema)
    const user = await db.user.create({
      data: {
        name: name.trim(),
        phone: normalizedPhone,
        email: email.toLowerCase(),
        password: hashedPassword,
        level: 'BEGINNER',
      },
    });

    // Do NOT issue a JWT — user must wait for admin approval
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
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation (race condition on email/phone)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Email or phone number already registered' },
        { status: 409 }
      );
    }
    logger.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during signup' },
      { status: 500 }
    );
  }
}
