<script lang="ts">
    import { onMount } from "svelte";
    import type { Students, School } from "$lib/types";
    import { Button, Input, Select } from "flowbite-svelte";
	import { PlusOutline, ChevronLeftOutline, ChevronRightOutline } from "flowbite-svelte-icons";
    import { Badge } from "flowbite-svelte";

    let studentsData = $state<Students[]>([]);
    let schoolsData = $state<School[]>([]);
    let loading = $state(true);
    let error = $state("");
    let openNonModal = $state(false);
    let submitting = $state(false);
    let formError = $state("");
    let editingStudentId = $state<number | null>(null);

    let name = $state("");
    let phone = $state("");
    let schoolId = $state("");
    let academicYear = $state("");
    let status = $state("");

    let tableSearchQuery = $state("");
    let selectedSchool = $state("");   
    let selectedStatus = $state("");   
    let rowsPerPage = $state(10);
    let currentPage = $state(1);

    const statusOptions = [
        "SE",
        "SV",
        "SG",
        "LH",
        "Terminal",
        "Bacc Français"
    ];

    let filteredStudents = $derived(
        studentsData.filter((s) => {
            const q = tableSearchQuery.trim().toLocaleLowerCase();

            const matchesSearch = !q || s.name.toLowerCase().includes(q);

            const matchesSchool = !selectedSchool || String(s.schoolId) === selectedSchool;

            const matchesStatus = !selectedStatus || s.status === selectedStatus;

            return matchesSearch && matchesSchool && matchesStatus;
        })
    );

    let totalPages = $derived(
        Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
    );

    let displayedStudents = $derived(
        filteredStudents.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage
        )
    );

    let paginationPages = $derived(
        Array.from({ length: totalPages }, (_, i) => i + 1)
    );

    function previousPage() {
        if (currentPage > 1) currentPage -= 1;
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage += 1;
    }

    $effect(() => {
        tableSearchQuery;
        selectedSchool;
        selectedStatus;
        rowsPerPage;
        currentPage = 1;
    });

    $effect(() => {
        if (currentPage > totalPages) currentPage = totalPages;
    });

    async function loadStudents() {
        loading = true;
        error = "";

        try {
            const response = await fetch("/api/students");

            if (!response.ok) {
                throw new Error("Failed to load students");
            }

            studentsData = await response.json();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to load students";
        } finally {
            loading = false;
        }
    }

    async function loadSchools() {
        try {
            const response = await fetch("/api/schools");

            if (!response.ok) {
                throw new Error(`Schools request failed (${response.status})`);
            }

            const data = await response.json();
            console.log("schools response:", data);

            schoolsData = Array.isArray(data) ? data : (data.schools ?? data.data ?? []);
        } catch (err) {
            console.error("Failed to load schools:", err);
            error = err instanceof Error ? err.message : "Failed to load schools";
        }
    }

    function getSchoolName(id: number | string) {
        const school = schoolsData.find((s) => String(s.id) === String(id));
        return school?.schoolName ?? "-";
    }

    function resetForm() {
        name = "";
        phone = "";
        schoolId = "";
        academicYear = "";
        status = "";
        editingStudentId = null;
        formError = "";
    }

    function openAddPanel() {
        resetForm();
        openNonModal = true;
    }

    function closePanel() {
        openNonModal = false;
        resetForm();
    }

    async function getStudent(id: number) {
        try {
            const response = await fetch(`/api/students/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch student"
                );
            }

            return data as Students;
        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "Failed to load student";

            return null;
        }
    }

    async function openEditPanel(id: number) {
        formError = "";
        submitting = true;

        const student = await getStudent(id);

        if (!student) {
            submitting = false;
            return;
        }

        editingStudentId = student.id;
        name = student.name;
        phone = student.phone ?? "";
        schoolId = String(student.schoolId);
        academicYear = student.academicYear ?? "";
        status = student.status ?? "";

        submitting = false;
        openNonModal = true;
    }

    async function addStudent() {
        formError = "";

        if (
            !name.trim() ||
            !phone.trim() ||
            !schoolId ||
            !academicYear.trim() ||
            !status
        ) {
            formError = "Please fill in all fields.";
            return;
        }

        submitting = true;

        try {
            const response = await fetch("/api/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    schoolId: Number(schoolId),
                    academicYear: academicYear.trim(),
                    status
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create student"
                );
            }

            studentsData = [...studentsData, data];

            closePanel();
        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "Failed to create student";
        } finally {
            submitting = false;
        }
    }

    async function updateStudent() {
        if (editingStudentId === null) {
            return;
        }

        formError = "";

        if (
            !name.trim() ||
            !phone.trim() ||
            !schoolId ||
            !academicYear.trim() ||
            !status
        ) {
            formError = "Please fill in all fields.";
            return;
        }

        submitting = true;

        try {
            const response = await fetch(
                `/api/students/${editingStudentId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        phone: phone.trim(),
                        schoolId: Number(schoolId),
                        academicYear: academicYear.trim(),
                        status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update student"
                );
            }

            studentsData = studentsData.map((student) =>
                student.id === data.id
                    ? data
                    : student
            );

            closePanel();
        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "Failed to update student";
        } finally {
            submitting = false;
        }
    }

    async function deleteStudent(id: number) {
        const confirmed = confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `/api/students/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete student"
                );
            }

            studentsData = studentsData.filter(
                (student) => student.id !== id
            );
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to delete student";
        }
    }

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        if (editingStudentId === null) {
            addStudent();
        } else {
            updateStudent();
        }
    }

    onMount(async () => {
        await Promise.all([loadStudents(), loadSchools()]);
    });
</script>

<div class="page" class:panel-open={openNonModal}>
    <section class="w-full min-w-0">
        <div class="card-primary">
            <div class="card-pattern"></div>
            <div class="relative z-[2] min-h-[100px] box-border px-[22px] py-5 flex items-center justify-between gap-5">
                <div class="flex flex-col gap-1">
                    <div class="flex space-x-2">
                        <div class="h1">
                            {studentsData.length}
                        </div>

                        <div class="h5">
                           <div> Students</div>
                            <div>Managed list students adnget accurate data for students intrested in AUL University</div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center shrink-0">
                    <Button color="light" class="h-9" onclick={openAddPanel}>
                      <PlusOutline size = sm />&nbsp;Add Student
                    </Button>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-between mb-3 gap-3">
            <div class="relative w-full max-w-[320px]">
                <Input type="text" placeholder="Search students..." bind:value={tableSearchQuery} />
                {#if tableSearchQuery}
                    <button
                        type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onclick={() => (tableSearchQuery = "")}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                {/if}
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <Select class="w-[170px]" bind:value={selectedSchool}>
                    <option value="">Filter by School</option>
                    {#each schoolsData as school}
                        <option value={String(school.id)}>{school.schoolName}</option>
                    {/each}
                </Select>

                <Select class="w-[150px]" bind:value={selectedStatus}>
                    <option value="">Filter by Status</option>
                    {#each statusOptions as option}
                        <option value={option}>{option}</option>
                    {/each}
                </Select>
            </div>
        </div>

        <div class="card-secondary">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>School</th>
                            <th>Academic Year</th>
                            <th>Status</th>
                            <th class="!text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {#if loading}
                            <tr>
                                <td colspan="6"class="empty-cell">
                                    Loading students...
                                </td>
                            </tr>
                        {:else if error}
                            <tr>
                                <td colspan="6" class="empty-cell text-red-500">{error}</td>
                            </tr>
                        {:else if filteredStudents.length === 0}
                            <tr>
                                <td colspan="6" class="empty-cell">No students found.</td>
                            </tr>
                        {:else}
                           {#each displayedStudents as student (student.id)}
                                <tr>
                                    <td><span class="student-name">{student.name} </span></td>
                                    <td><span class="table-text">{student.phone ?? "-"}</span></td>
                                    <td><span class="table-text">{getSchoolName(student.schoolId)}</span></td>
                                    <td><span class="table-text">{student.academicYear ?? "-"}</span></td>
                                    <td><Badge>{student.status ?? "-"}</Badge></td>
                                    <td>
                                        <div class="row-actions">
                                            <button type="button" class="action-button" aria-label="Edit student" onclick={() =>openEditPanel(student.id)}>
                                                ✎
                                            </button>

                                            <button type="button" class="action-button delete-button" aria-label="Delete student"
                                                onclick={() =>deleteStudent(student.id)}>
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="flex w-full items-center justify-between gap-4 border-t border-gray-100 py-3">
            <div class="flex shrink-0 items-center">
                <Select class="!w-[140px]" bind:value={rowsPerPage}>
                    <option value={10}>10 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={35}>35 per page</option>
                </Select>
            </div>

            {#if totalPages > 1}
                <div class="ml-auto flex shrink-0 items-center justify-end gap-1">
                    <Button color="light" size="xs" disabled={currentPage === 1} onclick={previousPage}>
                        <ChevronLeftOutline class="h-4 w-4" />
                    </Button>

                    {#each paginationPages as page}
                        <button
                            type="button"
                            class="h-8 min-w-8 rounded-lg border px-2 text-xs font-medium transition-colors
                                {currentPage === page
                                    ? 'border-[#004a80] bg-[#004a80] text-white'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
                            aria-current={currentPage === page ? "page" : undefined}
                            onclick={() => (currentPage = page)}
                        >
                            {page}
                        </button>
                    {/each}

                    <Button color="light" size="xs" disabled={currentPage === totalPages} onclick={nextPage}>
                        <ChevronRightOutline class="h-4 w-4" />
                    </Button>
                </div>
            {/if}
    </div>
    </section>

    {#if openNonModal}
        <aside class="drawer-panel">
            <div class="panel-inner">
                <div class="flex items-start justify-between gap-4 pb-5 mb-[22px] border-b border-[#f0f1f3]">
                    <div>
                        <p class="mt-[5px] text-[12px] leading-[1.5] text-[#7b8491]">
                            {editingStudentId === null
                                ? "Add a new student ."
                                : "Update the student's information."}
                        </p>
                    </div>
                    <button type="button" class="close-button" aria-label="Close panel" onclick={closePanel}>×</button>
                </div>

                <form class="drawer-form" onsubmit={handleSubmit}>
                    <div class="form-field">
                        <label for="student-name"> Student Name</label>
                        <Input id="student-name" type="text"placeholder="Enter student name" bind:value={name} required/>
                    </div>

                    <div class="form-field">
                        <label for="student-phone"> Phone Number </label>
                        <Input id="student-phone" type="tel" placeholder="Enter phone number" bind:value={phone} required />
                    </div>

                    <div class="form-field">
                        <label for="student-school"> School</label>
                        <Select id="student-school" bind:value={schoolId} required>
                            {#each schoolsData as school}
                                <option value={String(school.id)}> {school.schoolName} </option>
                            {/each}
                        </Select>
                    </div>

                    <div class="form-field">
                        <label for="academic-year">Academic Year</label>
                        <Input id="academic-year" type="text"  placeholder="e.g. 2026-2027" bind:value={academicYear} required/>
                    </div>

                    <div class="form-field">
                        <label for="student-status">Status</label>
                        <Select  id="student-status" bind:value={status} required>
                            {#each statusOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </Select>
                    </div>

                    {#if formError}
                        <div class="form-error">{formError}</div>
                    {/if}

                    <div class="flex space-x-2">
                        <Button class="w-full" type="submit"  disabled={submitting}>
                            {submitting ? "Saving..." : editingStudentId === null ? "Add Student": "Update Student"}
                        </Button>
                        <Button type="button" color="alternative" onclick={closePanel} > Cancel</Button>
                    </div>
                </form>
            </div>
        </aside>
    {/if}
</div>
