// app/api/test/update-student/route.ts

import { updateStudent } from "@/app/ServerActions/updation/updateStudent";

export async function POST(req: Request) {
  const body = await req.json();

  const formData = new FormData();

  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      formData.set(key, JSON.stringify(value));
    } else {
      formData.set(key, String(value));
    }
  }

  const result = await updateStudent(
    body.userId,
    {},
    formData
  );
  console.log("Result from updateStudent:", result);

  return Response.json(result);
}