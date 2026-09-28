import { CreateSchemaAdmin } from "../../auth/Validate";
import { z } from "zod";

export type RegisterAdminInput = z.infer<
  typeof CreateSchemaAdmin
>;

export type FormStateAdmin = {
  success?: boolean;

  errors?: {
    name?: string[];
    email?: string;
    phone?: string;
    password?: string[];
    confirmPassword?: string[];
    userId?: string[];
  };

  message?: string;
};