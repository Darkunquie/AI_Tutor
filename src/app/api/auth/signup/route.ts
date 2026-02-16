import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  generateToken,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/lib/auth';
import { logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, password, rememberMe } = body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required (name, phone, email, password)' },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
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

    // Create user
    const user = await db.user.create({
      data: {
        name: name.trim(),
        phone: normalizedPhone,
        email: email.toLowerCase(),
        password: hashedPassword,
        level: 'BEGINNER', // Default level
      },
    });

    // Generate JWT token
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      rememberMe === true
    );

    // Return success response with token and user data
    return NextResponse.json(
      {
        message: 'Signup successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          level: user.level,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during signup' },
      { status: 500 }
    );
  }
}
