import { NextResponse } from 'next/server';
import { getAllRestaurantsFromDb } from '@/lib/db';

export async function GET() {
  try {
    const restaurants = getAllRestaurantsFromDb();
    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
