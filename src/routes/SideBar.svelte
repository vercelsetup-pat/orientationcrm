<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, SidebarButton, uiHelpers} from 'flowbite-svelte';
	import { CalendarMonthOutline, BuildingOutline, ClipboardListSolid, CogOutline, FileChartBarSolid, LayersSolid, LifeSaverSolid, LockSolid,ChartPieOutline} from 'flowbite-svelte-icons';
	import { page } from '$app/state';
	import  logo  from "$lib/assets/aulogo.png"
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

	const generalItems = [
		{
			name: 'Dashboard',
			Icon: ChartPieOutline,
			href: '/'
		},
		{
			name: 'Schools',
			Icon: LayersSolid,
			href: '/schools'
		},
		{
			name: 'Students',
			Icon: ClipboardListSolid,
			href: '/students'
		},
		{
			name: 'Protocols',
			Icon: BuildingOutline,
			href: '/protocols'
		},
		{
			name: 'Calender',
			Icon: CalendarMonthOutline,
			href: '/calender'
		}
	];

	const supportItems = [
		{
			name: 'Capital',
			Icon: LifeSaverSolid,
			href: '/capital'
		},
		{
			name: 'Vaults',
			Icon: LockSolid,
			href: '/vaults'
		},
		{
			name: 'Reports',
			Icon: FileChartBarSolid,
			href: '/reports'
		}
	];

	const iconClass ='w-[14px] h-[14px] shrink-0 text-[#4E5B60] transition-colors duration-150 group-hover:text-[#006875]';
	const itemClass ='group flex items-center w-full h-[31px] px-[9px] rounded-[7px] text-[11px] font-normal text-[#30383C] transition-colors duration-150 hover:bg-[#F8F9FA]';
	const groupClass ='pt-0 px-0 space-y-[1px] mb-[22px]';

</script>

<SidebarButton breakpoint="lg" onclick={sidebarUi.toggle} class="fixed left-3 top-4 z-50 !m-0 !h-8 !w-8 rounded-lg border border-[#E2E6E8]bg-whiteshadow-sm lg:hidden"/>
<Sidebar breakpoint="lg" backdrop={false} {isOpen} params={{ x: -50, duration: 150 }} class="top-0 left-0 h-screen w-[205px] bg-[#F1F4F6] transition-transform lg:fixed lg:block"
	classes={{ div: 'h-full w-full overflow-hidden bg-[#F1F4F6] p-0', nonactive: 'p-0', active: 'p-0'}}>
	<SidebarWrapper class=" flex h-screen max-w-none flex-col overflow-hidden bg-[#F1F4F6] p-0 dark:bg-[#F1F4F6]">
		<!--Logo-->
		<div class="flex h-[63px] items-center border-b border-[#e1e5e7] px-3">
			<img src={logo} alt="Sequence logo" class="h-[30px] w-[30px] shrink-0 object-contain"/>
			<span class="ml-[7px] text-[16px] font-medium tracking-[-0.35px] text-[#00427A]">AUL University</span>
		</div>

		<nav class="flex-1 pt-3.5 px-2 overflow-y-auto">
			<!--Genral-->
			<div class="flex-1 pt-[14px] px-[7px] overflow-y-auto">
				<div class="mb-1">
					<div class="px-1 mb-2 text-[#9da5a8] text-xs font-normal tracking-[0.06em]">
						ORIENTATION
					</div>
					<SidebarGroup class={groupClass}>
						{#each generalItems as item}
							{@const isActive = page.url.pathname === item.href}

							<SidebarItem label={item.name} href={item.href}
								class={isActive
								? `${itemClass} !bg-white hover:!bg-white !text-[#00427A] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_0_0_1px_rgba(225,229,231,0.8)]`
								: `${itemClass} hover:!bg-[#f5f7f8]`}
								aClass="w-full h-full !p-0 !flex !items-center"
								spanClass="ml-[9px] !text-[12px]"
								>
								{#snippet icon()}
									<item.Icon class={isActive ? 'w-3.5 h-3.5 shrink-0 !text-[#00427A]' : iconClass}/>
								{/snippet}
							</SidebarItem>
						{/each}
					</SidebarGroup>
				</div>
			</div>
		</nav>
		<div  class="px-[7px] pb-2">
			<!-- Settings button -->
			<button type="button" class={itemClass}>
				<div class="flex items-center">
					<CogOutline class="h-[14px] w-[14px] text-[#4E5B60]"/>
					<span class="ml-[9px]">Settings</span>
				</div>
			</button>

			<!-- Help button -->
			<button type="button" class={itemClass}>
				<div class="flex items-center">
					<svg class="h-[14px] w-[14px] text-[#4E5B60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="12" cy="12" r="9"/>
						<path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4"/>
						<circle cx="12" cy="17" r="0.5"fill="currentColor"/>
					</svg>
					<span class="ml-[9px]">Help</span>
				</div>
			</button>
			
			<!--Prow Mode button-->
			<div class="pro-mode-row">
				<div class="flex items-center">
					<svg class="h-[14px] w-[14px] text-[#4E5B60]" viewBox="0 0 24 24" fill="none" stroke="currentColor"stroke-width="1.5">
						<path d="M12 3v18" />
						<path d="M3 12h18" />
						<path d="M5.5 5.5l13 13" />
						<path d="M18.5 5.5l-13 13" />
					</svg>
					<span class="ml-[9px] text-[11px]">Pro Mode</span>
				</div>

				<button type="button" aria-label="Toggle Pro Mode" class:enabled={proMode} class="pro-toggle" onclick={() => (proMode = !proMode)}>
					<span></span>
				</button>
			</div>

			<div class="user-card">
				<div class="avatar">👨🏻</div>
				<div class="user-info">
					<div class="user-name">Young Alaska</div>
					<div class="user-email">askyoung@gmail.com</div>
				</div>
				<span class="user-chevron">⌃</span>
			</div>

			<!-- Copyright -->
			<div class="copyright">
				© 2024 Sequence Inc.
			</div>
		</div>
	</SidebarWrapper>
</Sidebar>

<style>

	.pro-mode-row {
		height: 31px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 9px;
	}

	.pro-toggle {
		position: relative;
		width: 25px;
		height: 14px;
		padding: 0;
		border: 0;
		border-radius: 20px;
		background: #cbd3d5;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.pro-toggle span {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
		transition: transform 0.2s ease;
	}

	.pro-toggle.enabled {
		background: #14ce88;
	}

	.pro-toggle.enabled span {
		transform: translateX(11px);
	}

	.user-card {
		height: 52px;
		display: flex;
		align-items: center;
		margin-top: 7px;
		padding: 0 9px;
		border: 1px solid #e5e8e9;
		border-radius: 9px;
		background: #ffffff;
	}

	.avatar {
		width: 27px;
		height: 27px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: 50%;
		background: #eee1da;
		font-size: 12px;
	}


	.user-info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		margin-left: 8px;
	}


	.user-name {
		overflow: hidden;
		color: #30383c;
		font-size: 9px;
		font-weight: 500;
		line-height: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}


	.user-email {
		overflow: hidden;
		margin-top: 1px;
		color: #9aa2a5;
		font-size: 8px;
		line-height: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}


	.user-chevron {
		margin-left: auto;
		color: #8e989b;
		font-size: 10px;
	}


	.copyright {
		margin-top: 8px;
		text-align: center;
		color: #9da4a6;
		font-size: 7px;
		line-height: 10px;
	}

</style>