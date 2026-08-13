'use client'
 
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



import {
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";


export default function StudentActions({ studentId }: { studentId: string }) {
  const router=useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg p-2 hover:bg-muted">
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          <button type="button" onClick={() => router.replace(`/Admin/students/stats/${studentId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Student
          </button>
              
          
          
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}