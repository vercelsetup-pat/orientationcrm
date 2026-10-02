<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Badge } from 'flowbite-svelte';
    import { PlusOutline, DownloadOutline } from 'flowbite-svelte-icons';
    import type { School } from "$lib/types";

    let schoolName = $state("");
    let contactName = $state("");
    let contactPhone = $state("");
    let contactEmail = $state("");
    let location = $state("");
    let sector = $state("");

    let submitting = $state(false);
    let formError = $state("");
    let openNonModal = $state(false);
    let editingSchoolId = $state<number | null>(null);
    let tableSearchQuery = $state("");

    let rowsPerPage = $state(10);

    // #region List / table state
 
    let schoolsData = $state<School[]>([]);
    let loading = $state(true);
    let error = $state("");
  
    
    // #endregion

    // #region Detail panel state
    let selectedSchool = $state<School | null>(null);
    let isEditingDetail = $state(false);
    let editName = $state("");
    let editContactName = $state("");
    let editContactPhone = $state("");
    let editContactEmail = $state("");
    let editLocation = $state("");
    let editSector = $state("");
    // #endregion

    let exportModalOpen = $state(false);
    let exportFormat = $state<"pdf" | "excel">("pdf");
    let exporting = $state(false);
    let exportError = $state("");

    const exportColumns = [
        { key: "schoolName", label: "School Name" },
        { key: "contactName", label: "Contact Name" },
        { key: "contactPhone", label: "Phone" },
        { key: "contactEmail", label: "Email" }
    ] as const;

    const locations = [ "Keserwan", "Jbeil", "Batroun", "Dbayeh-Maten", "Other"];
    const sectors = [ "private" , "public"];
    const headers = ["", "School Name", "Contact Name", "Phone", "Email", "", ""];

    let selectedColumns = $state<string[]>(exportColumns.map((c) => c.key));

    let filteredSchoolsTable = $derived(
        schoolsData.filter((s) => s.schoolName.toLowerCase().includes(tableSearchQuery.toLowerCase()))
    );

    let displayedSchools = $derived(
        filteredSchoolsTable.slice(0, rowsPerPage)
    );

    function closePanel() {
        openNonModal = false;
        resetForm();
    }
  
    function resetForm() {
        editingSchoolId = null;
        schoolName = "";
        contactName = "";
        contactPhone = "";
        contactEmail = "";
        location = "";
        sector = "";
        formError = "";
    }

    function openAddDrawer() {
        resetForm();
        openNonModal = true;
    }

    function editSchool(school: School) {
        editingSchoolId = school.id;
        schoolName = school.schoolName;
        contactName = school.contactName ?? "";
        contactPhone = school.contactPhone ?? "";
        contactEmail = school.contactEmail ?? "";
        location = school.location ?? "";
        sector = school.sector ?? "";
        formError = "";
        openNonModal = true;
    }

    async function saveSchool() {
        if (editingSchoolId === null) {
            await createSchool();
        } else {
            await updateSchool();
        }
    }

    async function createSchool() {
        submitting = true;
        formError = "";
        try {
            const response = await fetch("/api/schools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    schoolName, 
                    contactName, 
                    contactPhone, 
                    contactEmail, 
                    location,
                    sector,
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to create school");

            schoolsData = [...schoolsData, data];
            openNonModal = false;
            resetForm();
        } catch (err) {
            console.error(err);
            formError = err instanceof Error ? err.message : "Something went wrong";
        } finally {
            submitting = false;
        }
    }

    async function updateSchool() {
        submitting = true;
        formError = "";
        try {
            const response = await fetch(`/api/schools/${editingSchoolId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    schoolName, 
                    contactName, 
                    contactPhone, 
                    contactEmail, 
                    location,
                    sector
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update school");

            schoolsData = schoolsData.map((s) => (s.id === editingSchoolId ? data : s));
            if (selectedSchool?.id === data.id) selectedSchool = data;

            openNonModal = false;
            resetForm();
        } catch (err) {
            formError = err instanceof Error ? err.message : "Something went wrong";
        } finally {
            submitting = false;
        }
    }

    async function deleteSchool(id: number) {
        const confirmed = confirm("Delete this school?");
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/schools/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            schoolsData = schoolsData.filter((s) => s.id !== id);
            if (selectedSchool?.id === id) selectedSchool = null;
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete school");
        }
    }
    // #endregion

    // #region Detail panel functions
    function selectSchool(school: School) {
        selectedSchool = school;
        isEditingDetail = false;
    }

    function startEditingDetail() {
        if (!selectedSchool) return;
        editName = selectedSchool.schoolName;
        editContactName = selectedSchool.contactName ?? "";
        editContactPhone = selectedSchool.contactPhone ?? "";
        editContactEmail = selectedSchool.contactEmail ?? "";
        editLocation = selectedSchool.location ?? "";
        editSector = selectedSchool.sector ?? "";
        isEditingDetail = true;
    }

    function cancelEditingDetail() {
        isEditingDetail = false;
    }

    async function saveDetailEdits() {
        if (!selectedSchool) return;
        try {
            const response = await fetch(`/api/schools/${selectedSchool.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schoolName: editName,
                    contactName: editContactName,
                    contactPhone: editContactPhone,
                    contactEmail: editContactEmail,
                    location: editLocation,
                    sector: editSector
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update school");

            schoolsData = schoolsData.map((s) => (s.id === data.id ? data : s));
            selectedSchool = data;
            isEditingDetail = false;
        } catch (err) {
            error = err instanceof Error ? err.message : "Something went wrong";
        }
    }

    
    // #endregion

    async function loadSchools() {
        try {
            const response = await fetch("/api/schools");
            if (!response.ok) throw new Error("Failed to fetch schools");
            schoolsData = await response.json();
        } catch (err) {
            console.error(err);
            error = "Failed to load schools";
        } finally {
            loading = false;
        }
    }

    function openExportModal() {
        exportError = "";
        exportModalOpen = true;
    }
 
    function closeExportModal() {
        exportModalOpen = false;
    }
 
    function toggleColumn(key: string) {
        selectedColumns = selectedColumns.includes(key)
            ? selectedColumns.filter((k) => k !== key)
            : [...selectedColumns, key];
    }
 
    function getExportData() {
        const cols = exportColumns.filter((c) => selectedColumns.includes(c.key));
 
        const rows = schoolsData.map((s) =>
            cols.map((c) => String(s[c.key] ?? "-"))
        );
 
        return { headers: cols.map((c) => c.label), rows };
    }
 
    async function exportReport() {
        exportError = "";
 
        if (selectedColumns.length === 0) {
            exportError = "Select at least one column.";
            return;
        }
 
        const { headers, rows } = getExportData();
 
        if (rows.length === 0) {
            exportError = "No schools to export.";
            return;
        }
 
        exporting = true;
 
        try {
            const fileName = "schools-report";
 
            if (exportFormat === "excel") {
                const XLSX = await import("xlsx");
                const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const book = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(book, sheet, "Schools");
                XLSX.writeFile(book, `${fileName}.xlsx`);
            } else {
                const { jsPDF } = await import("jspdf");
                const autoTable = (await import("jspdf-autotable")).default;
 
                const doc = new jsPDF({ orientation: headers.length > 4 ? "landscape" : "portrait" });
                doc.setFontSize(14);
                doc.text("Schools Report", 14, 15);
                doc.setFontSize(10);
                doc.text(`Total: ${rows.length}`, 14, 22);
 
                autoTable(doc, { head: [headers], body: rows, startY: 27 });
                doc.save(`${fileName}.pdf`);
            }
 
            closeExportModal();
        } catch (err) {
            exportError = "Failed to export report.";
        } finally {
            exporting = false;
        }
    }

    onMount(() => {
        loadSchools();
    });
</script>

<div class="page" class:panel-open={openNonModal}>
    <section class="w-full min-0">
        <div class="flex items-end justify-between gap-5 mb-5">
            <!--option to add moe content-->
        </div>
        <div class="card-primary">
            <div class="card-pattern"></div>
            <div class="relative z-[2] min-h-[100px] box-border px-[22px] py-5 flex items-center justify-between gap-5">
                <div class="flex flex-col gap-1">
                    <div class="flex space-x-2">
                        <div class="h1">
                           {schoolsData.length}
                        </div>

                        <div class="h5">
                            <div>Schools</div>
                            <div>Keep your schools list updated</div>
                        </div>
                    </div>
                </div>
               
                <div class="flex items-center gap-2 shrink-0">
                    <Button color="light" class="h-9" onclick={openExportModal}>
                        <DownloadOutline size="sm" />&nbsp;Export
                    </Button>
                    <Button color="light" class="h-9" onclick={openAddDrawer}>
                        <PlusOutline size="sm"/>&nbsp;Add School
                    </Button>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between mb-4">
             <div class="relative w-full max-w-[320px]">
                <input type="text" placeholder="Search schools..." bind:value={tableSearchQuery}/>
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
        </div>

        <div class="card-secondary">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>School Name</th>
                            <th>Location</th>
                            <th>Sector</th>
                            <th>Contact Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th class="!text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if loading}
                            <tr>
                                <td colspan="6"class="empty-cell">Loading students...</td>
                            </tr>
                        {:else if error}
                            <tr><td colspan="6" class="empty-cell text-red-500">{error}</td></tr>
                        {:else if filteredSchoolsTable.length === 0}
                            <tr><td colspan="6" class="empty-cell">No students found.</td></tr>
                        {:else}
                            {#each displayedSchools as school}
                                <tr>
                    
                                    <td><span class="student-name">{school.schoolName}</span></td>
                                    <td>
                                        {#if school.location}
                                            <Badge color="gray">{school.location}</Badge>
                                        {:else}
                                            -
                                        {/if}
                                    </td>
                                    <td>
                                        {#if school.sector === "private"}
                                            <Badge>{school.sector ?? "-"}</Badge>
                                        {:else if school.sector === "public"}
                                            <Badge color="green">{school.sector ?? "-"}</Badge>
                                        {/if}
                                    </td>
                                    <td><span class="table-text">{school.contactName ?? "-"}</span></td>
                                    <td><span class="table-text">{school.contactPhone ?? "-"}</span></td>
                                    <td><span class="table-text">{school.contactEmail ?? "-"}</span></td>
                                    <td class="px-4 py-2">
                                        <div class="row-actions">
                                             <button type="button" class="action-button" aria-label="Edit student" onclick={() => editSchool(school)} >
                                                ✎
                                            </button>
                                            <button type="button" class="action-button delete-button" aria-label="Delete student" onclick={() => deleteSchool(school.id)}>
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
            <div class="table-footer"> Showing {displayedSchools.length} of {filteredSchoolsTable.length} schools </div>
        </div>

          <div class="flex items-center justify-between mb-4">
             <div class="flex items-center justify-between py-4 border-t border-gray-100"> 
                <div class="flex items-center  text-sm text-gray-500"> 
                     <select bind:value={rowsPerPage}  > 
                        <option value={10}>10</option> 
                        <option value={15}>15</option> 
                        <option value={25}>25</option> 
                        <option value={35}>35</option> 
                    </select> 
                </div> 
            </div>
        </div>
    </section>


    {#if openNonModal}
        <aside class="drawer-panel">
            <div class="panel-inner">
                <div class="flex items-start justify-between gap-4 pb-5 mb-[22px] border-b border-[#f0f1f3]">
                    <div>
                        <p class="mt-[5px] text-[12px] leading-[1.5] text-[#7b8491]">
                            {editingSchoolId === null
                                ? "Add a new student ."
                                : "Update the student's information."}
                        </p>
                    </div>

                    <button type="button" class="close-button" aria-label="Close panel" onclick={closePanel}>×</button>
                </div>
                <form class="drawer-form" onsubmit={(event) => {  event.preventDefault();saveSchool();}}>
                    <div class="form-field">
                        <label for="school-name" class="mb-2 block">School Name</label>
                        <input id="school-name" placeholder="School name" bind:value={schoolName} />
                    </div>
                    <div class="form-field">
                        <label for="contact-name" class="mb-2 block">Contact name</label>
                        <input id="contact-name" placeholder="Contact name" bind:value={contactName} />
                    </div>
                    <div class="form-field">
                        <label for="contact-phone" class="mb-2 block">Phone number</label>
                        <input id="contact-phone" placeholder="Phone number" bind:value={contactPhone} />
                    </div>
                    <div class="form-field">
                        <label for="contact-email" class="mb-2 block">Email</label>
                        <input id="contact-email" placeholder="Email" bind:value={contactEmail} />
                    </div>
                   <div class="form-field">
                        <label for="school-location" class="mb-2 block">
                            Location
                        </label>

                        <select id="school-location" bind:value={location}>
                            <option value="">Select location</option>

                            {#each locations as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="school-sector" class="mb-2 block">
                           Sector
                        </label>

                        <select id="school-sector" bind:value={sector}>
                            <option value="">Select location</option>

                            {#each sectors as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                      
                    {#if formError}
                        <div class="form-error">{formError}</div>
                    {/if}

                    <div class="flex ">
                        <Button class="w-full" onclick={saveSchool} disabled={submitting}>
                            {submitting ? "Saving..." : editingSchoolId !== null ? "Update School" : "Save School"}
                        </Button>
                        <!-- <Button type="button" color="alternative" onclick={closePanel} > Cancel</Button> -->
                    </div>
                </form>
            </div>     
        </aside>
    {/if}

    {#if exportModalOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onclick={closeExportModal}>
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div class="w-full max-w-md bg-white rounded-lg overflow-hidden" role="dialog" aria-modal="true" aria-label="Export report" onclick={(event) => event.stopPropagation()}>
                <div class="flex items-center justify-between px-5 py-3 border-b">
                    <h2 class="font-semibold">Export Report</h2>
                    <button type="button" class="text-xl" aria-label="Close" onclick={closeExportModal}>×</button>
                </div>
 
                <div class="p-5 space-y-6">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-sm font-semibold text-gray-900">Columns</p>
                            <button type="button" class="text-xs text-blue-700 hover:underline" onclick={() =>
                                (selectedColumns = selectedColumns.length === exportColumns.length ? [] : exportColumns.map((c) => c.key))}>
                                {selectedColumns.length === exportColumns.length ? "Clear all" : "Select all"}
                            </button>
                        </div>
 
                        <div class="grid grid-cols-2 gap-2">
                            {#each exportColumns as col}
                                <label class="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors {selectedColumns.includes(col.key)
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'}">
                                    <input type="checkbox" style="width:16px; height:16px; min-width:16px; padding:0; margin:0; flex:none; accent-color:#004a80;" checked={selectedColumns.includes(col.key)} onchange={() => toggleColumn(col.key)}/>
                                    <span>{col.label}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
 
                    <!-- Format -->
                    <div>
                        <p class="text-sm font-semibold text-gray-900 mb-2">Format</p>
                        <div class="grid grid-cols-2 gap-2">
                            {#each [{ value: "pdf", label: "PDF" }, { value: "excel", label: "Excel" }] as opt}
                                <label
                                    class="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors
                                        {exportFormat === opt.value
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'}"
                                >
                                    <input
                                        type="radio"
                                        name="export-format"
                                        value={opt.value}
                                        style="width:16px; height:16px; min-width:16px; padding:0; margin:0; flex:none; accent-color:#004a80;"
                                        bind:group={exportFormat}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
 
                    {#if exportError}
                        <div class="form-error">{exportError}</div>
                    {/if}
 
                    <div class="flex gap-2 pt-1">
                        <Button
                            class="w-full"
                            onclick={exportReport}
                            disabled={exporting || selectedColumns.length === 0}
                        >
                            {exporting ? "Exporting..." : "Export"}
                        </Button>
                        <Button color="alternative" onclick={closeExportModal}>Cancel</Button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

