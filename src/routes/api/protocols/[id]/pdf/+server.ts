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
            .select({
                pdf: protocols.pdf
            })
            .from(protocols)
            .where(eq(protocols.id, id));

        if (!protocol) {
            return json(
                { message: "Protocol not found" },
                { status: 404 }
            );
        }

        if (!protocol.pdf) {
            return json(
                { message: "No PDF attached to this protocol" },
                { status: 404 }
            );
        }

        return new Response(new Uint8Array(protocol.pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="protocol-${id}.pdf"`,
                "Cache-Control": "private, max-age=0, must-revalidate"
            }
        });

    } catch (error) {
        console.error("Error fetching PDF:", error);

        return json(
            { message: "Failed to fetch PDF" },
            { status: 500 }
        );
    }
}