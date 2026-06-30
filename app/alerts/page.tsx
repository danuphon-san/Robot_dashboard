import { AlertsPage } from "@/components/dashboard/alerts-page";

export default async function AlertsRoute({
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

  return <AlertsPage search={search} />;
}
