export type School = {
	id: number;
	schoolName: string;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	logoUrl: string | null;
	createdAt: string;
};

export type Students = {
	id: number;
    name: string;
    phone: string | null;
    schoolId: number;
    academicYear: string | null;
    status: any;
    createdAt: string;
};

export interface Protocol {
    id: number;
    organization: string;
    representative: string | null;
    date: string;
    phonenumber: string | null;
    pdf: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    status: string;
}


export type EventType = 'open_doors' | 'workshop' | 'school_visit' | 'event' | 'other';
 

export interface CalendarEvent {
	id: number;
	title: string;
	type: EventType;
	eventDate: string; // ISO date, e.g. "2026-09-25"
	schoolId: number | null;
	schoolName: string | null; // resolved server-side via join
	otherLabel: string | null;
	notes: string | null;
}
 
export const EVENT_TYPES: EventType[] = ['open_doors', 'workshop', 'school_visit', 'event', 'other'];
 
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
	open_doors: 'Open Doors',
	workshop: 'Workshop',
	school_visit: 'School Visit',
	event: 'Event',
	other: 'Other'
};
 
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
	open_doors: '#16a34a',
	workshop: '#2563eb',
	school_visit: '#d97706',
	event: '#7c3aed',
	other: '#6b7280'
};