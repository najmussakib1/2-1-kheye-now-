import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { getFeaturedFoodItemsFromDb } from '@/lib/db';

function getUserIdFromRequest(req: NextRequest): number | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/kheye_now_session=([^;]+)/);
  if (match) {
    const session = verifySessionToken(match[1]);
    if (session && session.role === 'user') {
      return session.id;
    }
  }

  // Fallback: query param
  const url = new URL(req.url);
  const qUserId = url.searchParams.get('userId') || url.searchParams.get('user_id');
  if (qUserId && !isNaN(Number(qUserId))) {
    return Number(qUserId);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam && !isNaN(Number(limitParam)) ? Number(limitParam) : 8;

    const userId = getUserIdFromRequest(request);

    const data = getFeaturedFoodItemsFromDb({
      area,
      userId,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('API Error in /api/food-items/featured:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured food items' },
      { status: 500 }
    );
  }
}
