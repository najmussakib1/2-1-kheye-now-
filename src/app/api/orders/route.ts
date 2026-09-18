import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { createOrderInDb, updateUserAddressInDb, getUserOrdersFromDb, checkStockForOrderItems } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orders = getUserOrdersFromDb(session.id);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      phone_number,
      delivery_address,
      delivery_location,
      payment_method,
      order_notes,
      items,
      total_amount,
      save_address,
    } = body;

    // Basic validation
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }
    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }
    if (!delivery_address || !delivery_address.trim()) {
      return NextResponse.json({ success: false, error: 'Delivery address is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items in order' }, { status: 400 });
    }

    // Check if user is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let userId: number | null = null;

    if (token) {
      const session = verifySessionToken(token);
      if (session) {
        userId = session.id;
      }
    }

    // If user requested to save the new address for future orders, update DB
    if (userId && save_address && delivery_address.trim()) {
      try {
        updateUserAddressInDb(userId, delivery_address.trim());
      } catch (err) {
        console.error('Failed to update user address:', err);
      }
    }

    // Check stock availability before placing order
    const parsedItems = items.map((it: any) => ({
      food_id: it.food_id || it.food?.id,
      food_name: it.food_name || it.food?.name || 'Food Item',
      price: Number(it.price || it.food?.sale_price) || 0,
      quantity: Number(it.quantity) || 1,
      addons: Array.isArray(it.addons)
        ? it.addons.map((a: any) => ({
            addon_id: a.addon_id || a.id,
            addon_name: a.addon_name || a.name,
            price: Number(a.price) || 0,
          }))
        : [],
    }));

    const stockError = checkStockForOrderItems(parsedItems.map((it: any) => ({ food_id: it.food_id, quantity: it.quantity })));
    if (stockError) {
      return NextResponse.json({ success: false, error: stockError }, { status: 400 });
    }

    // Insert order and order items (trigger auto-assigns rider based on delivery_location)
    const { orderId } = createOrderInDb({
      user_id: userId,
      customer_name,
      phone_number,
      delivery_address,
      delivery_location: delivery_location || 'Dhanmondi',
      payment_method: payment_method || 'Cash on Delivery',
      order_notes,
      total_amount: Number(total_amount) || 0,
      items: parsedItems,
    });

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order placed successfully!',
    });
  } catch (error: any) {
    console.error('Error in /api/orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}
