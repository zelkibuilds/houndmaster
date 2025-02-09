import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // App routes
  index("routes/eth-redirect.tsx"),
  ...prefix("houndmaster", [
    layout("routes/houndmaster/layout.tsx", [
      index("routes/houndmaster/index.tsx"),
      route(":chain", "routes/houndmaster/chain.tsx"),
    ]),
  ]),
  // API routes
  ...prefix("api", [route("/contract-data", "routes/api/contract-data.ts")]),
] satisfies RouteConfig;
