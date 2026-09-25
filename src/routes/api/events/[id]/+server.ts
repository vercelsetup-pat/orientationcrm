import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { events } from '$lib/db/schema';
import { eq } from 'drizzle-orm';


export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Invalid event id');

	const deleted = await db.delete(events).where(eq(events.id, id)).returning();
	if (deleted.length === 0) throw error(404, 'Event not found');

	return json({ success: true });
};