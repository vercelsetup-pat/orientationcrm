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
        const formData = await request.formData();

        const organization = formData.get("organization")?.toString();
        const representative = formData.get("representative")?.toString();
        const date = formData.get("date")?.toString();
        const phoneNumber = formData.get("phoneNumber")?.toString();
        const status = formData.get("status")?.toString();

        const pdfFile = formData.get("pdf");

        if (!organization || !date) {
            return json(
                { message: "Organization and date are required" },
                { status: 400 }
            );
        }

        let pdfData: Buffer | null = null;

        if (pdfFile instanceof File && pdfFile.size > 0) {
            if (pdfFile.type !== "application/pdf") {
                return json(
                    { message: "Only PDF files are allowed" },
                    { status: 400 }
                );
            }

            const arrayBuffer = await pdfFile.arrayBuffer();
            pdfData = Buffer.from(arrayBuffer);
        }

        const [newProtocol] = await db
            .insert(protocols)
            .values({
                organization,
                representative: representative || null,
                date,
                phonenumber: phoneNumber || null,
                pdf: pdfData,
                status: status || "Not Signed"
            })
            .returning();

        return json(newProtocol, { status: 201 });

    } catch (error) {
        console.error("Error creating protocol:", error);

        return json(
            { message: "Failed to create protocol" },
            { status: 500 }
        );
    }
}