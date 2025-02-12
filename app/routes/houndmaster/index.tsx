import { redirect } from "react-router";

const description =
  "Multi-chain NFT collection analysis tool. Track mint revenue, monitor contracts, and get AI-powered insights across multiple blockchains.";
const title = "Houndmaster | NFT Collection Analysis";

export const meta = () => {
  return [
    { title },
    { name: "description", content: description },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/meta.png" },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: "/meta.png" },
  ];
};

export const loader = async () => {
  return redirect("/houndmaster/ethereum");
};
