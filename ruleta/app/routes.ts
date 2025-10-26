import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("roulette", "routes/roulette.tsx"),
] satisfies RouteConfig;
