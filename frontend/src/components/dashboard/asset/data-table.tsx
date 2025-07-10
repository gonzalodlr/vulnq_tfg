/** @format */

"use client";

import { useState } from "react";
import {
  PlusCircle,
  Search,
  Filter,
  Server,
  Shield,
  Printer,
  Car,
  CreditCard,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Asset {
  id: string;
  idClient: string;
  name: string;
  type: string;
  status?: string;
  owner?: string;
  location?: string;
  inventoryId?: string;
  manufacturer?: string;
  source?: string;
  tags?: string[];
  model?: string;
  os?: string;
  observations?: string;
}

interface DataTableProps {
  data: Asset[];
}

export function DataTable({ data: initialData }: DataTableProps) {
  const [data, setData] = useState<Asset[]>(initialData);
  const [open, setOpen] = useState(false);

  const handleCreateAsset = (formData: FormData) => {
    // Create a new asset object from form data
    const newAsset: Asset = {
      id: Date.now().toString(),
      idClient: formData.get("idClient") as string,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      status: (formData.get("status") as string) || "New",
      owner: (formData.get("owner") as string) || "",
      location: (formData.get("location") as string) || "",
      inventoryId: (formData.get("inventoryId") as string) || "",
      manufacturer: (formData.get("manufacturer") as string) || "",
      source: (formData.get("source") as string) || "",
      tags: [],
      model: (formData.get("model") as string) || "",
      os: (formData.get("os") as string) || "",
      observations: (formData.get("observations") as string) || "",
    };

    // Add the new asset to the list
    setData([...data, newAsset]);

    // Close the modal
    setOpen(false);

    // Show success toast
    toast({
      title: "Asset created",
      description: `${newAsset.name} has been added successfully.`,
    });
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Server":
        return <Server className="h-5 w-5 text-blue-500" />;
      case "Network":
        return <Shield className="h-5 w-5 text-green-500" />;
      case "Printer":
        return <Printer className="h-5 w-5 text-purple-500" />;
      case "Auto":
        return <Car className="h-5 w-5 text-red-500" />;
      case "Card":
        return <CreditCard className="h-5 w-5 text-yellow-500" />;
      case "Mobile":
        return <Smartphone className="h-5 w-5 text-teal-500" />;
      default:
        return <Server className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
          >
            New
          </Badge>
        );
      case "Assigned":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50"
          >
            Assigned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Assets</h1>
          <Badge className="ml-2">{data.length}</Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search assets..."
              className="pl-8 w-full"
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Asset</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new asset. Required fields are
                  marked with an asterisk (*).
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateAsset} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idClient">Client ID *</Label>
                    <Input id="idClient" name="idClient" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select name="type" required defaultValue="Server">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Printer">Printer</SelectItem>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="New">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In Repair">In Repair</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input id="owner" name="owner" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventoryId">Inventory ID</Label>
                    <Input id="inventoryId" name="inventoryId" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" name="manufacturer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input id="source" name="source" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="os">Operating System</Label>
                  <Input id="os" name="os" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observations</Label>
                  <Textarea id="observations" name="observations" rows={3} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Asset</Button>
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
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left font-medium">
                  <Checkbox />
                </th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Owner</th>
                <th className="p-3 text-left font-medium">Location</th>
                <th className="p-3 text-left font-medium">Inventory ID</th>
                <th className="p-3 text-left font-medium">Manufacturer</th>
                <th className="p-3 text-left font-medium">Source</th>
                <th className="p-3 text-left font-medium">Tags</th>
                <th className="p-3 text-left font-medium">Model</th>
                <th className="p-3 text-left font-medium">OS Name</th>
              </tr>
              <tr className="border-b">
                <th className="p-2"></th>
                <th className="p-2">
                  <div className="relative">
                    <Filter className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-500" />
                    <Input placeholder="Filters" className="h-9 pl-7 text-xs" />
                  </div>
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
                <th className="p-2">
                  <Input placeholder="Filters" className="h-9 text-xs" />
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((asset) => (
                <tr key={asset.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Checkbox />
                  </td>
                  <td className="p-3">{getAssetIcon(asset.type)}</td>
                  <td className="p-3 font-medium">{asset.name}</td>
                  <td className="p-3">{getStatusBadge(asset.status || "")}</td>
                  <td className="p-3">{asset.owner || "Empty"}</td>
                  <td className="p-3">{asset.location || "Empty"}</td>
                  <td className="p-3">{asset.inventoryId || "Empty"}</td>
                  <td className="p-3">{asset.manufacturer || "Empty"}</td>
                  <td className="p-3">{asset.source || "Empty"}</td>
                  <td className="p-3">
                    {asset.tags && asset.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      "Empty"
                    )}
                  </td>
                  <td className="p-3">{asset.model || "Empty"}</td>
                  <td className="p-3">{asset.os || "Empty"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {data.length} of {data.length} assets
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-gray-100">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
