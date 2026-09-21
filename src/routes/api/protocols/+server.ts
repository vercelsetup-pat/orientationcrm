import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { protocols } from "$lib/db/schema";


export async function GET() {
    try {
        const data = await db
            .select()
            .from(protocols);

        return json(data);

    } catch (error) {
        console.error("Error fetching protocols:", error);
        return json({ message: "Failed to fetch protocols" } , { status: 500 });
    }
}


export async function POST({ request }) {
    try {
        const body = await request.json();

        const {
            organization,
            representative,
            date,
            phoneNumber,
            pdf,
            status
        } = body;


        if (!organization || !date) {
            return json({ message: "Organization and date are required" },{ status: 400 });
        }


        const [newProtocol] = await db
            .insert(protocols)
            .values({
                organization,
                representative: representative || null,
                date,
                phonenumber: phoneNumber || null,
                pdf: pdf || null,
                status: status || "Not Signed"
            })
            .returning();


        return json( newProtocol, {status: 201});

    } catch (error) {
        console.error("Error creating protocol:", error);
        return json({ message: "Failed to create protocol" }, { status: 500});
    }
}