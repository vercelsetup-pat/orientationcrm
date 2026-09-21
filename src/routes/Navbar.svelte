<script lang="ts">
  //import { AppsMenu, UserMenu, NotificationList, mapUsersWithAvatars } from '$lib';
  import { DarkMode, Dropdown, DropdownItem, NavBrand, NavLi, NavUl, Navbar, Search, DropdownDivider } from 'flowbite-svelte';
  import {
   
    ChevronDownOutline
  } from 'flowbite-svelte-icons';
  import '../../src/layout.css';
 import AUL from "$lib/assets/aulogo.png"
 


  interface Props {
    drawerHidden?: boolean;
    list?: boolean;
  }

  let { drawerHidden = $bindable(false), list = false }: Props = $props();

  


</script>

<Navbar class="mx-10 sm:mx-0">
  <NavBrand href="/" class="mx-10">
    <img src={AUL} class="me-2.5 h-6 sm:h-8" alt="Flowbite Logo" />
    <span class="ml-px self-center text-xl font-semibold whitespace-nowrap sm:text-2xl dark:text-white"> AUL University Orientation Msg </span>
  </NavBrand>
  <div class="hidden lg:block lg:ps-3">
    {#if list}
      <NavUl class="ml-2" activeUrl="/" activeClass="text-primary-600 dark:text-primary-500">
        <NavLi href="/">Home</NavLi>
        <NavLi href="#top">Messages</NavLi>
        <NavLi href="#top">Profile</NavLi>
        <NavLi href="#top">Settings</NavLi>
        <NavLi class="cursor-pointer">
          Dropdown
          <ChevronDownOutline class="ms-0 inline" />
        </NavLi>
        <Dropdown class="z-20 w-44">
          <DropdownItem href="#top">Item 1</DropdownItem>
          <DropdownItem href="#top">Item 2</DropdownItem>
          <DropdownItem href="#top">Item 3</DropdownItem>
        </Dropdown>
      </NavUl>
   
  
    {/if}
  </div>
  <div class="ms-auto flex items-center text-gray-500 sm:order-2 dark:text-gray-300">
  
    <DarkMode />

  </div> 
</Navbar>