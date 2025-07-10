/** @format */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Laptop,
  Tablet,
  Tv,
  Smartphone,
  Printer,
  Car,
  CreditCard,
  Shield,
  Server,
  Camera,
  Router,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import React from "react";

export type AssetTypeOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

export function getDefaultAssetTypes(
  t: (key: string) => string
): AssetTypeOption[] {
  return [
    { value: "computer", label: t("assetTypes.computer"), icon: <Laptop /> },
    { value: "tablet", label: t("assetTypes.tablet"), icon: <Tablet /> },
    { value: "phone", label: t("assetTypes.phone"), icon: <Smartphone /> },
    { value: "printer", label: t("assetTypes.printer"), icon: <Printer /> },
    { value: "tv", label: t("assetTypes.tv"), icon: <Tv /> },
    { value: "car", label: t("assetTypes.car"), icon: <Car /> },
    {
      value: "creditCard",
      label: t("assetTypes.creditCard"),
      icon: <CreditCard />,
    },
    { value: "firewall", label: t("assetTypes.firewall"), icon: <Shield /> },
    { value: "server", label: t("assetTypes.server"), icon: <Server /> },
    { value: "ipCamera", label: t("assetTypes.ipCamera"), icon: <Camera /> },
    { value: "router", label: t("assetTypes.router"), icon: <Router /> },
  ];
}

type AssetTypeSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  assetTypes?: AssetTypeOption[];
  required?: boolean;
  placeholder?: string;
  name?: string;
};

export const getAssetIcon = (
    type: string,
    assetTypes: AssetTypeOption[] = getDefaultAssetTypes((key) => key)
) => {
    const assetType = assetTypes.find(
      (asset) => asset.value.toLowerCase() === type.toLowerCase()
    );
    return assetType ? assetType.icon : <Server />;
};

export const AssetTypeSelect: React.FC<AssetTypeSelectProps> = ({
  value,
  onChange,
  assetTypes,
  required,
  placeholder = "Select type",
  name = "type",
}) => {
  const { t } = useTranslation();
  const options = assetTypes || getDefaultAssetTypes(t);

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
        {options.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.icon} {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
