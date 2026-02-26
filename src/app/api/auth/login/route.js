import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { serializeId } from '@/lib/ids';

// POST /api/auth/login
export async function POST(request) {
    try {
        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Email, password, and role are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();
        const user = await db.collection('users').findOne({ email, password, role });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Return user data (without password)
        const { password: _, ...userData } = user;
        return NextResponse.json(
            { user: { ...userData, id: serializeId(user._id) } },
            { headers: corsHeaders() }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// Handle preflight
export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}
