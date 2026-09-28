export type UpdateAdminInput = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
};

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