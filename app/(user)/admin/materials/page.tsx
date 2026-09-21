import AuthVerify from "@/app/ServerActions/auth/authVerify";
import {
  Download,
  FileText,
  MoreVertical,
  Search,
} from "lucide-react";
import MaterialUploadDialog from "./UploadBtn";

const materials = [
  {
    id: "1",
    name: "Tajweed Rules",
    fileName: "tajweed-rules.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedBy: "Admin",
    date: "12 Aug 2026",
  },
  {
    id: "2",
    name: "Surah Al-Baqarah Notes",
    fileName: "surah-al-baqarah.pdf",
    type: "PDF",
    size: "4.8 MB",
    uploadedBy: "Admin",
    date: "10 Aug 2026",
  },
  {
    id: "3",
    name: "Hifz Revision Guide",
    fileName: "hifz-revision-guide.docx",
    type: "DOCX",
    size: "1.2 MB",
    uploadedBy: "Teacher",
    date: "8 Aug 2026",
  },
  {
    id: "4",
    name: "Daily Dua Collection",
    fileName: "daily-duas.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadedBy: "Admin",
    date: "5 Aug 2026",
  },
];

const page = async () => {
  await AuthVerify("ADMIN");

  return (
    <main className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Materials
          </h1>

          <p className="mt-0.5 text-base text-muted-foreground">
            Manage and share study materials
          </p>
        </div>

        <MaterialUploadDialog />
      </div>

      {/* Materials container */}
      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Search */}
        <div className="border-b border-border p-5">
          <div className="relative w-full max-w-[320px]">
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search materials..."
              className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
            />
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              All Materials
            </h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {materials.length} materials available
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-y border-border bg-muted/30 text-left">
                <th className="w-[70px] px-5 py-4 text-xs font-semibold">
                  #
                </th>

                <th className="px-5 py-4 text-xs font-semibold">
                  Material
                </th>

                <th className="px-5 py-4 text-xs font-semibold">
                  Type
                </th>

                <th className="px-5 py-4 text-xs font-semibold">
                  Size
                </th>

                <th className="px-5 py-4 text-xs font-semibold">
                  Uploaded By
                </th>

                <th className="px-5 py-4 text-xs font-semibold">
                  Date
                </th>

                <th className="w-[80px] px-5 py-4 text-xs font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {materials.map((material, index) => (
                <tr
                  key={material.id}
                  className="border-b border-border last:border-b-0 transition hover:bg-muted/20"
                >
                  {/* Number */}
                  <td className="px-5 py-5 text-sm text-foreground">
                    {index + 1}
                  </td>

                  {/* Material */}
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="size-[18px] text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {material.name}
                        </p>

                        <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted-foreground">
                          {material.fileName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-5">
                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {material.type}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-5 py-5 text-sm text-muted-foreground">
                    {material.size}
                  </td>

                  {/* Uploaded by */}
                  <td className="px-5 py-5">
                    <p className="text-sm font-medium text-foreground">
                      {material.uploadedBy}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-5 text-sm text-muted-foreground">
                    {material.date}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Download ${material.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                      >
                        <Download className="size-[17px]" />
                      </button>

                      <button
                        type="button"
                        aria-label={`More actions for ${material.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                      >
                        <MoreVertical className="size-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {materials.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>

            <h3 className="mt-4 text-sm font-semibold">
              No materials found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first material to get started.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default page;