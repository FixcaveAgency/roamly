import PublicPassport from "@/components/PublicPassport";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicPassport slug={slug} />;
}
