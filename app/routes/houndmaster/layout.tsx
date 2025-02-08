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
            className={({ isActive }) =>
              `hover:bg-blue-300 ${isActive ? "bg-blue-500" : ""}`
            }
          >
            <span className="px-4 py-2 mx-1 capitalize transition-colors">
              {chain}
            </span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
