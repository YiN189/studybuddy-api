import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { serializeId } from '@/lib/ids';

// POST /api/auth/register
export async function POST(request) {
    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Name, email, password, and role are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!['student', 'instructor'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be student or instructor' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        // Check if email already exists
        const existing = await db.collection('users').findOne({ email });
        if (existing) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409, headers: corsHeaders() }
            );
        }

        const newUser = {
            name,
            email,
            password,
            role,
            enrolledCourses: [],
            completedLessons: [],
            quizScores: [],
            certificates: [],
            createdAt: new Date().toISOString(),
        };

        const result = await db.collection('users').insertOne(newUser);

        const { password: _, _id, ...userData } = newUser;
        return NextResponse.json(
            { user: { ...userData, id: serializeId(result.insertedId) } },
            { status: 201, headers: corsHeaders() }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}
