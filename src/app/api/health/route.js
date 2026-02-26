import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

/**
 * GET /api/health — Check API and MongoDB connection.
 * Returns 200 if MongoDB is reachable, 503 otherwise.
 */
export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({
      ok: true,
      mongodb: 'connected',
      database: db.databaseName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mongodb: 'disconnected',
        error: error.message || 'MongoDB connection failed',
      },
      { status: 503 }
    );
  }
}
