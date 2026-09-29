import { NextResponse } from 'next/server';
import { getFoodItemByIdFromDb, getSimilarFoodItemsFromDb } from '@/lib/db';
import {
  getMostOrderedItemsByRestaurant,
  getMostRatedItemsByRestaurant,
  getMostAddedAddonsForFood,
} from '@/lib/complex-queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const itemId = parseInt(resolvedParams.id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const item = getFoodItemByIdFromDb(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const similarItems = getSimilarFoodItemsFromDb(itemId, item.category, 5);
    const restaurantId = item.restaurant_id ?? 0;
    const mostOrderedFromRestaurant = restaurantId ? getMostOrderedItemsByRestaurant(restaurantId, itemId, 3) : [];
    const mostRatedFromRestaurant = restaurantId ? getMostRatedItemsByRestaurant(restaurantId, itemId, 3) : [];
    const suggestedAddons = getMostAddedAddonsForFood(itemId, 5);

    return NextResponse.json({
      success: true,
      data: item,
      similarItems,
      mostOrderedFromRestaurant,
      mostRatedFromRestaurant,
      suggestedAddons,
    });
  } catch (error: any) {
    console.error('API Error fetching product by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

