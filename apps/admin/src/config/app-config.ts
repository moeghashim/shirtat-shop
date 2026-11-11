import { version } from "../../package.json";

export const APP_CONFIG = {
  name: "Shirtat",
  version,
  copyright: (year: number) => `© ${year}, Shirtat.`,
  meta: {
    image: "/og.png",
    title: "Shirtat admin",
    description: "Owner and designer dashboards for Shirtat.",
  },
};
