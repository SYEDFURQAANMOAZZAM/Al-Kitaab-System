import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";

import {
  FormStateAdmin,
  EditSchemaAdmin,
} from "../../auth/Validate";

import {
  findAdminForUpdate,
  updateAdminRecord,
} from "../queries/updateAdmin.queries";

export async function updateAdminService(
  userId: string,
  _state: FormStateAdmin,
  formData: FormData,
): Promise<FormStateAdmin> {
  /* =======================================================
     VALIDATE USER ID
  ======================================================= */

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return {
      message: "Invalid admin ID.",
    };
  }

  /* =======================================================
     FIND EXISTING ADMIN
  ======================================================= */

  const existingAdmin =
    await findAdminForUpdate(userId);

  /* =======================================================
     VERIFY ADMIN
  ======================================================= */

  if (
    !existingAdmin ||
    existingAdmin.role !== "ADMIN"
  ) {
    return {
      message: "Admin not found.",
    };
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validatedFields =
    EditSchemaAdmin.safeParse({
      name: formData.get("name"),

      email: formData.get("email"),

      phone: formData.get("phone"),

      password:
        formData.get("password"),

      confirmPassword:
        formData.get("confirmPassword"),
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
     BUILD USER UPDATE DATA
  ======================================================= */

  const userData:
    Prisma.UserUpdateInput = {
    name: data.name,
    email: normalizeEmail(data.email),
    phone: data.phone,
  };

  /* =======================================================
     UPDATE PASSWORD ONLY IF PROVIDED
  ======================================================= */

  if (data.password) {
    userData.password =
      await bcrypt.hash(
        data.password,
        10,
      );
  }

  /* =======================================================
     DATABASE UPDATE
  ======================================================= */

  try {
    await updateAdminRecord(
      userId,
      userData,
    );
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      /* ---------------------------------------------------
         EMAIL UNIQUE CONSTRAINT
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         RECORD NOT FOUND
      --------------------------------------------------- */

      if (error.code === "P2025") {
        return {
          message:
            "Admin could not be found.",
        };
      }
    }

    console.error(
      "Unable to update admin:",
      error,
    );

    return {
      message:
        "Unable to update the admin. Please try again.",
    };
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  return {
    success: true,
  };
}