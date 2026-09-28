import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";

import {
  FormStateAdmin,
  CreateSchemaAdmin,
} from "../../auth/Validate";

import {
  createAdminRecord,
} from "../queries/createAdmin.queries";

export async function createAdminService(
  _state: FormStateAdmin,
  formData: FormData,
): Promise<FormStateAdmin> {
  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    CreateSchemaAdmin.safeParse({
      name: formData.get("name"),

      email: formData.get("email"),

      phone: formData.get("phone"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get(
          "confirmPassword",
        ),
    });

  if (!validatedFields.success) {
    const fieldErrors =
      validatedFields.error.flatten()
        .fieldErrors;

    return {
      errors: {
        name:
          fieldErrors.name,

        email:
          fieldErrors.email?.[0],

        phone:
          fieldErrors.phone?.[0],

        password:
          fieldErrors.password,

        confirmPassword:
          fieldErrors.confirmPassword,
      },
    };
  }

  const data =
    validatedFields.data;

  /* =======================================================
     HASH PASSWORD
  ======================================================= */

  const passwordHash =
    await bcrypt.hash(
      data.password,
      10,
    );

  /* =======================================================
     DATABASE
  ======================================================= */

  try {
    await createAdminRecord({
      name: data.name,

      email: normalizeEmail(
        data.email,
      ),

      phone: data.phone,

      passwordHash,
    });
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        const target =
          Array.isArray(
            error.meta?.target,
          )
            ? error.meta.target.join(", ")
            : String(
                error.meta?.target ?? "",
              );

        if (
          target.includes("email")
        ) {
          return {
            errors: {
              email:
                "This email address is already in use.",
            },
          };
        }

        return {
          message:
            "A record with the same information already exists.",
        };
      }
    }

    console.error(
      "Unable to create admin:",
      error,
    );

    return {
      message:
        "Unable to create the admin. Please try again.",
    };
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}