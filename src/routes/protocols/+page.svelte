<script lang="ts">
    import { onMount } from "svelte";
    import type { Protocol } from "$lib/types";
    import { Button,Badge, Select,  Checkbox, Radio  } from "flowbite-svelte";
    import { PlusOutline, FilePdfOutline, DownloadOutline  } from "flowbite-svelte-icons";
 
    let protocolsData = $state<Protocol[]>([]);
    let tableSearchQuery = $state("");
    let loading = $state(true);
    let error = $state("");
    let pdfFile = $state<File | null>(null);

    let openNonModal = $state(false);
    let submitting = $state(false);
    let formError = $state("");

    let exportModalOpen = $state(false);
    let exportFormat = $state<"pdf" | "excel">("pdf");
    let exportStatus = $state("All");
    let exporting = $state(false);
    let exportError = $state("");

    const exportColumns = [
        { key: "organization", label: "Organization" },
        { key: "representative", label: "Representative" },
        { key: "date", label: "Date" },
        { key: "phonenumber", label: "Phone Number" },
        { key: "status", label: "Status" }
    ] as const;

    let selectedColumns = $state<string[]>(exportColumns.map((c) => c.key));

    function openExportModal() {
        exportStatus = "All";
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

        const rows = protocolsData
            .filter((p) => exportStatus === "All" || p.status === exportStatus)
            .map((p) =>
                cols.map((c) =>
                    c.key === "date" ? formatDate(p.date) : String(p[c.key] ?? "-")
                )
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
            exportError = "No protocols match the selected status.";
            return;
        }

        exporting = true;

        try {
            const suffix = exportStatus === "All" ? "all" : exportStatus.toLowerCase().replace(/\s+/g, "-");
            const fileName = `protocols-report-${suffix}`;

            if (exportFormat === "excel") {
                const XLSX = await import("xlsx");
                const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const book = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(book, sheet, "Protocols");
                XLSX.writeFile(book, `${fileName}.xlsx`);
            } else {
                const { jsPDF } = await import("jspdf");
                const autoTable = (await import("jspdf-autotable")).default;

                const doc = new jsPDF({ orientation: headers.length > 4 ? "landscape" : "portrait" });
                doc.setFontSize(14);
                doc.text("Protocols Report", 14, 15);
                doc.setFontSize(10);
                doc.text(`Status: ${exportStatus}  |  Total: ${rows.length}`, 14, 22);

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

    let pdfModalOpen = $state(false);
    let selectedPdfProtocolId = $state<number | null>(null);

    let editingProtocolId = $state<number | null>(null);

    let organization = $state("");
    let representative = $state("");
    let date = $state("");
    let phoneNumber = $state("");
   
    let status = $state("Not Signed");
    let rowsPerPage = $state(10);
    let statusFilter = $state("All");

    let filteredProtocolsTable = $derived(
        protocolsData.filter((protocol) => {
            const matchesSearch = protocol.organization.toLowerCase().includes(tableSearchQuery.toLowerCase());
            const matchesStatus = statusFilter === "All" || protocol.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
    );

    let displayedProtocols = $derived(
        filteredProtocolsTable.slice(0, rowsPerPage)
    );

    const statusOptions = [ "Not Signed", "Signed", "In Progress"];

    function openPdf(id: number) {
        selectedPdfProtocolId = id;
        pdfModalOpen = true;
    }

    function closePdfModal() {
        pdfModalOpen = false;
        selectedPdfProtocolId = null;
    }
    
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
        pdfFile = null; 
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
        status = protocol.status ?? "Not Signed";
        submitting = false;
        openNonModal = true;

    }

    async function addProtocol() {
        formError = "";

        if (!organization.trim()) {
            formError = "Please fill in all required fields.";
            return;
        }

        if (status !== "Not Signed" && !date) { 
            formError = "Please enter the protocol date."; 
            return; 
        }

        submitting = true;

        try {
            const formData = new FormData();

            formData.append("organization", organization.trim());
            formData.append("representative", representative.trim());
            formData.append("date", date);
            formData.append("phoneNumber", phoneNumber.trim());
            formData.append("status", status);

            if (pdfFile) {
                formData.append("pdf", pdfFile);
            }

            const response = await fetch("/api/protocols", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create protocol"
                );
            }

            protocolsData = [...protocolsData, data];

            closePanel();

        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "Failed to create protocol";
        } finally {
            submitting = false;
        }
    }

    async function updateProtocol() {
        if (editingProtocolId === null) {
            return;
        }

        formError = "";

        if (!organization.trim()) {
            formError = "Please fill in all required fields.";
            return;
        }
        if (status !== "Not Signed" && !date) { 
            formError = "Please enter the protocol date."; 
            return; 
        }

        submitting = true;

        try {
            const formData = new FormData();

            formData.append("organization", organization.trim());
            formData.append("representative", representative.trim());
            formData.append("date", date);
            formData.append("phoneNumber", phoneNumber.trim());
            formData.append("status", status);

            if (pdfFile) {
                formData.append("pdf", pdfFile);
            }

            const response = await fetch(
                `/api/protocols/${editingProtocolId}`,
                {
                    method: "PATCH",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update protocol"
                );
            }

            protocolsData = protocolsData.map((protocol) =>
                protocol.id === data.id ? data : protocol
            );

            closePanel();

        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "Failed to update protocol";
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
                <div class="flex items-center gap-2 shrink-0">
                    <Button color="light" class="h-9" onclick={openExportModal}>
                        <DownloadOutline size="sm" />&nbsp;Export
                    </Button>
                    <Button color="light" class="h-9" onclick={openAddPanel}>
                        <PlusOutline size="sm" />&nbsp;Add Protocol
                    </Button>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between mb-4">
            <div class="w-2xs">
                <input type="text" placeholder="Search organizations..." bind:value={tableSearchQuery}/>

                {#if tableSearchQuery}
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onclick={() => (tableSearchQuery = "")} aria-label="Clear search">
                        ×
                    </button>
                {/if}
            </div>

            <div class="w-36">
            <select id="status-filter" bind:value={statusFilter}  >
                <option value="All">Filter by Status</option>
                {#each statusOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
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
                                    <td>
                                        {#if protocol.pdf}
                                            <button
                                                type="button"
                                                onclick={() => openPdf(protocol.id)}
                                            >
                                                <FilePdfOutline class="shrink-0 h-5 w-5" color="#000000"/>
                                            </button>
                                        {:else}
                                            <span class="table-text">-</span>
                                        {/if}
                                    </td>
                                    <td>
                                        {#if protocol.status === "Signed"} 
                                            <Badge color="green">{protocol.status ?? "-"}</Badge>
                                        {:else if protocol.status === "Not Signed"}
                                            <Badge color="red">{protocol.status ?? "-"}</Badge>
                                        {:else}
                                            <Badge color="yellow">{protocol.status ?? "-"}</Badge>
                                        {/if}
                                    
                                    </td>
                                    <td class="px-4 py-2">
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
                        <input id="protocol-date" type="date" bind:value={date}/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-phone">Phone Number</label>
                        <input id="protocol-phone" type="tel" placeholder="Enter phone number" bind:value={phoneNumber}/>
                    </div>

                    <div class="form-field">
                        <label for="protocol-pdf">PDF</label>
                        <input
                            id="protocol-pdf"
                            type="file"
                            accept="application/pdf"
                            onchange={(event) => {
                                const input = event.currentTarget as HTMLInputElement;
                                pdfFile = input.files?.[0] ?? null;
                            }}
                        />
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

    {#if pdfModalOpen && selectedPdfProtocolId !== null}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onclick={closePdfModal}
        >
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Protocol PDF"
                onclick={(event) => event.stopPropagation()}
            >
                <div class="flex items-center justify-between px-4 py-3 border-b">
                    <h2 class="font-semibold">
                        Protocol PDF
                    </h2>

                    <button
                        type="button"
                        class="text-xl"
                        aria-label="Close PDF"
                        onclick={closePdfModal}
                    >
                        ×
                    </button>
                </div>

                <div class="w-full h-[calc(100%-57px)]">
                    <iframe
                        src={`/api/protocols/${selectedPdfProtocolId}/pdf`}
                        title="Protocol PDF"
                        class="w-full h-full"
                    ></iframe>
                </div>
            </div>
        </div>
    {/if}

    {#if exportModalOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onclick={closeExportModal}>
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div class="w-full max-w-md bg-white rounded-lg overflow-hidden" role="dialog" aria-modal="true" aria-label="Export report"  onclick={(event) => event.stopPropagation()} >
                <div class="flex items-center justify-between px-5 py-3 border-b">
                    <h2 class="font-semibold">Export Report</h2>
                    <button type="button" class="text-xl" aria-label="Close" onclick={closeExportModal}>×</button>
                </div>

                <div class="p-5 space-y-6">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-sm font-semibold text-gray-900">Columns</p>
                            <button type="button" class="text-xs text-blue-700 hover:underline" onclick={() =>
                                (selectedColumns = selectedColumns.length === exportColumns.length  ? []  : exportColumns.map((c) => c.key))}>
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

                    <!-- Status -->
                    <div>
                        <label for="export-status" class="text-sm font-semibold text-gray-900 mb-2 block">
                            Status
                        </label>
                        <select id="export-status" bind:value={exportStatus}>
                            <option value="All">All statuses</option>
                            {#each statusOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
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
