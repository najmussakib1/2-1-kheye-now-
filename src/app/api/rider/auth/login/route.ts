import { NextResponse } from 'next/server';
import { findRiderByEmailOrPhoneFromDb } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ success: false, error: 'Email or Phone Number is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const rider = findRiderByEmailOrPhoneFromDb(identifier.trim());
    if (!rider) {
      return NextResponse.json(
        { success: false, error: 'No registered rider found with this Email or Phone Number.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, rider.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password for rider account.' },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      id: rider.id,
      full_name: rider.full_name,
      email: rider.email,
      phone_number: rider.phone_number,
      role: 'rider',
    });

    const safeRider = {
      id: rider.id,
      full_name: rider.full_name,
      phone_number: rider.phone_number,
      email: rider.email,
      vehicle_type: rider.vehicle_type,
      vehicle_number: rider.vehicle_number,
      driving_license: rider.driving_license,
      nid_number: rider.nid_number,
      address: rider.address,
      avatar_url: rider.avatar_url,
      status: rider.status,
      total_deliveries: rider.total_deliveries,
      rating: rider.rating,
      earnings: rider.earnings,
    };

    const response = NextResponse.json({
      success: true,
      role: 'rider',
      message: 'Signed in successfully to Rider Portal!',
      rider: safeRider,
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
    console.error('Error in rider login API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during rider login' },
      { status: 500 }
    );
  }
}
