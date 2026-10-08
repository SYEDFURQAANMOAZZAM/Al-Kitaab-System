import Link from "next/link";
import { notFound } from "next/navigation";

import ViewToc from "./ViewToc";

import { getSubjectForViewToc } from "@/app/ServerActions/subjectOperations/queries/getSubject.queries";

import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ViewTocPage({
  params,
}: Props) {
  await requireRoleForAction(["ADMIN"]);

  const { id } = await params;

  const subject = await getSubjectForViewToc(id);

  if (!subject) {
    notFound();
  }

  return (
    <main className="mx-auto w-full space-y-6 p-2 sm:p-6">
      <div className="space-y-2">
        <Link
          href={`/admin/subjects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Subjects
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          View TOC
        </h1>

        <p className="text-sm text-muted-foreground">
          View the complete table of contents for this
          subject.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ViewToc
          subjectName={subject.name}
          parts={subject.parts}
          tocItems={subject.tocItems}
        />
      </div>
    </main>
  );
}