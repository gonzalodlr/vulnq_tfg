/** @format */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { handleSignup } from "@/controllers/authController";
const icon = "/icon.svg";
import { useTranslation } from "react-i18next";

export default function SignUpComponent() {
  const { t } = useTranslation();

  /* ---------- state ---------- */
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    lastName: "",
    phoneNumber: "",
  });
  const [isPasswordVisible, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [busy, setBusy] = useState(false);

  /* ---------- helpers ---------- */
  const update = (k: keyof typeof form) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  const validators = {
    email: (v: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t("error_email_invalid"),
    password: (v: string) => v.length >= 6 || t("error_password_short"),
    name: (v: string) => v.trim() !== "" || t("error_name_required"),
    lastName: (v: string) => v.trim() !== "" || t("error_lastname_required"),
    phoneNumber: (v: string) =>
      /^[0-9]{7,15}$/.test(v) || t("error_phone_invalid"),
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors: Partial<typeof form> = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      const v = validators[k](form[k]);
      if (v !== true) fieldErrors[k] = v as string;
    });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setBusy(true);
    try {
      await handleSignup(form);
      window.location.href = "/login";
    } catch (err: any) {
      console.log("Error during signup:", err);
      setErrors({ email: err.message ?? t("error_generic") });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <section className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-lg bg-background shadow-lg dark:bg-gray-800">
        {/* form only */}
        <div className="flex w-full flex-col gap-6 p-8">
          <header className="flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src={icon} alt="logo" width={32} height={32} />
              <span className="sr-only">VulnQ</span>
            </Link>
            <h1 className="text-2xl font-semibold">
              {t("signup_heading") /* e.g. “Create your account” */}
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-[90%]">
              {t("signup_subheading")}
            </p>
          </header>

          <form onSubmit={submit} className="flex flex-col gap-5">
            {/* name row */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">{t("signup_name_placeholder")}</Label>
                <div className="mt-2">
                  <Input
                    id="name"
                    placeholder={t("signup_name_placeholder")}
                    value={form.name}
                    onChange={update("name")}
                    autoComplete="given-name"
                    autoFocus
                  />
                </div>
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="lastname">
                  {t("signup_lastname_placeholder")}
                </Label>
                <div className="mt-2">
                  <Input
                    id="lastname"
                    placeholder={t("signup_lastname_placeholder")}
                    value={form.lastName}
                    onChange={update("lastName")}
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && (
                  <p className="form-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* phone */}
            <div>
              <Label htmlFor="phone">{t("signup_phone_placeholder")}</Label>
              <div className="mt-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("signup_phone_placeholder")}
                  value={form.phoneNumber}
                  onChange={update("phoneNumber")}
                  autoComplete="tel"
                />
              </div>
              {errors.phoneNumber && (
                <p className="form-error">{errors.phoneNumber}</p>
              )}
            </div>

            {/* email */}
            <div>
              <Label htmlFor="email">{t("signup_email_placeholder")}</Label>
              <div className="mt-2">
                <Input
                  id="email"
                  type="email"
                  placeholder={t("signup_email_placeholder")}
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* password */}
            <div>
              <Label htmlFor="pw">{t("signup_password_placeholder")}</Label>
              <div className="relative mt-2">
                <Input
                  id="pw"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={t("signup_password_placeholder")}
                  value={form.password}
                  onChange={update("password")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center text-sm opacity-70 hover:opacity-100"
                  onClick={() => setShowPw(!isPasswordVisible)}
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* primary action */}
            <Button type="submit" disabled={busy}>
              {busy ? t("loading") : t("signup_button")}
            </Button>

            {/* divider */}
            <div className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("or")}
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* OAuth */}
            <Button variant="outline" type="button">
              <FcGoogle className="mr-2 size-5" />
              {t("signup_googleText")}
            </Button>
          </form>

          {/* switch to login */}
          <p className="text-center text-sm text-muted-foreground">
            {t("signup_login_text")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t("login")}
            </Link>
          </p>
        </div>
      </section>

      {/* tiny CSS helper for errors */}
      <style jsx global>{`
        .form-error {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: theme("colors.red.500");
        }
      `}</style>
    </main>
  );
}
