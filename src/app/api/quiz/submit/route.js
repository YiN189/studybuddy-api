import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { coerceUserId } from '@/lib/ids';

// POST /api/quiz/submit — Submit a quiz result
export async function POST(request) {
    try {
        const { studentId, quizId, courseId, score } = await request.json();

        if (!studentId || quizId === undefined || score === undefined) {
            return NextResponse.json(
                { error: 'studentId, quizId, and score are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        const quizResult = {
            quizId,
            score,
            date: new Date().toISOString().split('T')[0],
        };

        // Add quiz score to student's record
        const result = await db.collection('users').updateOne(
            { _id: coerceUserId(studentId) },
            { $push: { quizScores: quizResult } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        return NextResponse.json(
            { message: 'Quiz result saved', result: quizResult },
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
