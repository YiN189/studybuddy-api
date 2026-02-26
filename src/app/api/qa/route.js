import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { serializeId } from '@/lib/ids';

// GET /api/qa — List all Q&A questions
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const instructorId = searchParams.get('instructorId');

        const db = await getDb();
        const filter = {};

        if (courseId) {
            filter.courseId = parseInt(courseId);
        } else if (instructorId) {
            // Only return questions for courses taught by this instructor
            const instructorCourses = await db.collection('courses')
                .find({ instructorId })
                .project({ _id: 1 })
                .toArray();
            const courseIds = instructorCourses.map((c) => c._id);
            filter.courseId = { $in: courseIds };
        }

        const questions = await db.collection('questions')
            .find(filter)
            .sort({ date: -1 })
            .toArray();

        const result = questions.map(({ _id, ...rest }) => ({ id: serializeId(_id), ...rest }));
        return NextResponse.json(result, { headers: corsHeaders() });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST /api/qa — Ask a new question
export async function POST(request) {
    try {
        const { studentId, studentName, courseId, courseName, question } = await request.json();

        if (!question) {
            return NextResponse.json(
                { error: 'Question text is required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        const newQuestion = {
            studentId: studentId || null,
            studentName: studentName || 'Anonymous',
            courseId: courseId || null,
            courseName: courseName || null,
            question,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            answers: [],
        };

        const result = await db.collection('questions').insertOne(newQuestion);

        // insertOne mutates newQuestion by adding _id — strip it before returning
        const { _id, ...rest } = newQuestion;
        return NextResponse.json(
            { id: serializeId(result.insertedId), ...rest },
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
