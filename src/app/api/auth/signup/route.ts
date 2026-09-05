import { NextResponse } from 'next/server';
import { createUserInDb, findUserByEmailOrPhoneFromDb } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, phone_number, address, gender, avatar_url, email, password } = body;

    // 1. Input Validation
    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ success: false, error: 'Full Name is required' }, { status: 400 });
    }
    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone Number is required' }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid E-mail address is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // 2. Check for duplicate Email
    const existingByEmail = findUserByEmailOrPhoneFromDb(email.trim());
    if (existingByEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this E-mail address already exists.' },
        { status: 409 }
      );
    }

    // 3. Check for duplicate Phone
    const existingByPhone = findUserByEmailOrPhoneFromDb(phone_number.trim());
    if (existingByPhone) {
      return NextResponse.json(
        { success: false, error: 'An account with this Phone Number already exists.' },
        { status: 409 }
      );
    }

    // 4. Hash Password securely
    const password_hash = hashPassword(password);

    // 5. Create user in SQLite database
    const newUser = createUserInDb({
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      email: email.trim(),
      address: address ? address.trim() : '',
      gender: gender || 'Other',
      avatar_url: avatar_url || '',
      password_hash,
    });

    // 6. Generate Session Token
    const token = createSessionToken({ ...newUser, role: 'user' });

    // 7. Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      role: 'user',
      message: 'Account created successfully!',
      user: newUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in signup API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
