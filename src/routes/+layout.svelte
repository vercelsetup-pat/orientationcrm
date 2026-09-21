<script lang="ts">
	import Navbar from './Navbar.svelte';
	import Sidebar from './SideBar.svelte';
	import type { LayoutProps } from './$types';
	import '../layout.css'
	let { children, data }: LayoutProps = $props();

	let docsRoute: string[] = [];

	let drawerHidden = $state(false);
</script>

<!-- <header class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
	<Navbar bind:drawerHidden />
</header> -->

<div class=" lg:flex h-screen">
	<Sidebar bind:drawerHidden {docsRoute} />
	<div class="bg-whiterelative h-full w-full  lg:ml-[220px]">
		{@render children()}
	</div>
</div>
