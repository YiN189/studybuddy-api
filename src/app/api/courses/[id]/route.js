import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';

// GET /api/courses/[id] — Get a single course
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const courseId = parseInt(id);

        const db = await getDb();
        const course = await db.collection('courses').findOne({ _id: courseId });

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Replace fake students field with real enrollment count
        const realStudents = await db.collection('users').countDocuments({
            enrolledCourses: courseId,
            role: 'student',
        });

        const { _id, students: _fake, ...rest } = course;
        return NextResponse.json({ id: _id, ...rest, students: realStudents }, { headers: corsHeaders() });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// PUT /api/courses/[id] — Update a course
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const courseId = parseInt(id);
        const updates = await request.json();

        const db = await getDb();

        // Remove id/_id from updates to avoid overwrite
        delete updates.id;
        delete updates._id;

        const result = await db.collection('courses').updateOne(
            { _id: courseId },
            { $set: { ...updates, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        const updated = await db.collection('courses').findOne({ _id: courseId });
        const { _id, ...rest } = updated;
        return NextResponse.json({ id: _id, ...rest }, { headers: corsHeaders() });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// DELETE /api/courses/[id] — Delete a course
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const courseId = parseInt(id);

        const db = await getDb();
        const result = await db.collection('courses').deleteOne({ _id: courseId });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        return NextResponse.json(
            { message: 'Course deleted successfully' },
            { headers: corsHeaders() }
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
