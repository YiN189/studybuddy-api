import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsHeaders } from '@/lib/cors';

// GET /api/courses — List all courses with real enrollment counts
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const level = searchParams.get('level');
        const search = searchParams.get('search');
        const instructorId = searchParams.get('instructorId');

        const db = await getDb();
        const filter = {};

        if (category && category !== 'All') {
            filter.category = category;
        }
        if (level && level !== 'All') {
            filter.level = level;
        }
        if (instructorId) {
            filter.instructorId = instructorId;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const courses = await db.collection('courses').find(filter).toArray();

        // Replace fake `students` field with real enrollment count from users collection
        const result = await Promise.all(
            courses.map(async ({ _id, students: _fakestudents, ...rest }) => {
                const realStudents = await db.collection('users').countDocuments({
                    enrolledCourses: _id,
                    role: 'student',
                });
                return { id: _id, ...rest, students: realStudents };
            })
        );

        return NextResponse.json(result, { headers: corsHeaders() });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST /api/courses — Create a new course (instructor)
export async function POST(request) {
    try {
        const body = await request.json();
        const { title, description, category, level, duration, price, image, lessons, instructorId, instructor } = body;

        if (!title || !description || !category || !level) {
            return NextResponse.json(
                { error: 'Title, description, category, and level are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const db = await getDb();

        // Generate a numeric ID
        const lastCourse = await db.collection('courses').find().sort({ _id: -1 }).limit(1).toArray();
        const newId = lastCourse.length > 0 ? lastCourse[0]._id + 1 : 1;

        const newCourse = {
            _id: newId,
            title,
            description,
            instructor: instructor || 'Unknown',
            instructorId: instructorId || null,
            category,
            level,
            duration: duration || '',
            price: parseFloat(price) || 0,
            rating: 0,
            students: 0,
            image: image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
            lessons: lessons || [],
            quizzes: [],
            createdAt: new Date().toISOString(),
        };

        await db.collection('courses').insertOne(newCourse);

        const { _id, ...rest } = newCourse;
        return NextResponse.json(
            { id: _id, ...rest, students: 0 },
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
