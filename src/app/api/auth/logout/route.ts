import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // For JWT-based auth, logout is primarily client-side (clearing localStorage/token)
    // This endpoint is here for consistency and can be extended later
    // for features like token blacklisting if needed

    return NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    );
  }
}
