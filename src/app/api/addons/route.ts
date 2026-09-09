import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import {
  getAddonsByFoodIdFromDb,
  createAddonInDb,
  getFoodItemByIdFromDb,
} from '@/lib/db';

// GET /api/addons?food_id=X -> List add-ons for a specific food item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const foodIdParam = searchParams.get('food_id');

    if (!foodIdParam) {
      return NextResponse.json({ success: false, error: 'food_id query parameter is required' }, { status: 400 });
    }

    const foodId = Number(foodIdParam);
    const addons = getAddonsByFoodIdFromDb(foodId);

    return NextResponse.json({
      success: true,
      data: addons,
      count: addons.length,
    });
  } catch (error: any) {
    console.error('Error in /api/addons GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch add-ons' }, { status: 500 });
  }
}

// POST /api/addons -> Create a new add-on (Restaurant only)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only restaurants can create add-ons' }, { status: 403 });
    }

    const body = await request.json();
    const { food_id, name, price, image_url, is_available } = body;

    if (!food_id) {
      return NextResponse.json({ success: false, error: 'food_id is required' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Add-on name is required' }, { status: 400 });
    }
    if (price === undefined || Number(price) < 0) {
      return NextResponse.json({ success: false, error: 'Valid add-on price is required' }, { status: 400 });
    }

    // Verify the food item belongs to this restaurant
    const food = getFoodItemByIdFromDb(Number(food_id));
    if (!food || food.restaurant_id !== session.id) {
      return NextResponse.json({ success: false, error: 'Food item not found or unauthorized' }, { status: 404 });
    }

    const newAddon = createAddonInDb({
      food_id: Number(food_id),
      restaurant_id: session.id,
      name: name.trim(),
      price: Number(price),
      image_url: image_url?.trim() || undefined,
      is_available: is_available !== undefined ? is_available : true,
    });

    return NextResponse.json({
      success: true,
      message: 'Add-on created successfully!',
      data: newAddon,
    });
  } catch (error: any) {
    console.error('Error in /api/addons POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to create add-on' }, { status: 500 });
  }
}
