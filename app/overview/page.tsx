import { OverviewPage } from "@/components/dashboard/overview-page";

export default async function OverviewRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const entries: string[][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => entries.push([key, item]));
    } else if (value) {
      entries.push([key, value]);
    }
  }
  const search = new URLSearchParams(entries).toString();

  return <OverviewPage search={search} />;
}
