import { redirect } from "react-router";

export const meta = () => {
  return [
    { title: "Redirecting to Ethereum | Houndmaster" },
    { name: "description", content: "Redirecting to Ethereum chain analysis" },
    // Open Graph
    { property: "og:title", content: "Redirecting to Ethereum | Houndmaster" },
    {
      property: "og:description",
      content: "Redirecting to Ethereum chain analysis",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/meta.png" },
    // Twitter
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Redirecting to Ethereum | Houndmaster" },
    {
      name: "twitter:description",
      content: "Redirecting to Ethereum chain analysis",
    },
    { name: "twitter:image", content: "/meta.png" },
  ];
};

export const loader = () => {
  return redirect("/houndmaster/ethereum");
};
