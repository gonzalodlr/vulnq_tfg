/** @format */

"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Search } from "lucide-react";
import { OsSelect } from "@/components/OsSelect";

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
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { IAsset } from "@/types/IAsset";
import { toast } from "sonner";
import { createAsset, fetchAssets } from "@/controllers/assetsController";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import { AssetTypeSelect, getAssetIcon } from "@/components/AssetTypeSelect";

export default function AssetsPage() {
  const { t } = useTranslation();

  const [assets, setAssets] = useState<IAsset[]>([]);
  const [open, setOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<IAsset[]>([]);
  const [selectedOs, setSelectedOs] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    // check if the users are not empty, if so then the
    // ASk the controller to fetch the users
    const fetchAssetsData = async () => {
      const assetsData = await fetchAssets();
      setAssets(assetsData);
      setFilteredItems(assetsData);
    };
    fetchAssetsData();
    // API call was successful and we can update our
    // filteredUsers state

    if (Object.keys(assets).length > 0) {
      setFilteredItems(assets);
    }
  }, []);

  const handleCreateAsset = async (formData: FormData) => {
    // Create a new asset object from form data
    const newAsset: IAsset = {
      id: crypto.randomUUID(),
      idClient: "",
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      vendor: (formData.get("vendor") as string) || "",
      model: (formData.get("model") as string) || "",
      os: (formData.get("os") as string) || "",
      location: (formData.get("location") as string) || "",
      observations: (formData.get("observations") as string) || "",
    };

    // Add the new asset to the list
    setAssets([...assets, newAsset]);
    setFilteredItems([...filteredItems, newAsset]);

    // Call the API to save the new asset
    await createAsset(newAsset);

    // Close the modal
    setOpen(false);

    // Show success toast
    toast(
      <div>
        <strong>Asset created</strong>
        <p>{`${newAsset.name} has been added successfully.`}</p>
      </div>
    );
  };

  const handleDelete = async (id: string) => {
    // Remove from UI
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setFilteredItems((prev) => prev.filter((a) => a.id !== id));
    // Optionally, call your backend to delete
    // await deleteAsset(id);
    toast("Asset deleted");
  };

  const filterItems = (searchItem: string) => {
    const filteredItems = assets.filter((asset) =>
      asset.name.toLowerCase().includes(searchItem.toLowerCase())
    );
    setFilteredItems(filteredItems);
  };

  return (
    <div className="p-4 rounded-md shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Assets</h1>
            <Badge className="ml-2">{assets.length}</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search assets..."
                className="pl-8 w-full"
                onChange={(e) => filterItems(e.target.value)}
              />
            </div>

            <Dialog open={open} onOpenChange={setOpen} modal={true}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-[600px] p-4 sm:p-6 md:w-full max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Asset</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new asset. Required fields
                    are marked with an asterisk (*).
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreateAsset} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <AssetTypeSelect
                        value={selectedType}
                        onChange={setSelectedType}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input id="vendor" name="vendor" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" name="model" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="os">Operating System</Label>
                      <OsSelect
                        value={selectedOs}
                        onChange={(val: string) => setSelectedOs(val)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observations</Label>
                    <Textarea id="observations" name="observations" rows={3} />
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
                      Create Asset
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium"></th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Vendor</th>
                  <th className="p-3 text-left font-medium">Model</th>
                  <th className="p-3 text-left font-medium">OS Name</th>
                  <th className="p-3 text-left font-medium">Location</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((asset: IAsset) => (
                  <tr key={asset.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Checkbox />
                    </td>
                    <td className="p-3">{getAssetIcon(asset.type)}</td>
                    <td className="p-3 font-medium">{asset.name}</td>
                    <td className="p-3">{asset.vendor || "Empty"}</td>
                    <td className="p-3">{asset.model || "Empty"}</td>
                    <td className="p-3">{asset.os || "Empty"}</td>
                    <td className="p-3">{asset.location || "Empty"}</td>
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
                            onClick={() => handleDelete(asset.id)}
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
            Showing {assets.length} of {assets.length} assets
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
