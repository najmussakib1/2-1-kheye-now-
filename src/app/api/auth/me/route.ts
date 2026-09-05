import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { findUserByIdFromDb, findRestaurantByIdFromDb } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null, restaurant: null });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, user: null, restaurant: null });
    }

    if (session.role === 'restaurant') {
      const restaurant = findRestaurantByIdFromDb(session.id);
      if (!restaurant) {
        return NextResponse.json({ success: false, user: null, restaurant: null });
      }
      return NextResponse.json({
        success: true,
        role: 'restaurant',
        restaurant,
        user: null,
      });
    }

    // Default: User
    const user = findUserByIdFromDb(session.id);
    if (!user) {
      return NextResponse.json({ success: false, user: null, restaurant: null });
    }

    return NextResponse.json({
      success: true,
      role: 'user',
      user,
      restaurant: null,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, user: null, restaurant: null }, { status: 500 });
  }
}
