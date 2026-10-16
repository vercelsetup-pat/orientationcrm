
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import {
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		SidebarButton,
		uiHelpers
	} from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		BuildingOutline,
		ClipboardListSolid,
		CogOutline,
		LayersSolid,
		ChartPieOutline,
		UserCircleOutline,
		UsersGroupOutline
	} from 'flowbite-svelte-icons';
	import { page } from '$app/state';
	import logo from '$lib/assets/aulogo.png';

	interface Props {
		drawerHidden: boolean;
		docsRoute: string[];
	}

	let { drawerHidden = $bindable(false), docsRoute }: Props = $props();

	const sidebarUi = uiHelpers();

	let isOpen = $state(false);
	let proMode = $state(true);

	$effect(() => {
		isOpen = sidebarUi.isOpen;
	});

	afterNavigate(() => {
		document.getElementById('svelte')?.scrollTo({ top: 0 });
		drawerHidden = true;
	});

	// Navigation configuration
	const generalItems = [
		{ name: 'Dashboard', Icon: ChartPieOutline, href: '/' },
		{ name: 'Schools', Icon: LayersSolid, href: '/schools' },
		{ name: 'Students', Icon: ClipboardListSolid, href: '/students' },
		{ name: 'Protocols', Icon: BuildingOutline, href: '/protocols' },
		{ name: 'Calendar', Icon: CalendarMonthOutline, href: '/calender' }
	];

	const accountItems = [
		{ name: 'My Profile', Icon: UserCircleOutline, href: '/profile' },
		{ name: 'Users', Icon: UsersGroupOutline, href: '/users' },
		{ name: 'Settings', Icon: CogOutline, href: '/settings' }
	];

	// Shared styles
	const navGroupClass = 'space-y-[2px]';

	const navItemClass =
		'group flex w-full items-center rounded-[7px] text-[12px] font-normal transition-colors duration-150';

	const navLinkClass =
		'!flex !h-[34px] !w-full !items-center !rounded-[7px] !px-[9px] !py-0 transition-colors duration-150';

	const navIconClass =
		'h-[14px] w-[14px] shrink-0 text-[#647176] transition-colors duration-150 group-hover:!text-[#00427A]';

	const sectionTitleClass =
		'mb-2 px-1 text-[10px] font-medium tracking-[0.09em] text-[#929DA2]';

	const footerItemClass =
		'flex h-[34px] w-full items-center rounded-[7px] px-[9px] text-[12px] text-[#465257] transition-colors duration-150 hover:bg-[#E7EDF1] hover:text-[#00427A]';

	// Keep the correct item active on nested routes.
	function isRouteActive(href: string): boolean {
		const pathname = page.url.pathname;

		return href === '/'
			? pathname === '/'
			: pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

<!-- Mobile menu button -->
<SidebarButton breakpoint="lg" onclick={sidebarUi.toggle} class="fixed left-3 top-4 z-50 !m-0 !h-9 !w-9 rounded-lg border border-[#E1E7EA] !bg-white shadow-sm lg:hidden"/>
	<Sidebar breakpoint="lg" backdrop={false} {isOpen} params={{ x: -50, duration: 150 }} class="fixed left-0 top-0 z-40 h-screen w-[220px] bg-[#F1F4F6] transition-transform"
		classes={{
			div: 'h-full w-full overflow-hidden bg-[#F1F4F6] p-0',
			nonactive: 'p-0',
			active: 'p-0'
		}}
	>
	<SidebarWrapper class="flex h-screen max-w-none flex-col overflow-hidden bg-[#F1F4F6] p-0 dark:bg-[#F1F4F6]">
		<div class="flex h-[64px] shrink-0 items-center border-b border-[#E1E6E9] px-4">
			<img src={logo} alt="AUL University logo" class="h-[32px] w-[32px] shrink-0 object-contain"/>
			<span class="ml-2 text-[15px] font-semibold tracking-[-0.3px] text-[#00427A]">
				AUL University
			</span>
		</div>

		<nav class="min-h-0 flex-1 overflow-y-auto px-3 py-5">
			<section class="mb-6">
				<h2 class={sectionTitleClass}>ORIENTATION</h2>
				<SidebarGroup class={navGroupClass}>
					{#each generalItems as item (item.href)}
						{@const active = isRouteActive(item.href)}

						<SidebarItem label={item.name} href={item.href} class={navItemClass}
							aClass={`${navLinkClass} ${
								active
									? '!bg-white !text-[#00427A] shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_0_0_1px_#E1E7EA]'
									: '!bg-transparent !text-[#465257] hover:!bg-[#E7EDF1] hover:!text-[#00427A]'
							}`}
							spanClass="ml-[10px] !text-[12px] !font-normal"
						>
							{#snippet icon()}
								<item.Icon
									class={active
										? 'h-[14px] w-[14px] shrink-0 !text-[#00427A]'
										: navIconClass}
								/>
							{/snippet}
						</SidebarItem>
					{/each}
				</SidebarGroup>
			</section>

			<!-- Account -->
			<section>
				<h2 class={sectionTitleClass}>ACCOUNT</h2>
				<SidebarGroup class={navGroupClass}>
					{#each accountItems as item (item.href)}
						{@const active = isRouteActive(item.href)}
						<SidebarItem
							label={item.name}
							href={item.href}
							class={navItemClass}
							aClass={`${navLinkClass} ${
								active
									? '!bg-white !text-[#00427A] shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_0_0_1px_#E1E7EA]'
									: '!bg-transparent !text-[#465257] hover:!bg-[#E7EDF1] hover:!text-[#00427A]'
							}`}
							spanClass="ml-[10px] !text-[12px] !font-normal"
						>
							{#snippet icon()}
								<item.Icon
									class={active
										? 'h-[14px] w-[14px] shrink-0 !text-[#00427A]'
										: navIconClass}
								/>
							{/snippet}
						</SidebarItem>
					{/each}
				</SidebarGroup>
			</section>
		</nav>

		<!-- Fixed footer -->
		<footer class="shrink-0 border-t border-[#E1E6E9] px-3 pb-3 pt-3">
			<!-- Settings -->
			<a href="/settings" class={footerItemClass}>
				<CogOutline class={navIconClass} />
				<span class="ml-[10px]">Settings</span>
			</a>

			<!-- Help -->
			<button
				type="button"
				class={footerItemClass}
				onclick={() => {
					// Add your help action or route here.
				}}
			>
				<svg
					class="h-[14px] w-[14px] shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
					<circle cx="12" cy="17" r="0.5" fill="currentColor" />
				</svg>
				<span class="ml-[10px]">Help</span>
			</button>

			<!-- Pro Mode -->
			<div class="flex h-[38px] items-center justify-between px-[9px]">
				<div class="flex items-center text-[11px] text-[#465257]">
					<svg
						class="h-[14px] w-[14px] shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						aria-hidden="true"
					>
						<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
					</svg>
					<span class="ml-[10px]">Pro Mode</span>
				</div>

				<button
					type="button"
					role="switch"
					aria-checked={proMode}
					aria-label="Toggle Pro Mode"
					class="pro-toggle"
					class:enabled={proMode}
					onclick={() => (proMode = !proMode)}
				>
					<span></span>
				</button>
			</div>

			<!-- User profile -->
			<button
				type="button"
				class="flex h-[55px] w-full items-center rounded-[9px] border border-[#E1E6E9] bg-white px-[9px] text-left transition-colors hover:border-[#C8D6DF] hover:bg-[#FCFDFE]"
			>
				<div class="avatar">👤</div>

				<div class="ml-2 min-w-0 flex-1">
					<div class="truncate text-[11px] font-medium text-[#30383C]">
						Young Alaska
					</div>
					<div class="mt-[2px] truncate text-[9px] text-[#929DA2]">
						askyoung@gmail.com
					</div>
				</div>

				<span class="ml-2 text-[12px] text-[#8E989B]" aria-hidden="true">⌄</span>
			</button>

			<!-- Copyright -->
			<p class="mt-3 text-center text-[9px] text-[#929DA2]">
				© 2026 AUL University
			</p>
		</footer>
	</SidebarWrapper>
</Sidebar>

<style>
	.pro-toggle {
		position: relative;
		width: 28px;
		height: 16px;
		flex-shrink: 0;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: #cbd3d5;
		cursor: pointer;
		transition: background-color 180ms ease;
	}

	.pro-toggle span {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
		transition: transform 180ms ease;
	}

	.pro-toggle.enabled {
		background: #00427a;
	}

	.pro-toggle.enabled span {
		transform: translateX(12px);
	}

	.pro-toggle:focus-visible {
		outline: 2px solid #00427a;
		outline-offset: 3px;
	}

	.avatar {
		display: flex;
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #eaf0f4;
		font-size: 14px;
	}
</style>
