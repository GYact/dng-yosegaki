import { notFound } from "next/navigation";
import { getGraduate, getGraduateData, getMessages } from "@/lib/data";
import GraduateView from "@/components/GraduateView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GraduatePage({ params }: Props) {
  const { slug } = await params;
  const graduate = getGraduate(slug);

  if (!graduate) {
    notFound();
  }

  const messages = getMessages(slug);
  const { year, labName } = getGraduateData();

  return (
    <GraduateView
      graduate={graduate}
      initialMessages={messages}
      year={year}
      labName={labName}
    />
  );
}

export async function generateStaticParams() {
  const { graduates } = getGraduateData();
  return graduates.map((g) => ({ slug: g.slug }));
}
