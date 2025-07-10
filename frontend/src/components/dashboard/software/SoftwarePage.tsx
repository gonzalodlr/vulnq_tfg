/** @format */

"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Search, AppWindow } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { ISoftware } from "@/types/ISoftware";
import { toast } from "sonner";
import { IconDotsVertical } from "@tabler/icons-react";
import { IAsset } from "@/types/IAsset";
import { fetchAssets } from "@/controllers/assetsController";
import { OsSelect, getOsIcon } from "@/components/OsSelect";
import { getAssetIcon } from "../../AssetTypeSelect";
import {
  createSoftware,
  fetchSoftwares,
} from "@/controllers/softwaresController";
import useSWR from "swr";
import { fetcher } from "@/app/dashboard/database/page";

export default function SoftwaresPage() {
  const { t } = useTranslation();

  const [software, setSoftware] = useState<ISoftware[]>([]);
  const [open, setOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<ISoftware[]>([]);
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [selectedOs, setSelectedOs] = useState<string>("");
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [name, setName] = useState("");
  // 150 ms debounce so we don’t hammer the back-end
  const debounced = useDebounce(name, 150);

  useEffect(() => {
    const fetchAssetsData = async () => {
      const assetsData = await fetchAssets();
      setAssets(assetsData);
    };
    fetchAssetsData();

    const fetchSoftwareData = async () => {
      const softwaresData = await fetchSoftwares();
      setSoftware(softwaresData);
      setFilteredItems(softwaresData);
    };
    fetchSoftwareData();

    if (Object.keys(software).length > 0) {
      setFilteredItems(software);
    }
  }, []);

  const { data } = useSWR<string[]>(
    debounced
      ? `/api/db/product?prefix=${encodeURIComponent(debounced)}`
      : null,
    fetcher,
    { keepPreviousData: true } // show old list while revalidating
  );

  useEffect(() => {
    if (data) {
      setSuggestions(data);
    }
  }, [data]);

  const [suggestions, setSuggestions] = useState<string[]>(data ?? []);

  const handleCreateSoftware = async (formData: FormData) => {
    // Generate a cryptographically random id for the new software
    const newSoftware: ISoftware = {
      id_software: crypto.randomUUID(),
      id_asset: formData.get("id_asset") as string,
      software_name: formData.get("name") as string,
      version: formData.get("version") as string,
      vendor: (formData.get("vendor") as string) || "",
      os: formData.get("os") as string,
    };

    setSoftware([...software, newSoftware]);
    setFilteredItems([...filteredItems, newSoftware]);

    setOpen(false);
    setName(""); // Reset the name input

    // Call the API to create the software
    await createSoftware(newSoftware);
    toast(
      <div>
        <strong>Software created</strong>
        <p>{`${newSoftware.software_name} has been added successfully.`}</p>
      </div>
    );
  };

  const getSoftwareIcon = (software: string) => {
    return <AppWindow />;
  };

  const filterItems = (searchItem: string) => {
    const filteredItems = software.filter((software) =>
      software.software_name.toLowerCase().includes(searchItem.toLowerCase())
    );
    setFilteredItems(filteredItems);
  };

  function confirmDelete(id_software: string): void {
    // Toast alert for confirmation
    toast(
      <div className="flex flex-col">
        <strong className="text-warning mb-2">⚠️ Confirm Deletion</strong>
        <p className="mb-4">
          Are you sure you want to delete this software? This action cannot be
          undone.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            handleDelete(id_software);
            toast.dismiss();
          }}
          className="w-full"
        >
          Confirm
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.dismiss()}
          className="mt-2 w-full"
        >
          Undo
        </Button>
      </div>,
      {
        duration: 10000,
        description: "This action cannot be undone.",
        style: {
          backgroundColor: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
        },
        dismissible: true,
        position: "top-center",
        className: "bg-yellow-50 border border-yellow-400",
      }
    );
  }

  function handleDelete(id_software: string): void {
    // Remove the software with the given id from the state
    const updatedSoftware = software.filter(
      (item) => item.id_software !== id_software
    );
    setSoftware(updatedSoftware);
    setFilteredItems(updatedSoftware);

    // Show success toast
    toast(
      <div>
        <strong>Software deleted</strong>
        <p>The software has been removed successfully.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Softwares</h1>
            <Badge className="ml-2">{software.length}</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search softwares..."
                className="pl-8 w-full"
                onChange={(e) => filterItems(e.target.value)}
              />
            </div>

            <Dialog open={open} onOpenChange={setOpen} modal={true}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Software
                </Button>
              </DialogTrigger>
              {open && (
                <DialogContent className="w-[90vw] max-w-[600px] p-4 sm:p-6 md:w-full max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Software</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new software. Required
                      fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleCreateSoftware(formData);
                    }}
                    className="space-y-4 py-4"
                  >
                    <div className="space-y-2 relative">
                      <Label htmlFor="name">Software Name *</Label>

                      <Input
                        id="name"
                        name="name"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setSuggestionSelected(false); // Permite búsqueda nuevamente
                        }}
                        onFocus={() => setSuggestionSelected(false)} // Permite mostrar sugerencias
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSuggestions([]); // Oculta sugerencias
                            setSuggestionSelected(true); // Marca como seleccionado
                          }
                        }}
                        onBlur={() => {
                          // Esperamos unos milisegundos para permitir hacer clic en sugerencias
                          setTimeout(() => {
                            setSuggestions([]);
                            setSuggestionSelected(true);
                          }, 100);
                        }}
                        required
                      />

                      {debounced &&
                        suggestions.length > 0 &&
                        !suggestionSelected && (
                          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                            {suggestions.map((suggestion, idx) => {
                              const suggestionValue =
                                typeof suggestion === "string"
                                  ? suggestion
                                  : (suggestion as any).product_name || "";
                              return (
                                <div
                                  key={
                                    typeof suggestion === "string"
                                      ? suggestion
                                      : `suggestion-${idx}`
                                  }
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={() => {
                                    // usar onMouseDown en vez de onClick evita que el blur ocurra antes
                                    setName(suggestionValue);
                                    setSuggestions([]);
                                    setSuggestionSelected(true);
                                  }}
                                >
                                  {suggestionValue}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Version *</Label>
                      <Input id="version" name="version" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input id="vendor" name="vendor" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="os">Operating System *</Label>
                        <OsSelect
                          value={selectedOs}
                          onChange={(val: string) => setSelectedOs(val)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="id_asset">Asset *</Label>
                        <Select name="id_asset" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Asset" />
                          </SelectTrigger>
                          <SelectContent>
                            {assets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {getAssetIcon(asset.type)} {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="mb-2 sm:mb-0">
                        Create Software
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium"></th>
                  <th className="p-3 text-left font-medium">Technology</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Version</th>
                  <th className="p-3 text-left font-medium">Manufacturer</th>
                  <th className="p-3 text-left font-medium">OS Name</th>
                  <th className="p-3 text-left font-medium">Asset</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((software: ISoftware) => (
                  <tr
                    key={software.id_software}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-3">
                      <Checkbox />
                    </td>
                    <td className="p-3 ">
                      {getSoftwareIcon(software.software_name)}
                    </td>
                    <td className="p-3 font-medium">
                      {software.software_name || "Empty"}
                    </td>
                    <td className="p-3">{software.version || "Empty"}</td>
                    <td className="p-3">{software.vendor || "Empty"}</td>
                    <td className="p-3 ">{getOsIcon(software.os || "")}</td>
                    <td className="p-3">
                      {assets.find((asset) => asset.id === software.id_asset)
                        ? assets.find((asset) => asset.id === software.id_asset)
                            ?.name || "Empty"
                        : "No Asset"}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem>
                            {/* <TableCellViewer item={row.original} /> */}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => confirmDelete(software.id_software)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {software.length} of {software.length} softwares
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-100">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
