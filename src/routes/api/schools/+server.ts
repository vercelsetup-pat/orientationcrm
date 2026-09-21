import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { schools } from "$lib/db/schema";
import { asc } from "drizzle-orm";


export async function GET() {
  	try {
		const result = await db
		.select()
		.from(schools)
		.orderBy(asc(schools.schoolName));

		return json(result);

	} catch (error) {
    	console.error("GET schools error:", error);
		return json(
			{ message: "Failed to fetch schools"},{status: 500}
		);
  	}
}

export async function POST({ request }) {
    try {
        const body = await request.json();

        const {
            schoolName,
            contactName,
            contactPhone,
            contactEmail,
            logoUrl
        } = body;

        if (!schoolName) {
            return json({ message: "School name is required" },{ status: 400 });
        }

        const result = await db
            .insert(schools)
            .values({
                schoolName,
                contactName: contactName || null,
                contactPhone: contactPhone || null,
                contactEmail: contactEmail || null,
                logoUrl: logoUrl || null,
            })
            .returning();


        return json(
            result[0],{status: 201}
        );
    } catch (error) {

        console.error("POST schools error:", error);
        return json(
            {message: "Failed to create school"},{status: 500 }
        );
    }
}