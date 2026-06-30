import { MachineDetailPage } from "@/components/dashboard/machine-detail-page";

export default async function MachineDetailRoute({
  params,
  searchParams
}: {
  params: Promise<{ machine_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { machine_id } = await params;
  const query = await searchParams;
  const entries: string[][] = [];
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => entries.push([key, item]));
    } else if (value) {
      entries.push([key, value]);
    }
  }
  const search = new URLSearchParams(entries).toString();

  return <MachineDetailPage machineId={machine_id} search={search} />;
}
