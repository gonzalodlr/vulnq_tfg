/** @format */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaLinux, FaApple, FaWindows } from "react-icons/fa";
import { IoLogoAndroid } from "react-icons/io";
import { useTranslation } from "react-i18next";
import React from "react";

export type OsType = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

export const getOsIcon = (os: string) => {
  switch (os.toLowerCase()) {
    case "windows":
      return <FaWindows />;
    case "linux":
      return <FaLinux />;
    case "macos":
      return <FaApple />;
    case "android":
      return <IoLogoAndroid />;
    default:
      return null;
  }
};

export function getDefaultOsTypes(t: (key: string) => string): OsType[] {
  return [
    { value: "Windows", label: t("osTypes.windows"), icon: <FaWindows /> },
    { value: "Linux", label: t("osTypes.linux"), icon: <FaLinux /> },
    { value: "MacOs", label: t("osTypes.macos"), icon: <FaApple /> },
    { value: "Android", label: t("osTypes.android"), icon: <IoLogoAndroid /> },
  ];
}

type OsSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  osTypes?: OsType[];
  required?: boolean;
  placeholder?: string;
  name?: string;
};

export const OsSelect: React.FC<OsSelectProps> = ({
  value,
  onChange,
  osTypes,
  required,
  placeholder = "Select OS",
  name = "os",
}) => {
  const { t } = useTranslation();
  const options = osTypes || getDefaultOsTypes(t);

  return (
    <Select
      name={name}
      required={required}
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((osType) => (
          <SelectItem key={osType.value} value={osType.value}>
            {osType.icon} {osType.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
