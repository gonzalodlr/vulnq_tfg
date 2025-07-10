/** @format */

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
const icon = "/icon.svg";

import { useTranslation } from "react-i18next";
import { handleLogin } from "@/controllers/authController";
import Link from "next/link";

interface LoginProps {
  heading?: string;
  subheading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
  };
  loginText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
}

const Login = ({
  heading = "Login",
  subheading = "Welcome back",
  logo = {
    url: "/",
    src: icon,
    alt: "VulnQ",
  },
  loginText = "Log in",
  googleText = "Log in with Google",
  signupText = "Don't have an account?",
  signupUrl = "/signup",
}: LoginProps) => {
  const { t } = useTranslation();

  // Traducciones dinámicas
  heading = t("login_heading");
  subheading = t("login_subheading");
  loginText = t("login_button");
  googleText = t("login_google_button");
  signupText = t("login_signup_text");

  // Estados para los campos y errores
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [rememberMe, setRememberMe] = useState(false);

  // Validación de correo electrónico
  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t("error_email_required");
    } else if (!isValidEmail(email)) {
      newErrors.email = t("error_email_invalid");
    }

    if (!password) {
      newErrors.password = t("error_password_required");
    } else if (password.length < 6) {
      newErrors.password = t("error_password_short");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Aquí puedes manejar el inicio de sesión (llamar a un controlador o API)
      try {
        const result = await handleLogin(email, password);
        if (rememberMe) {
          console.log("result", result);
          localStorage.setItem("refreshToken", result.refreshToken);
          // document.cookie = `token=${sessionStorage.getItem(
          //   "token"
          // )}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`; // 7 days
        }

        window.location.href = "/dashboard";
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
              <h1 className="mb-2 text-2xl font-bold">{heading}</h1>
              <p className="text-muted-foreground">{subheading}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                {/* Campo de correo electrónico */}
                <div>
                  <Input
                    type="email"
                    placeholder={t("login_email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Campo de contraseña */}
                <div>
                  <Input
                    type="password"
                    placeholder={t("login_password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Recordar contraseña y enlace de recuperación */}
                <div className="flex justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      className="border-muted-foreground"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("login_remember_me")}
                    </label>
                  </div>
                  <Link
                    href="/forgotPassword"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("login_forgot_password")}
                  </Link>
                </div>

                {/* Botón de inicio de sesión */}
                <Button type="submit" className="mt-2 w-full">
                  {loginText}
                </Button>

                {/* Botón de inicio de sesión con Google */}
                <Button variant="outline" className="w-full">
                  <FcGoogle className="mr-2 size-5" />
                  {googleText}
                </Button>
              </div>
            </form>

            {/* Enlace para registrarse */}
            <div className="mx-auto mt-8 flex justify-center gap-1 text-sm text-muted-foreground">
              <p>{signupText}</p>
              <Link href={signupUrl} className="font-medium text-primary">
                {t("auth.signup")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Login };
