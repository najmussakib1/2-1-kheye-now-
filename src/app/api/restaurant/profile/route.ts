import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { findRestaurantByIdFromDb, updateRestaurantProfileInDb } from '@/lib/db';

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

    const restaurant = findRestaurantByIdFromDb(session.id);
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: restaurant });
  } catch (error: any) {
    console.error('Error fetching restaurant profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch restaurant profile' }, { status: 500 });
  }
}

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
    const { name, owner_name, phone_number, address, categories, image_url } = body;

    const updated = updateRestaurantProfileInDb(session.id, {
      name,
      owner_name,
      phone_number,
      address,
      categories: Array.isArray(categories) ? categories.join(', ') : categories,
      image_url,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update restaurant profile' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Restaurant profile updated successfully!',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating restaurant profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update restaurant profile' }, { status: 500 });
  }
}
