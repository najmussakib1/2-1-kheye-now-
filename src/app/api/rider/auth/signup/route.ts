import { NextResponse } from 'next/server';
import { createRiderInDb, findRiderByEmailOrPhoneFromDb } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      phone_number,
      email,
      password,
      vehicle_type,
      vehicle_number,
      driving_license,
      nid_number,
      address,
    } = body;

    // Validation
    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }
    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check duplicate
    const existing = findRiderByEmailOrPhoneFromDb(email.trim());
    if (existing) {
      return NextResponse.json({ success: false, error: 'A rider with this email already exists' }, { status: 409 });
    }
    const existingPhone = findRiderByEmailOrPhoneFromDb(phone_number.trim());
    if (existingPhone) {
      return NextResponse.json({ success: false, error: 'A rider with this phone number already exists' }, { status: 409 });
    }

    const password_hash = hashPassword(password);

    const rider = createRiderInDb({
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      email: email.toLowerCase().trim(),
      vehicle_type: vehicle_type || 'Motorcycle',
      vehicle_number: vehicle_number?.trim() || undefined,
      driving_license: driving_license?.trim() || undefined,
      nid_number: nid_number?.trim() || undefined,
      address: address?.trim() || undefined,
      password_hash,
    });

    const token = createSessionToken({
      id: rider.id,
      full_name: rider.full_name,
      email: rider.email,
      phone_number: rider.phone_number,
      role: 'rider',
    });

    const response = NextResponse.json({
      success: true,
      role: 'rider',
      message: 'Rider account created successfully!',
      rider,
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
    console.error('Error in rider signup API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create rider account. Please check your data.' },
      { status: 500 }
    );
  }
}
