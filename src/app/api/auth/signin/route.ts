import { NextResponse } from 'next/server';
import { findUserByEmailOrPhoneFromDb } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // 1. Validation
    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ success: false, error: 'E-mail or Phone Number is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // 2. Find user by email OR phone in DB
    const user = findUserByEmailOrPhoneFromDb(identifier.trim());
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this E-mail or Phone Number.' },
        { status: 401 }
      );
    }

    // 3. Verify hashed password
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // 4. Generate session token
    const token = createSessionToken({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
    });

    // 5. Set HTTP-Only cookie
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      gender: user.gender,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully!',
      user: safeUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in signin API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sign in' },
      { status: 500 }
    );
  }
}
