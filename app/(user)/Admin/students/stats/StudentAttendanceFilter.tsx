"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Select } from "@base-ui/react/select";
import {
  CalendarDays,
  Check,
  ChevronDown,
} from "lucide-react";

type AttendancePeriod =
  | "this-month"
  | "2-months"
  | "3-months"
  | "overall";

interface Props {
  period: AttendancePeriod;
}

const PERIOD_LABELS: Record<
  AttendancePeriod,
  string
> = {
  "this-month": "This Month",
  "2-months": "2-Months",
  "3-months": "3-Months",
  overall: "Overall",
};

export default function StudentAttendanceFilter({
  period,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(
    value: AttendancePeriod | null
  ) {
    if (!value || value === period) return;

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("attendance", value);
    params.set("page", "1");

    router.push(
      `${pathname}?${params.toString()}`,
      { scroll: false }
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Label */}

      <div className="hidden items-center gap-2 text-sm font-medium text-muted-foreground sm:flex">
        <CalendarDays className="size-4" />
        <span>Attendance</span>
      </div>

      <Select.Root
        value={period}
        onValueChange={(value) =>
          handleChange(
            value as AttendancePeriod | null
          )
        }
      >
        <Select.Trigger
          aria-label="Attendance period"
          className="
            group
            inline-flex
            h-10
            min-w-[140px]
            items-center
            justify-between
            gap-3
            rounded-lg
            border
            border-border
            bg-background
            px-3
            text-sm
            font-medium
            text-foreground
            shadow-sm
            outline-none

            transition-all
            duration-200

            hover:bg-muted/50
            hover:border-primary/40

            focus-visible:border-primary
            focus-visible:ring-2
            focus-visible:ring-primary/20

            data-[popup-open]:border-primary
            data-[popup-open]:ring-2
            data-[popup-open]:ring-primary/15
          "
        >
          <Select.Value />

          <Select.Icon
            className="
              flex
              size-4
              shrink-0
              items-center
              justify-center
              text-muted-foreground
              transition-transform
              duration-200

              group-data-[popup-open]:rotate-180
            "
          >
            <ChevronDown className="size-4" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            sideOffset={6}
            align="end"
            className="
              z-50
              outline-none
            "
          >
            <Select.Popup
              className="
                min-w-[140px]
                overflow-hidden
                rounded-lg
                border
                border-border
                bg-popover
                p-1
                text-popover-foreground
                shadow-lg
                shadow-black/10
                outline-none

                data-[starting-style]:scale-95
                data-[starting-style]:opacity-0
                data-[ending-style]:scale-95
                data-[ending-style]:opacity-0

                transition-all
                duration-150
              "
            >
              <Select.List>
                <AttendanceItem
                  value="this-month"
                  label="This Month"
                />

                <AttendanceItem
                    value="2-months"
                    label="2-Months"
                  />
               

                <AttendanceItem
                    value="3-months"
                    label="3-Months"
                  />

                <AttendanceItem
                  value="overall"
                  label="Overall"
                />
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function AttendanceItem({
  value,
  label,
}: {
  value: AttendancePeriod;
  label: string;
}) {
  return (
    <Select.Item
      value={value}
      className="
        relative
        flex
        h-9
        cursor-pointer
        items-center
        justify-between
        rounded-md
        px-3
        text-sm
        font-medium
        text-foreground
        outline-none

        transition-colors
        duration-100

        data-[highlighted]:bg-accent
        data-[highlighted]:text-accent-foreground

        data-[selected]:bg-primary/10
        data-[selected]:text-primary

        data-[highlighted]:data-[selected]:bg-primary
        data-[highlighted]:data-[selected]:text-primary-foreground

        data-[disabled]:pointer-events-none
        data-[disabled]:opacity-50
      "
    >
      <Select.ItemText>
        {label}
      </Select.ItemText>

      <Select.ItemIndicator
        className="
          ml-4
          flex
          size-4
          items-center
          justify-center
          text-current
        "
      >
        <Check className="size-3.5" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}