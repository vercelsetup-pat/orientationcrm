import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { schools } from "$lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET({ params }) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return json({ message: "Invalid school id" },{ status: 400 });
        }

        const result = await db
            .select()
            .from(schools)
            .where(eq(schools.id, id));

        if (result.length === 0) {
            return json({ message: "School not found" }, { status: 404 });
        }

        return json(result[0]);
    } catch (error) {
        console.error("GET school error:", error);
        return json({ message: "Failed to fetch school" }, { status: 500 });
    }
}

export async function PATCH({ params, request }) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return json({ message: "Invalid school id" },{ status: 400 });
        }

        const body = await request.json();
        const {
            schoolName,
            contactName,
            contactPhone,
            contactEmail,
            logoUrl
        } = body;

        const result = await db
            .update(schools)
            .set({
                ...(schoolName !== undefined && { schoolName }),
                ...(contactName !== undefined && { contactName }),
                ...(contactPhone !== undefined && { contactPhone }),
                ...(contactEmail !== undefined && { contactEmail }),
                ...(logoUrl !== undefined && { logoUrl })
            })
            .where(eq(schools.id, id))
            .returning();

        if (result.length === 0) {
            return json({ message: "School not found" },{ status: 404 });
        }
        return json(result[0]);
    } catch (error) {
        console.error("PATCH school error:", error);
        return json({ message: "Failed to update school" },{ status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return json({ message: "Invalid school id" }, { status: 400 }
            );
        }

        const result = await db
            .delete(schools)
            .where(eq(schools.id, id))
            .returning();

        if (result.length === 0) {
            return json(
                { message: "School not found" },{ status: 404 }
            );
        }

        return json({
            message: "School deleted successfully"
        });

    } catch(error) {
        console.error("DELETE school error:", error);
        return json(
            { message: "Failed to delete school" },{ status: 500 }
        );
    }
}