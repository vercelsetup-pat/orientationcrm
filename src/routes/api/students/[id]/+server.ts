import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { students } from "$lib/db/schema";
import { eq } from "drizzle-orm";



export async function GET({ params }) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return json(
                { message: "Invalid student ID" },
                { status: 400 }
            );
        }

        const result = await db
            .select()
            .from(students)
            .where(eq(students.id, id));

        if (result.length === 0) {
            return json(
                { message: "Student not found" },
                { status: 404 }
            );
        }

        return json(result[0]);

    } catch (error) {
        console.error("GET student error", error);

        return json(
            { message: "Failed to fetch student" },
            { status: 500 }
        );
    }
}

export async function PATCH({ params, request }) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return json(
                { message: "Invalid student ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const {
            name,
            phone,
            schoolId,
            academicYear,
            status
        } = body;

        // Check that the student exists
        const existingStudent = await db
            .select()
            .from(students)
            .where(eq(students.id, id));

        if (existingStudent.length === 0) {
            return json(
                { message: "Student not found" },
                { status: 404 }
            );
        }

        // Validate fields
        if (
            !name?.trim() ||
            !phone?.trim() ||
            !schoolId ||
            !academicYear?.trim() ||
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
            .update(students)
            .set({
                name: name.trim(),
                phone: phone.trim(),
                schoolId: Number(schoolId),
                academicYear: academicYear.trim(),
                status
            })
            .where(eq(students.id, id))
            .returning();

        return json(result[0]);

    } catch (error) {
        console.error("PATCH student error", error);

        return json(
            { message: "Failed to update student" },
            { status: 500 }
        );
    }
}

export async function DELETE({ params }) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return json(
                { message: "Invalid student ID" },
                { status: 400 }
            );
        }

        const result = await db
            .delete(students)
            .where(eq(students.id, id))
            .returning();

        if (result.length === 0) {
            return json(
                { message: "Student not found" },
                { status: 404 }
            );
        }

        return json({
            message: "Student deleted successfully",
            student: result[0]
        });

    } catch (error) {
        console.error("DELETE student error", error);

        return json(
            { message: "Failed to delete student" },
            { status: 500 }
        );
    }
}