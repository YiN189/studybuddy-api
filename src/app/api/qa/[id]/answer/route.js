import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';
import { coerceNumberOrObjectId } from '@/lib/ids';

// POST /api/qa/[id]/answer — Add an answer to a question
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const { answer, authorName, authorRole } = await request.json();

        if (!answer) {
            return NextResponse.json(
                { error: 'Answer text is required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        const questionId = coerceNumberOrObjectId(id);

        const answerObj = {
            text: answer,
            author: authorName || 'Anonymous',
            role: authorRole || 'instructor',
            date: new Date().toISOString().split('T')[0],
        };

        const result = await db.collection('questions').updateOne(
            { _id: questionId },
            {
                $push: { answers: answerObj },
                $set: { status: 'answered' },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404, headers: corsHeaders() }
            );
        }

        return NextResponse.json(
            { message: 'Answer added', answer: answerObj },
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