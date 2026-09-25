import type { PageLoad } from './$types';
import type { CalendarEvent, School } from '$lib/types';
 
export const load: PageLoad = async ({ fetch }) => {
	const [eventsRes, schoolsRes] = await Promise.all([
		fetch('/api/events'),
		fetch('/api/schools') // adjust path if yours differs
	]);
 
	const events: CalendarEvent[] = await eventsRes.json();
 
	// Adjust this line if /api/schools wraps the array, e.g. `(await schoolsRes.json()).schools`
	const schools: School[] = await schoolsRes.json();
 
	return { events, schools };
};
 