import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Menu } from "lucide-react";
import { User } from "mercadopago";

export type NavItem = {
  name: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
  badge?: string;
};

const logoUrl = "/icon.png"; 

export function SidebarWithHeader({
  nav = [],
  children,
  brand = { name: "TAP", logo: undefined as React.ReactNode },
  currentUser,
}: {
  nav?: NavItem[];
  children: React.ReactNode;
  brand?: { name: string; logo?: React.ReactNode };
  currentUser: any;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 transform bg-white shadow-xl transition-transform dark:bg-gray-900 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <Sidebar brand={brand} nav={nav} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <Sidebar brand={brand} nav={nav} />
      </div>

      {/* Header */}
      <div className="lg:pl-72">
        <Header onMenu={() => setSidebarOpen(true)} currentUser={currentUser} />

        {/* Main */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ brand, nav, onNavigate }: { brand: { name: string; logo?: React.ReactNode }; nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-gray-200 bg-white px-4 pb-6 pt-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Brand */}
      <div className="flex justify-center">
        <Image 
          src={logoUrl} 
          alt="TAP" 
          width={140} // Define el ancho fijo
          height={140} // Define el alto fijo
          className="h-30 w-auto" // Clases de Tailwind adicionales si es necesario
        />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <li key={item.name}>
              <a
                href={item.href ?? "#"}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-transparent transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/70 ${item.current ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
                {item.badge ? (
                  <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 group-hover:bg-white dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>

        {/* Secondary */}
        <div className="mt-4 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Take Away Please</p>
        </div>
      </nav>
    </div>
  );
}

function Header({ onMenu, currentUser }: { onMenu: () => void, currentUser: any }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/70 dark:supports-[backdrop-filter]:bg-gray-900/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={onMenu}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="lg:hidden h-6 w-6" aria-hidden="true" />
        </button>

        {/* Search */}
        {/* <div className="relative hidden min-w-0 flex-1 sm:block">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Search..."
            className="block w-full rounded-xl border-0 bg-gray-100/80 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-400 dark:ring-gray-700"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            icon
          </div>
        </div> */}

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-800 dark:bg-gray-900">
            {/* <img
              alt="Avatar"
              src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=96&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wx"
              className="h-8 w-8 rounded-full object-cover"
            /> */}
            <div className="hidden text-left text-sm sm:block">
              <div className="text-gray-500 dark:text-gray-400">{currentUser.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}