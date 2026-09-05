import { NextResponse } from 'next/server';
import { createRestaurantInDb, findRestaurantByEmailOrPhoneOrNameFromDb } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      owner_name,
      email,
      phone_number,
      address,
      trade_licence_url,
      categories,
      image_url,
      password,
    } = body;

    // 1. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Restaurant Name is required' }, { status: 400 });
    }
    if (!owner_name || !owner_name.trim()) {
      return NextResponse.json({ success: false, error: 'Owner Name is required' }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid Email address is required' }, { status: 400 });
    }
    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone Number is required' }, { status: 400 });
    }
    if (!address || !address.trim()) {
      return NextResponse.json({ success: false, error: 'Restaurant Address is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // 2. Check duplicates
    const existing = findRestaurantByEmailOrPhoneOrNameFromDb(email.trim());
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A restaurant with this Email or Name already exists.' },
        { status: 409 }
      );
    }
    const existingPhone = findRestaurantByEmailOrPhoneOrNameFromDb(phone_number.trim());
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'A restaurant with this Phone Number already exists.' },
        { status: 409 }
      );
    }

    // 3. Hash password
    const password_hash = hashPassword(password);

    // 4. Save to database
    const newRest = createRestaurantInDb({
      name: name.trim(),
      owner_name: owner_name.trim(),
      email: email.toLowerCase().trim(),
      phone_number: phone_number.trim(),
      address: address.trim(),
      trade_licence_url: trade_licence_url || '',
      categories: Array.isArray(categories) ? categories.join(', ') : categories || 'Fast Food, Juice',
      image_url: image_url || '',
      password_hash,
    });

    // 5. Generate session token
    const token = createSessionToken({
      id: newRest.id,
      full_name: newRest.name,
      email: newRest.email,
      phone_number: newRest.phone_number,
      role: 'restaurant',
    });

    // 6. Set cookie
    const response = NextResponse.json({
      success: true,
      role: 'restaurant',
      message: 'Restaurant registered successfully!',
      restaurant: newRest,
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
    console.error('Error in restaurant signup API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during restaurant registration' },
      { status: 500 }
    );
  }
}
