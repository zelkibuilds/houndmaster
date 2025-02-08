import { NavLink, Outlet } from "react-router";

export default function HoundmasterLayout() {
  const chains = [
    "ethereum",
    "base",
    "arbitrum",
    "apechain",
    "abstract",
    "polygon",
  ];

  return (
    <div className="min-h-screen bg-[#1A0B26]">
      <nav
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b-2 border-orange-500/20 px-4 py-3
        before:absolute before:inset-0 before:bg-gradient-to-b before:from-purple-500/5 before:to-orange-500/5 before:pointer-events-none"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
          <h1 className="font-medieval text-orange-400 text-lg tracking-wider mr-4">
            Realms
          </h1>
          {chains.map((chain) => (
            <NavLink
              key={chain}
              to={`/houndmaster/${chain}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-medieval tracking-wider transition-all duration-200 relative text-sm
                before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none
                ${
                  isActive
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105"
                    : "text-purple-200 hover:text-white hover:bg-purple-900/50 hover:scale-105"
                }`
              }
            >
              {({ isActive }) => (
                <span className="capitalize whitespace-nowrap relative">
                  {chain}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
