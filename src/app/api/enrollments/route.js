import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { coerceNumberId, coerceUserId } from '@/lib/ids';

// GET /api/enrollments?studentId=X — Get enrolled courses for a student
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { error: 'studentId is required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();
        const student = await db.collection('users').findOne({ _id: coerceUserId(studentId) });

        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        const enrolledIds = (student.enrolledCourses || []).map(coerceNumberId);

        if (enrolledIds.length === 0) {
            return NextResponse.json([], { headers: corsHeaders() });
        }

        const courses = await db.collection('courses')
            .find({ _id: { $in: enrolledIds } })
            .toArray();

        const result = courses.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
        return NextResponse.json(result, { headers: corsHeaders() });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST /api/enrollments — Enroll student in a course
export async function POST(request) {
    try {
        const { studentId, courseId } = await request.json();

        if (!studentId || courseId === undefined) {
            return NextResponse.json(
                { error: 'studentId and courseId are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();
        const normalizedCourseId = coerceNumberId(courseId);

        // Check if student exists
        const student = await db.collection('users').findOne({ _id: coerceUserId(studentId) });
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Check if course exists
        const course = await db.collection('courses').findOne({ _id: normalizedCourseId });
        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Check if already enrolled
        if (student.enrolledCourses && student.enrolledCourses.includes(normalizedCourseId)) {
            return NextResponse.json(
                { error: 'Already enrolled in this course' },
                { status: 409, headers: corsHeaders() }
            );
        }

        // Add course to student's enrolledCourses
        await db.collection('users').updateOne(
            { _id: coerceUserId(studentId) },
            { $push: { enrolledCourses: normalizedCourseId } }
        );

        // Increment student count on course
        await db.collection('courses').updateOne(
            { _id: normalizedCourseId },
            { $inc: { students: 1 } }
        );

        return NextResponse.json(
            { message: 'Enrolled successfully', courseId: normalizedCourseId },
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
