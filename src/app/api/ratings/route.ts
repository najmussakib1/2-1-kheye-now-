import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getPendingRatingOrderForUser, submitOrderRatingsInDb, orderBelongsToUser } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderIdParam = url.searchParams.get('orderId');
    const orderIdsParam = url.searchParams.get('orderIds');

    // The review prompt belongs to the signed-in customer, so the session is
    // the only source of identity. A `userId`/`customer` query parameter is
    // deliberately ignored: trusting it let any caller request another
    // customer's pending review.
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session || session.role !== 'user') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please sign in to rate your orders' },
        { status: 401 }
      );
    }

    const authUserId = session.id;
    const specificOrderId = orderIdParam ? Number(orderIdParam) : null;

    let candidateOrderIds: number[] = [];
    if (orderIdsParam) {
      candidateOrderIds = orderIdsParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    const pendingOrder = getPendingRatingOrderForUser(
      authUserId,
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

    // Reviews can only be submitted by the customer who placed the order.
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session || session.role !== 'user') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please sign in to rate your orders' },
        { status: 401 }
      );
    }

    const userId = session.id;

    // Reject before writing: a customer may only review their own order.
    if (!orderBelongsToUser(Number(orderId), userId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: This order does not belong to you' },
        { status: 403 }
      );
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
