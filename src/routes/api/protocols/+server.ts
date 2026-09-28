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
        const dateValue = formData.get("date")?.toString();
        const phoneNumber = formData.get("phoneNumber")?.toString();
        const status = formData.get("status")?.toString() || "Not Signed";

        const pdfFile = formData.get("pdf");

        // Organization is always required
        if (!organization) {
            return json(
                { message: "Organization is required" },
                { status: 400 }
            );
        }

        // Date is required only when the protocol is signed
        if (status !== "Not Signed" && !dateValue) {
            return json(
                { message: "Date is required for signed protocols" },
                { status: 400 }
            );
        }

        // If Not Signed, store NULL instead of an empty string
        const date = status === "Not Signed"
            ? null
            : dateValue || null;

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
                status
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