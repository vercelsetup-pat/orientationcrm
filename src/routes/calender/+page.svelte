<script lang="ts">
	import type { PageData } from './$types';
	import {
		type CalendarEvent,
		type EventType,
		EVENT_TYPES,
		EVENT_TYPE_LABELS,
		EVENT_TYPE_COLORS
	} from '$lib/types';

	// Page-specific rules for which field the form shows per event type
	const SCHOOL_REQUIRED: EventType[] = ['open_doors', 'school_visit'];
	const SCHOOL_OPTIONAL: EventType[] = ['workshop'];
	const NEEDS_OTHER_LABEL: EventType[] = ['event', 'other'];

	let { data }: { data: PageData } = $props();

	let events = $state<CalendarEvent[]>(data.events);
	const schools = data.schools;

	// Calendar navigation
	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());

	const monthName = $derived(
		new Date(currentYear, currentMonth).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})
	);
	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function daysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}
	function firstWeekday(year: number, month: number) {
		return new Date(year, month, 1).getDay();
	}

	const gridDays = $derived.by(() => {
		const total = daysInMonth(currentYear, currentMonth);
		const offset = firstWeekday(currentYear, currentMonth);
		const days: (number | null)[] = [];
		for (let i = 0; i < offset; i++) days.push(null);
		for (let d = 1; d <= total; d++) days.push(d);
		return days;
	});

	function dateKey(day: number) {
		const m = String(currentMonth + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${currentYear}-${m}-${d}`;
	}

	function eventsOn(day: number) {
		const key = dateKey(day);
		return events.filter((e) => e.eventDate === key);
	}

	function isToday(day: number) {
		const t = new Date();
		return (
			t.getFullYear() === currentYear && t.getMonth() === currentMonth && t.getDate() === day
		);
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else currentMonth -= 1;
	}
	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear += 1;
		} else currentMonth += 1;
	}

	// --- Add-event modal ---
	let showModal = $state(false);
	let selectedDate = $state<string | null>(null);
	let formTitle = $state('');
	let formType = $state<EventType>('open_doors');
	let formSchoolId = $state<number | ''>('');
	let formOtherLabel = $state('');
	let formNotes = $state('');
	let saving = $state(false);
	let formError = $state<string | null>(null);

	const schoolRequired = $derived(SCHOOL_REQUIRED.includes(formType));
	const schoolOptional = $derived(SCHOOL_OPTIONAL.includes(formType));
	const showSchoolField = $derived(schoolRequired || schoolOptional);
	const showOtherField = $derived(NEEDS_OTHER_LABEL.includes(formType));

	function openModalForDay(day: number) {
		selectedDate = dateKey(day);
		formTitle = '';
		formType = 'open_doors';
		formSchoolId = '';
		formOtherLabel = '';
		formNotes = '';
		formError = null;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function formatDate(iso: string) {
		return new Date(iso + 'T00:00:00').toLocaleDateString('default', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function saveEvent() {
		formError = null;

		if (!formTitle.trim()) {
			formError = 'Title is required.';
			return;
		}
		if (schoolRequired && !formSchoolId) {
			formError = 'Please select a school.';
			return;
		}
		if (showOtherField && !formOtherLabel.trim()) {
			formError = 'Please specify what the event is.';
			return;
		}

		saving = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: formTitle.trim(),
					type: formType,
					eventDate: selectedDate,
					schoolId: showSchoolField && formSchoolId ? Number(formSchoolId) : null,
					otherLabel: showOtherField ? formOtherLabel.trim() : null,
					notes: formNotes.trim() || null
				})
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				formError = body?.message ?? 'Could not save the event.';
				return;
			}

			// Re-fetch so schoolName comes back resolved from the join
			const refreshed = await fetch('/api/events');
			events = await refreshed.json();
			showModal = false;
		} finally {
			saving = false;
		}
	}

	async function removeEvent(id: number) {
		const previous = events;
		events = events.filter((e) => e.id !== id);
		const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
		if (!res.ok) events = previous; // roll back on failure
	}

	function countByType(type: EventType) {
		return events.filter((e) => e.type === type).length;
	}

	const sortedEvents = $derived([...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
</script>

<div class="p-4 space-y-6">

  
        <!-- Summary cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" style="background-color: {EVENT_TYPE_COLORS.open_doors}"></span>
                    <span class="text-sm text-gray-500">Open Doors</span>
                </div>
                <p class="mt-2 text-2xl font-semibold text-gray-900">{countByType('open_doors')}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" style="background-color: {EVENT_TYPE_COLORS.workshop}"></span>
                    <span class="text-sm text-gray-500">Workshops</span>
                </div>
                <p class="mt-2 text-2xl font-semibold text-gray-900">{countByType('workshop')}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" style="background-color: {EVENT_TYPE_COLORS.school_visit}"></span>
                    <span class="text-sm text-gray-500">School Visits</span>
                </div>
                <p class="mt-2 text-2xl font-semibold text-gray-900">{countByType('school_visit')}</p>
            </div>
        </div>

        <!-- Calendar -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-base font-medium text-gray-900">{monthName}</h2>
                <div class="flex gap-1">
                    <button class="rounded-md border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50" onclick={prevMonth}>‹</button>
                    <button class="rounded-md border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50" onclick={nextMonth}>›</button>
                </div>
            </div>

            <div class="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 text-xs">
                {#each weekdayLabels as label}
                    <div class="bg-gray-50 px-2 py-1.5 text-center font-medium text-gray-500">{label}</div>
                {/each}

                {#each gridDays as day}
                    {#if day === null}
                        <div class="min-h-[88px] bg-white"></div>
                    {:else}
                        <button
                            class="flex min-h-[88px] flex-col items-start gap-1 bg-white p-1.5 text-left hover:bg-blue-50"
                            onclick={() => openModalForDay(day)}
                        >
                            <span
                                class="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                                class:bg-blue-600={isToday(day)}
                                class:text-white={isToday(day)}
                                class:text-gray-700={!isToday(day)}
                            >
                                {day}
                            </span>
                            <div class="flex w-full flex-col gap-0.5">
                                {#each eventsOn(day).slice(0, 3) as ev}
                                    <span class="truncate rounded px-1 py-0.5 text-[10px] text-white" style="background-color: {EVENT_TYPE_COLORS[ev.type]}">
                                        {ev.title}
                                    </span>
                                {/each}
                                {#if eventsOn(day).length > 3}
                                    <span class="text-[10px] text-gray-400">+{eventsOn(day).length - 3} more</span>
                                {/if}
                            </div>
                        </button>
                    {/if}
                {/each}
            </div>
        </div>

        <!-- Events table -->
        <div class="rounded-lg border border-gray-200 bg-white">
            <div class="border-b border-gray-200 px-4 py-3">
                <h2 class="text-base font-medium text-gray-900">Scheduled events</h2>
            </div>
            {#if sortedEvents.length === 0}
                <p class="px-4 py-6 text-sm text-gray-500">No events yet. Click a day on the calendar to add one.</p>
            {:else}
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                            <th class="px-4 py-2 font-medium">Date</th>
                            <th class="px-4 py-2 font-medium">Title</th>
                            <th class="px-4 py-2 font-medium">Type</th>
                            <th class="px-4 py-2 font-medium">School / Detail</th>
                            <th class="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortedEvents as ev (ev.id)}
                            <tr class="border-b border-gray-100 last:border-0">
                                <td class="px-4 py-2.5 text-gray-700">{formatDate(ev.eventDate)}</td>
                                <td class="px-4 py-2.5 text-gray-900">{ev.title}</td>
                                <td class="px-4 py-2.5">
                                    <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white" style="background-color: {EVENT_TYPE_COLORS[ev.type]}">
                                        {EVENT_TYPE_LABELS[ev.type]}
                                    </span>
                                </td>
                                <td class="px-4 py-2.5 text-gray-500">{ev.schoolName ?? ev.otherLabel ?? '—'}</td>
                                <td class="px-4 py-2.5 text-right">
                                    <button class="text-xs text-red-600 hover:underline" onclick={() => removeEvent(ev.id)}>Remove</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    
</div>
<!-- Add-event modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
		<div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
			<h3 class="text-base font-medium text-gray-900">
				New event — {selectedDate ? formatDate(selectedDate) : ''}
			</h3>

			<div class="mt-4 space-y-3">
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-600" for="ev-title">Title</label>
					<input
						id="ev-title"
						class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						bind:value={formTitle}
						placeholder="e.g. Robotics workshop"
					/>
				</div>

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-600" for="ev-type">Event type</label>
					<select
						id="ev-type"
						class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						bind:value={formType}
					>
						{#each EVENT_TYPES as t}
							<option value={t}>{EVENT_TYPE_LABELS[t]}</option>
						{/each}
					</select>
				</div>

				{#if showSchoolField}
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-600" for="ev-school">
							School{schoolRequired ? '' : ' (optional)'}
						</label>
						<select
							id="ev-school"
							class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							bind:value={formSchoolId}
						>
							<option value="">{schoolRequired ? 'Select a school…' : '— none —'}</option>
							{#each schools as s}
								<option value={s.id}>{s.schoolName}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if showOtherField}
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-600" for="ev-other">What is it?</label>
						<input
							id="ev-other"
							class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							bind:value={formOtherLabel}
							placeholder="e.g. Alumni reunion"
						/>
					</div>
				{/if}

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-600" for="ev-notes">Notes</label>
					<textarea
						id="ev-notes"
						class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						rows="2"
						bind:value={formNotes}
					></textarea>
				</div>

				{#if formError}
					<p class="text-xs text-red-600">{formError}</p>
				{/if}
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onclick={closeModal} disabled={saving}>
					Cancel
				</button>
				<button
					class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
					onclick={saveEvent}
					disabled={saving}
				>
					{saving ? 'Saving…' : 'Save event'}
				</button>
			</div>
		</div>
	</div>
{/if}