import { NextRequest, NextResponse } from 'next/server';
import { getAllRestaurantsFromDb } from '@/lib/db';
import { getMostRatedRestaurants } from '@/lib/complex-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    if (sort === 'rating') {
      const topRated = getMostRatedRestaurants(limit);
      return NextResponse.json({
        success: true,
        count: topRated.length,
        data: topRated,
      });
    }

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

