import { redirect } from "next/navigation";

export default function Home() {
  // Default redirect — signed links point to /order/new?phone=...
  redirect("/order/new");
}
