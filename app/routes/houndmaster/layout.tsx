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
    <div>
      <nav>
        {chains.map((chain) => (
          <NavLink
            key={chain}
            to={`/houndmaster/${chain}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="px-4 py-2 mx-1 rounded-lg hover:bg-amber-400 capitalize transition-colors">
              {chain}
            </span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
