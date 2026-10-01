
import AdminActions from "./AdminActions";
import { getAdmins } from "@/app/ServerActions/admin/queries/getAdmins.queries";

type Admins = Awaited<ReturnType<typeof getAdmins>>;

interface Props {
  admins: Admins;
}

export default function AdminTable({ admins }: Props) {
  return (
    <div>
      {/* Desktop Header: md-xl */}
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem] items-center gap-4 border-b bg-muted/50 px-5 py-4 font-semibold text-foreground md:grid">
        <div>Name</div>
        <div>Phone Number</div>
        <div className="text-center">Actions</div>
      </div>

      {/* Admin Rows */}
      {admins.length === 0 ? (
        <div className="px-5 py-12 text-center text-muted-foreground">
          No admins found.
        </div>
      ) : (
        admins.map((admin) => (
          <div
            key={admin.id}
            className="grid grid-cols-1 gap-2 border-b px-5 py-4 last:border-0 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem] md:items-center md:gap-4"
          >
            {/* Name */}
            <div className="min-w-0 font-semibold text-foreground">
              {admin.name}
            </div>

            {/* Phone */}
            <div className="min-w-0">
              {admin.phone ? (
                <a
                  href={`tel:${admin.phone}`}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {admin.phone}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center md:justify-center">
              <AdminActions userId={admin.id} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
