import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  ...prefix("houndmaster", [
    layout("routes/houndmaster/layout.tsx", [
      index("routes/houndmaster/index.tsx"),
      route(":chain", "routes/houndmaster/chain.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
