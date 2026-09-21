import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { students } from "$lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET(){
    try {
        const result = await db.select().from(students).orderBy(asc(students.name));

        return json(result)
    }catch (error){
        console.error("GET students error", error);
        return json(
            { message: " Failed to fetch students"},{status: 500}
        )
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();

        const {
            name,
            phone,
            schoolId,
            academicYear,
            status
        } = body;

        // Validate required fields
        if (
            !name ||
            !phone ||
            !schoolId ||
            !academicYear ||
            !status
        ) {
            return json(
                {
                    message:
                        "Name, phone, school, academic year, and status are required"
                },
                { status: 400 }
            );
        }

        const result = await db
            .insert(students)
            .values({
                name,
                phone,
                schoolId: Number(schoolId),
                academicYear,
                status
            })
            .returning();

        return json(result[0], { status: 201 });
    } catch (error) {
        console.error("POST students error", error);

        return json(
            { message: "Failed to create student" },
            { status: 500 }
        );
    }
}