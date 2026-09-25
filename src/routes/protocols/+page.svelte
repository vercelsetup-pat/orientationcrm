<script lang="ts">
    import { onMount } from "svelte";
    import type { Protocol } from "$lib/types";
    import { Button } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";
    import { Badge } from "flowbite-svelte";

    let protocolsData = $state<Protocol[]>([]);
    let tableSearchQuery = $state("");
    let loading = $state(true);
    let error = $state("");

    let openNonModal = $state(false);
    let submitting = $state(false);
    let formError = $state("");

    let editingProtocolId = $state<number | null>(null);

    let organization = $state("");
    let representative = $state("");
    let date = $state("");
    let phoneNumber = $state("");
    let pdf = $state("");
    let status = $state("Not Signed");

    let rowsPerPage = $state(10);

    let filteredProtocolsTable = $derived(
        protocolsData.filter((s) => s.organization.toLowerCase().includes(tableSearchQuery.toLowerCase()))
    );

     let displayedProtocols = $derived(
        filteredProtocolsTable.slice(0, rowsPerPage)
    );


    const statusOptions = [
        "Not Signed",
        "Signed",
        "In Progress"
    ];

    async function loadProtocols() {
        loading = true;
        error = "";

        try {

            const response = await fetch("/api/protocols");

            if (!response.ok) {
                throw new Error("Failed to load protocols");
            }

            protocolsData = await response.json();

        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load protocols";
        } finally {
            loading = false;
        }
    }

    function formatDate(value: string | null) {

        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString();
    }

    function resetForm() {
        organization = "";
        representative = "";
        date = "";
        phoneNumber = "";
        pdf = "";
        status = "Not Signed";
        editingProtocolId = null;
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

    async function getProtocol(id: number) {

        try {

            const response = await fetch(
                `/api/protocols/${id}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error( data.message || "Failed to fetch protocol");
            }

            return data as Protocol;

        } catch (err) {
            formError = err instanceof Error ? err.message : "Failed to load protocol";
            return null;
        }

    }

    async function openEditPanel(id: number) {

        formError = "";
        submitting = true;
        const protocol = await getProtocol(id);

        if (!protocol) {
            submitting = false;
            return;
        }

        editingProtocolId = protocol.id;
        organization = protocol.organization;
        representative = protocol.representative ?? "";
        date = protocol.date ?? "";
        phoneNumber = protocol.phonenumber ?? "";
        pdf = protocol.pdf ?? "";
        status = protocol.status ?? "Not Signed";
        submitting = false;
        openNonModal = true;

    }

    async function addProtocol() {

        formError = "";
        if ( !organization.trim() || !date) {
            formError ="Please fill in all required fields.";
            return;
        }

        submitting = true;

        try {

            const response = await fetch("/api/protocols",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        organization: organization.trim(),
                        representative: representative.trim() || null,
                        date,
                        phoneNumber: phoneNumber.trim() || null,
                        pdf: pdf.trim() || null,
                        status
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error( data.message || "Failed to create protocol" );
            }

            protocolsData = [...protocolsData, data];
            closePanel();

        } catch (err) {
            formError = err instanceof Error ? err.message : "Failed to create protocol";
        } finally {
            submitting = false;
        }

    }

    async function updateProtocol() {

        if (editingProtocolId === null) {
            return;
        }

        formError = "";

        if (!organization.trim() || !date) {
            formError = "Please fill in all required fields.";
            return;
        }

        submitting = true;

        try {

            const response = await fetch(`/api/protocols/${editingProtocolId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body : JSON.stringify({
                        organization: organization.trim(),
                        representative:representative.trim() || null,
                        date,
                        phoneNumber:phoneNumber.trim() || null,
                        pdf:pdf.trim() || null,
                        status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error( data.message || "Failed to update protocol");
            }

            protocolsData = protocolsData.map((protocol) => protocol.id === data.id ? data: protocol );
            closePanel();

        } catch (err) {
            formError = err instanceof Error ? err.message : "Failed to update protocol";
        } finally {
            submitting = false;
        }

    }

    async function deleteProtocol(id: number) {

        const confirmed = confirm("Are you sure you want to delete this protocol?");
        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(`/api/protocols/${id}`, {method: "DELETE"});
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ||  "Failed to delete protocol");
            }
            protocolsData = protocolsData.filter( (protocol) => protocol.id !== id);

        } catch (err) {

            error = err instanceof Error ? err.message : "Failed to delete protocol";

        }

    }

    function handleSubmit(event: SubmitEvent) {

        event.preventDefault();
        if (editingProtocolId === null) {
            addProtocol();
        } else {
            updateProtocol();
        }

    }

    onMount(() => {loadProtocols();});

</script>


<div class="page" class:panel-open={openNonModal}>
    <section class="w-full min-w-0">
        <div class="flex items-end justify-between gap-5 mb-5">
        </div>
        <div class="card-primary">
            <div class="card-pattern"></div>
            <div class="relative z-[2] min-h-[100px] box-border px-[22px] py-5 flex items-center justify-between gap-5">
                <div class="flex flex-col gap-1">
                    <div class="flex space-x-2">
                        <div class="h1">{protocolsData.length}</div>
                        <div class="h5">
                            <div>Protocols</div>
                            <div>Keep your protocols list updated</div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center shrink-0">
                    <Button color="light" class="h-9" onclick={openAddPanel}>
                        <PlusOutline size="sm" />&nbsp;Add Protocol
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
                            <th>Organization</th>
                            <th>Representative</th>
                            <th>Date</th>
                            <th>Phone Number</th>
                            <th>PDF</th>
                            <th>Status</th>
                            <th class="!text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if loading}
                            <tr>
                                <td colspan="7"class="empty-cell">
                                    Loading protocols...
                                </td>
                            </tr>
                        {:else if error}
                            <tr>
                                <td colspan="7" class="empty-cell text-red-500">
                                    {error}
                                </td>
                            </tr>
                        {:else if protocolsData.length === 0}
                            <tr>
                                <td colspan="7" class="empty-cell" >No protocols found.</td>
                            </tr>
                        {:else}
                            {#each displayedProtocols as protocol}
                                <tr>
                                    <td><span class="student-name">{protocol.organization}</span></td>
                                    <td><span class="table-text">{protocol.representative ?? "-"}</span></td>
                                    <td><span class="table-text">{formatDate(protocol.date)}</span></td>
                                    <td><span class="table-text">{protocol.phonenumber ?? "-"}</span></td>
                                    <td><span class="table-text">{protocol.pdf ?? "-"}</span></td>
                                    <td><Badge>{protocol.status ?? "-"}</Badge></td>
                                    <td>
                                        <div class="row-actions">
                                            <button type="button" class="action-button" aria-label="Edit protocol" onclick={() => openEditPanel(protocol.id)}>
                                                ✎
                                            </button>

                                            <button type="button" class="action-button delete-button" aria-label="Delete protocol" onclick={() =>deleteProtocol(protocol.id)}>
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
            <div class="table-footer"> Showing {protocolsData.length} protocols </div>
        </div>
    </section>

    {#if openNonModal}
        <aside class="drawer-panel">
            <div class="panel-inner">
                <div class="flex items-start justify-between gap-4 pb-5 mb-[22px] border-b border-[#f0f1f3]">
                    <div>
                        <p class="mt-[5px] text-[12px] leading-[1.5] text-[#7b8491]">
                            {editingProtocolId === null  ? "Add a new protocol." : "Update the protocol's information."}
                        </p>
                    </div>

                    <button type="button" class="close-button" aria-label="Close panel"onclick={closePanel}>
                        ×
                    </button>
                </div>

                <form class="drawer-form" onsubmit={handleSubmit}>
                    <div class="form-field">
                        <label for="protocol-organization">Organization</label>
                        <input id="protocol-organization" type="text" placeholder="Enter organization name" bind:value={organization} required/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-representative">Representative</label>
                        <input id="protocol-representative" type="text" placeholder="Enter representative name" bind:value={representative}/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-date">Date</label>
                        <input id="protocol-date" type="date" bind:value={date} required/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-phone">Phone Number</label>
                        <input id="protocol-phone" type="tel" placeholder="Enter phone number" bind:value={phoneNumber}/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-pdf">PDF</label>
                        <input id="protocol-pdf" type="text" placeholder="Enter PDF link" bind:value={pdf}/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-status">Status</label>
                        <select id="protocol-status" bind:value={status} required>
                            <option value=""disabled>
                                Choose option ...
                            </option>

                            {#each statusOptions as option}
                                <option value={option}> {option}</option>
                            {/each}
                        </select>
                    </div>

                    {#if formError}
                        <div class="form-error">{formError}</div>
                    {/if}

                    <div class="flex space-x-2">
                        <Button class="w-full" type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : editingProtocolId === null ? "Add Protocol" : "Update Protocol"}
                        </Button>

                        <Button type="button" color="alternative" onclick={closePanel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </aside>
    {/if}
</div>
