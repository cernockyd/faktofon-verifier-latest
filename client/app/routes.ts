import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("layout.tsx", [
    route("card", "./routes/card.tsx"),
    index("routes/home.tsx"),
  ]),
] satisfies RouteConfig;
