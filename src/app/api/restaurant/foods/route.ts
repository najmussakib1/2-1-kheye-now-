import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import {
  getFoodItemsFromDb,
  createFoodItemInDb,
  updateFoodItemInDb,
  updateFoodItemAvailabilityInDb,
  deleteFoodItemInDb,
} from '@/lib/db';

// GET /api/restaurant/foods -> list food items belonging to logged-in restaurant
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

    const items = getFoodItemsFromDb(undefined, session.id);
    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('Error in /api/restaurant/foods GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch food items' }, { status: 500 });
  }
}

// POST /api/restaurant/foods -> create new food item with multiple images
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, description, base_price, sale_price, category, image_url, images, is_available } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Food name is required' }, { status: 400 });
    }
    if (sale_price === undefined || Number(sale_price) < 0) {
      return NextResponse.json({ success: false, error: 'Valid sale price is required' }, { status: 400 });
    }

    const newItem = createFoodItemInDb({
      restaurant_id: session.id,
      name: name.trim(),
      description: description?.trim() || '',
      base_price: Number(base_price) || Number(sale_price),
      sale_price: Number(sale_price),
      category: category || 'Fast Food',
      image_url: image_url?.trim() || '',
      images: Array.isArray(images) ? images : (image_url ? [image_url] : []),
      is_available: is_available !== undefined ? is_available : true,
    });

    return NextResponse.json({
      success: true,
      message: 'Food item added successfully!',
      data: newItem,
    });
  } catch (error: any) {
    console.error('Error in /api/restaurant/foods POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to create food item' }, { status: 500 });
  }
}

// PUT /api/restaurant/foods -> edit existing food item
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { item_id, id, name, description, base_price, sale_price, category, image_url, images, is_available } = body;
    const targetId = Number(item_id || id);

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'item_id is required' }, { status: 400 });
    }

    const updated = updateFoodItemInDb(targetId, session.id, {
      name: name !== undefined ? name : undefined,
      description: description !== undefined ? description : undefined,
      base_price: base_price !== undefined ? Number(base_price) : undefined,
      sale_price: sale_price !== undefined ? Number(sale_price) : undefined,
      category: category !== undefined ? category : undefined,
      image_url: image_url !== undefined ? image_url : undefined,
      images: Array.isArray(images) ? images : undefined,
      is_available: is_available !== undefined ? is_available : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Food item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Food item updated successfully!',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error in /api/restaurant/foods PUT:', error);
    return NextResponse.json({ success: false, error: 'Failed to update food item' }, { status: 500 });
  }
}

// PATCH /api/restaurant/foods -> toggle availability
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
    const { item_id, is_available } = body;

    if (!item_id) {
      return NextResponse.json({ success: false, error: 'item_id is required' }, { status: 400 });
    }

    const success = updateFoodItemAvailabilityInDb(Number(item_id), session.id, Boolean(is_available));
    if (!success) {
      return NextResponse.json({ success: false, error: 'Item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Item availability updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating item availability:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item availability' }, { status: 500 });
  }
}

// DELETE /api/restaurant/foods -> delete food item
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'id query parameter is required' }, { status: 400 });
    }

    const success = deleteFoodItemInDb(Number(itemId), session.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Food item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting food item:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete food item' }, { status: 500 });
  }
}
