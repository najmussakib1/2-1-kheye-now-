import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getRestaurantStatistics } from '@/lib/complex-queries';

// GET /api/restaurant/stats -> Authorized statistics & complex analytics for the logged-in restaurant
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only restaurants can access statistics' }, { status: 403 });
    }

    const stats = getRestaurantStatistics(session.id);
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error in /api/restaurant/stats GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch restaurant statistics' }, { status: 500 });
  }
}
