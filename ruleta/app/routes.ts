import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("roulette", "routes/roulette.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("user/profile/:id", "routes/user-profile.tsx"),
] satisfies RouteConfig;
