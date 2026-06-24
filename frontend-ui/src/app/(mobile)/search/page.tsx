import { redirect } from "next/navigation";

// Home search is now inline on "/". This bare route just sends any stray link home.
export default function SearchPage() {
  redirect("/");
}
