<script lang="ts">
    import { onMount } from "svelte";
    import { Avatar, Button } from 'flowbite-svelte';
    import { PlusOutline } from 'flowbite-svelte-icons';
    import type { School } from "$lib/types";

    
    let schoolName = $state("");
    let contactName = $state("");
    let contactPhone = $state("");
    let contactEmail = $state("");
    let logoUrl = $state("");

    let submitting = $state(false);
    let formError = $state("");
    let openNonModal = $state(false);
    let editingSchoolId = $state<number | null>(null);
    let tableSearchQuery = $state("");

    let rowsPerPage = $state(10);

    // #region List / table state
    let { dark } = $props<{ dark: boolean }>();
    let schoolsData = $state<School[]>([]);
    let loading = $state(true);
    let error = $state("");
    let searchQuery = $state("");      
    
    // #endregion

    // #region Detail panel state
    let selectedSchool = $state<School | null>(null);
    let isEditingDetail = $state(false);
    let editName = $state("");
    let editContactName = $state("");
    let editContactPhone = $state("");
    let editContactEmail = $state("");
    let editLogoUrl = $state("");
    // #endregion

    const headers = ["", "School Name", "Contact Name", "Phone", "Email", "", ""];

   
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
        logoUrl = "";
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
        logoUrl = school.logoUrl ?? "";
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
                body: JSON.stringify({ schoolName, contactName, contactPhone, contactEmail, logoUrl })
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
                body: JSON.stringify({ schoolName, contactName, contactPhone, contactEmail, logoUrl })
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
        editLogoUrl = selectedSchool.logoUrl ?? "";
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
                    logoUrl: editLogoUrl
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

    function handleImageUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                editLogoUrl = e.target?.result as string;
            };
            reader.readAsDataURL(file);
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
               
                  <div class="flex items-center shrink-0">
                    <Button color="light" class="h-9" onclick={openAddDrawer}>
                      <PlusOutline size = sm/>&nbsp;Add School
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
                            <th></th>
                            <th>School Name</th>
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
                                    <td class="w-4 p-4">
                                        {#if school.logoUrl}
                                            <Avatar size="sm" src={school.logoUrl} />
                                        {:else}
                                            <Avatar size="sm">{school.schoolName.charAt(0).toUpperCase()}</Avatar>
                                        {/if}
                                    </td>
                                    <td><span class="student-name">{school.schoolName}</span></td>
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
                        <label for="logo-url" class="mb-2 block">Logo URL <span class="text-gray-400">(optional)</span></label>
                        <input id="logo-url" placeholder="https://..." bind:value={logoUrl} />
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
</div>

