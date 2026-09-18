import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getPendingRatingOrderForUser, submitOrderRatingsInDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderIdParam = url.searchParams.get('orderId');
    const userIdParam = url.searchParams.get('userId') || url.searchParams.get('customer');
    const orderIdsParam = url.searchParams.get('orderIds');

    // 1. Check user authentication session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let authUserId: number | null = null;

    if (token) {
      const session = verifySessionToken(token);
      if (session && session.role === 'user') {
        authUserId = session.id;
      }
    }

    // Effective user ID: auth session or explicit param (supports customer5)
    const effectiveUserId = authUserId || (userIdParam ? Number(userIdParam) : null);
    const specificOrderId = orderIdParam ? Number(orderIdParam) : null;

    let candidateOrderIds: number[] = [];
    if (orderIdsParam) {
      candidateOrderIds = orderIdsParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    const pendingOrder = getPendingRatingOrderForUser(
      effectiveUserId,
      specificOrderId,
      candidateOrderIds
    );

    return NextResponse.json({
      success: true,
      pendingOrder,
    });
  } catch (error: any) {
    console.error('Error fetching pending rating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending ratings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, ratings } = body;

    if (!orderId || isNaN(Number(orderId))) {
      return NextResponse.json(
        { success: false, error: 'Valid orderId is required' },
        { status: 400 }
      );
    }

    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ratings for food items are required' },
        { status: 400 }
      );
    }

    // 1. Identify user if logged in
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let userId: number | null = null;

    if (token) {
      const session = verifySessionToken(token);
      if (session && session.role === 'user') {
        userId = session.id;
      }
    }

    // 2. Validate rating inputs
    const validatedRatings = ratings.map((r: any) => ({
      food_id: Number(r.food_id),
      rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
      review_text: r.review_text ? String(r.review_text).trim() : undefined,
    }));

    // 3. Submit ratings and recalculate restaurant rating
    const result = submitOrderRatingsInDb(Number(orderId), userId, validatedRatings);

    return NextResponse.json({
      success: true,
      message: 'Ratings submitted successfully! Restaurant rating updated.',
      result,
    });
  } catch (error: any) {
    console.error('Error submitting order ratings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit ratings' },
      { status: 500 }
    );
  }
}
