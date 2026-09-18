import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getOrdersByRestaurantIdFromDb, updateOrderStatusByRestaurantInDb } from '@/lib/db';

// GET /api/restaurant/orders -> list all orders for the logged-in restaurant
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only restaurants can access this' }, { status: 403 });
    }

    const orders = getOrdersByRestaurantIdFromDb(session.id);
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error in /api/restaurant/orders GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PATCH /api/restaurant/orders -> update order status (e.g. Preparing -> Prepared)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const allowedStatuses = ['Preparing', 'Prepared', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    const success = updateOrderStatusByRestaurantInDb(Number(order_id), session.id, status);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Order not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Order #${order_id} status updated to "${status}"`,
    });
  } catch (error: any) {
    console.error('Error in /api/restaurant/orders PATCH:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}
