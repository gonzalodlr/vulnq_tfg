/** @format */

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const icon = "/icon.svg";

import { useTranslation } from "react-i18next";
import { handleForgotPassword } from "@/controllers/authController";
import Link from "next/link";

interface ForgotPasswordProps {
  heading?: string;
  subheading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
  };
  sendEmailText?: string;
  backToLoginText?: string;
  backToLoginUrl?: string;
}

const ForgotPassword = ({
  heading = "Forgot Password",
  subheading = "Enter your email to receive a temporary password",
  logo = {
    url: "/",
    src: icon,
    alt: "VulnQ",
  },
  sendEmailText = "Send Email",
  backToLoginText = "Back to Login",
  backToLoginUrl = "/login",
}: ForgotPasswordProps) => {
  const { t } = useTranslation();

  // Traducciones dinámicas
  heading = t("forgot_password_heading");
  subheading = t("forgot_password_subheading");
  sendEmailText = t("forgot_password_send_email_button");
  backToLoginText = t("forgot_password_back_to_login");

  // Estados para el correo electrónico y errores
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Validación de correo electrónico
  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = t("error_email_required");
    } else if (!isValidEmail(email)) {
      newErrors.email = t("error_email_invalid");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        //await handleForgotPassword(email); // Llama al controlador
        setSuccessMessage(t("forgot_password_success_message"));
        setEmail(""); // Limpia el campo de correo
        setErrors({}); // Limpia los errores
        window.location.href = "/login"; // Redirige al inicio de sesión
      } catch (err: any) {
        setErrors({ email: err.message || t("error_generic") });
      }
    }
  };

  return (
    <section className="py-32">
      <div className="container">
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-full max-w-sm rounded-md p-6 shadow">
            <div className="mb-6 flex flex-col items-center">
              <Link href={logo.url} className="mb-6 flex items-center gap-2">
                <Image
                  src={logo.src}
                  width={32}
                  height={32}
                  className="max-h-8"
                  alt={logo.alt}
                />
              </Link>
              {/* Encabezado y subtítulo */}
              <h1 className="mb-2 text-2xl font-bold">{heading}</h1>
              <p className="text-muted-foreground">{subheading}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                {/* Campo de correo electrónico */}
                <div>
                  <Input
                    type="email"
                    placeholder={t("forgot_password_email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Botón para enviar el correo */}
                <Button type="submit" className="mt-2 w-full">
                  {sendEmailText}
                </Button>

                {/* Mensaje de éxito */}
                {successMessage && (
                  <p className="mt-4 text-sm text-green-500">
                    {successMessage}
                  </p>
                )}
              </div>
            </form>

            {/* Enlace para volver al inicio de sesión */}
            <div className="mx-auto mt-8 flex justify-center gap-1 text-sm text-muted-foreground">
              <Link href={backToLoginUrl} className="font-medium text-primary">
                {backToLoginText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { ForgotPassword };
