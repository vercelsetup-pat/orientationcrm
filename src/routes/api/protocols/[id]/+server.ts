import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { protocols } from "$lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET({ params }) {
    try {
        const id = Number(params.id);

        if (Number.isNaN(id)) {
            return json(
                { message: "Invalid protocol ID" },
                { status: 400 }
            );
        }

        const [protocol] = await db
            .select()
            .from(protocols)
            .where(eq(protocols.id, id));

        if (!protocol) {
            return json(
                { message: "Protocol not found" },
                { status: 404 }
            );
        }

        return json(protocol);

    } catch (error) {
        console.error("Error fetching protocol:", error);

        return json(
            { message: "Failed to fetch protocol" },
            { status: 500 }
        );
    }
}


export async function PATCH({ params, request }) {
    try {
        const id = Number(params.id);

        if (Number.isNaN(id)) {
            return json(
                { message: "Invalid protocol ID" },
                { status: 400 }
            );
        }

        const formData = await request.formData();

        const organization = formData.get("organization")?.toString();
        const representative = formData.get("representative")?.toString();
        const date = formData.get("date")?.toString();
        const phoneNumber = formData.get("phoneNumber")?.toString();
        const status = formData.get("status")?.toString();

        const pdfFile = formData.get("pdf");

        if (!organization || !date) {
            return json(
                {
                    message: "Organization and date are required"
                },
                { status: 400 }
            );
        }

        const updateData: any = {
            organization,
            representative: representative || null,
            date,
            phonenumber: phoneNumber || null,
            status: status || "Not Signed",
            updatedAt: new Date()
        };

        /*
         * Only replace the existing PDF if
         * the user selected a new PDF.
         */
        if (pdfFile instanceof File && pdfFile.size > 0) {
            if (pdfFile.type !== "application/pdf") {
                return json(
                    { message: "Only PDF files are allowed" },
                    { status: 400 }
                );
            }

            const arrayBuffer = await pdfFile.arrayBuffer();
            updateData.pdf = Buffer.from(arrayBuffer);
        }

        const [updatedProtocol] = await db
            .update(protocols)
            .set(updateData)
            .where(eq(protocols.id, id))
            .returning();

        if (!updatedProtocol) {
            return json(
                { message: "Protocol not found" },
                { status: 404 }
            );
        }

        return json(updatedProtocol);

    } catch (error) {
        console.error("Error updating protocol:", error);

        return json(
            { message: "Failed to update protocol" },
            { status: 500 }
        );
    }
}


export async function DELETE({ params }) {
    try {
        const id = Number(params.id);

        if (Number.isNaN(id)) {
            return json(
                { message: "Invalid protocol ID" },
                { status: 400 }
            );
        }

        const [deletedProtocol] = await db
            .delete(protocols)
            .where(eq(protocols.id, id))
            .returning();

        if (!deletedProtocol) {
            return json(
                { message: "Protocol not found" },
                { status: 404 }
            );
        }

        return json({
            message: "Protocol deleted successfully",
            protocol: deletedProtocol
        });

    } catch (error) {
        console.error("Error deleting protocol:", error);

        return json(
            { message: "Failed to delete protocol" },
            { status: 500 }
        );
    }
}