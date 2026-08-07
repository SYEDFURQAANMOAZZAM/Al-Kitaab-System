import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";
import {
  CreateBatch,
  CreateBranch,
} from "@/ServiceHandlers/CreateGroups/CreateBatch&Branch";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Building2, Folder, MoreVertical } from "lucide-react";

const Page = async () => {
  await AuthVerify();

  const branches = await prisma.branch.findMany({
    include: {
      batches:{
        include:{
          _count:{
            select:{
              students:true,
              teachers:true
            }
          }
        }
      }
    },
  });
  

  return (
  <div className="space-y-6">
    {/* Page Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Branches
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage branches and their batches.
        </p>
      </div>

      <CreateBranch />
    </div>

    {/* Branch List */}
    <Accordion className="space-y-4">
      {branches.map((branch) => (
        <AccordionItem
          key={branch.id}
          value={branch.id}
          className="overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between p-5">
            {/* Left */}
            <div className="flex items-start gap-4">
              <Building2 className="mt-1 h-6 w-6 text-emerald-600" />

              <div>
                <h2 className="text-xl font-semibold">
                  {branch.name}
                </h2>

                <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
                  <span>
                    <strong>{branch.batches.length}</strong> Batches
                  </span>

                  <span>
                    <strong>
                      {branch.batches.reduce(
                        (sum, batch) => sum + batch._count.students,
                        0
                      )}
                    </strong>{" "}
                    Students
                  </span>

                  <span>
                    <strong>
                      {branch.batches.reduce(
                        (sum, batch) => sum + batch._count.teachers,
                        0
                      )}
                    </strong>{" "}
                    Teachers
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-lg p-2 transition hover:bg-muted">
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Rename Branch
                </DropdownMenuItem>

                <DropdownMenuItem variant="destructive">
                  Delete Branch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expand Button */}
          <div className="border-t">
            <AccordionTrigger className="px-5 py-3 text-emerald-700 hover:bg-muted/50 hover:no-underline">
              <span className="font-medium">
                View Batches
              </span>
            </AccordionTrigger>
          </div>

          {/* Content */}
          <AccordionContent className="border-t bg-muted/20">
            <div className="space-y-3 p-5">
              {branch.batches.length > 0 ? (
                branch.batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{batch.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  No batches created.
                </div>
              )}

              <div className="mt-4 rounded-lg border border-dashed bg-white p-4">
                <CreateBatch branchId={branch.id} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
};

export default Page;