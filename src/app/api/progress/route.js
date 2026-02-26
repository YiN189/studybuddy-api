import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { coerceNumberId, coerceUserId } from '@/lib/ids';

// GET /api/progress?studentId=X&courseId=Y — Get lesson completion progress
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const courseId = searchParams.get('courseId');

        if (!studentId || !courseId) {
            return NextResponse.json(
                { error: 'studentId and courseId are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();
        const student = await db.collection('users').findOne({ _id: coerceUserId(studentId) });
        const course = await db.collection('courses').findOne({ _id: coerceNumberId(courseId) });

        if (!student || !course) {
            return NextResponse.json(
                { completed: 0, total: 0, percentage: 0 },
                { headers: corsHeaders() }
            );
        }

        const completedLessons = (course.lessons || []).filter(
            (l) => (student.completedLessons || []).includes(l.id)
        ).length;

        const totalLessons = (course.lessons || []).length;
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return NextResponse.json(
            { completed: completedLessons, total: totalLessons, percentage },
            { headers: corsHeaders() }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST /api/progress — Mark a lesson as completed
export async function POST(request) {
    try {
        const { studentId, lessonId } = await request.json();

        if (!studentId || lessonId === undefined) {
            return NextResponse.json(
                { error: 'studentId and lessonId are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        // Add lesson to completed lessons (if not already there)
        await db.collection('users').updateOne(
            { _id: coerceUserId(studentId) },
            { $addToSet: { completedLessons: lessonId } }
        );

        return NextResponse.json(
            { message: 'Lesson marked as completed', lessonId },
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
