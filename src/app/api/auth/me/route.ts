import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { findUserByIdFromDb, findRestaurantByIdFromDb, findRiderByIdFromDb } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null, restaurant: null, rider: null });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, user: null, restaurant: null, rider: null });
    }

    if (session.role === 'rider') {
      const rider = findRiderByIdFromDb(session.id);
      if (!rider) {
        return NextResponse.json({ success: false, user: null, restaurant: null, rider: null });
      }
      return NextResponse.json({
        success: true,
        role: 'rider',
        rider,
        user: null,
        restaurant: null,
      });
    }

    if (session.role === 'restaurant') {
      const restaurant = findRestaurantByIdFromDb(session.id);
      if (!restaurant) {
        return NextResponse.json({ success: false, user: null, restaurant: null, rider: null });
      }
      return NextResponse.json({
        success: true,
        role: 'restaurant',
        restaurant,
        user: null,
        rider: null,
      });
    }

    // Default: User
    const user = findUserByIdFromDb(session.id);
    if (!user) {
      return NextResponse.json({ success: false, user: null, restaurant: null, rider: null });
    }

    return NextResponse.json({
      success: true,
      role: 'user',
      user,
      restaurant: null,
      rider: null,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, user: null, restaurant: null, rider: null }, { status: 500 });
  }
}
