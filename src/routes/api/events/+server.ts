import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { events, schools } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const EVENT_TYPES = ['open_doors', 'workshop', 'school_visit', 'event', 'other'] as const;
type EventType = (typeof EVENT_TYPES)[number];

// GET /api/events — list all events with the school name resolved for the table/calendar
export const GET: RequestHandler = async () => {
	const rows = await db
		.select({
			id: events.id,
			title: events.title,
			type: events.type,
			eventDate: events.eventDate,
			schoolId: events.schoolId,
			schoolName: schools.schoolName,
			otherLabel: events.otherLabel,
			notes: events.notes,
			createdAt: events.createdAt
		})
		.from(events)
		.leftJoin(schools, eq(events.schoolId, schools.id))
		.orderBy(events.eventDate);

	return json(rows);
};

// POST /api/events — create an event
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'Invalid JSON body');

	const { title, type, eventDate, schoolId, otherLabel, notes } = body as {
		title?: string;
		type?: EventType;
		eventDate?: string;
		schoolId?: number | null;
		otherLabel?: string;
		notes?: string;
	};

	if (!title?.trim()) throw error(400, 'Title is required');
	if (!type || !EVENT_TYPES.includes(type)) throw error(400, 'Invalid event type');
	if (!eventDate) throw error(400, 'Event date is required');

	// Open Doors / School Visit: school is required
	if ((type === 'open_doors' || type === 'school_visit') && !schoolId) {
		throw error(400, 'A school is required for Open Doors and School Visit events');
	}

	// Event / Other: free-text label is required
	if ((type === 'event' || type === 'other') && !otherLabel?.trim()) {
		throw error(400, 'Please specify what the event is');
	}

	// Workshop: school is optional, so whatever was sent (or null) is kept as-is

	const [created] = await db
		.insert(events)
		.values({
			title: title.trim(),
			type,
			eventDate,
			schoolId:
				type === 'open_doors' || type === 'school_visit' || type === 'workshop'
					? (schoolId ?? null)
					: null,
			otherLabel: type === 'event' || type === 'other' ? otherLabel!.trim() : null,
			notes: notes?.trim() || null
		})
		.returning();

	return json(created, { status: 201 });
};