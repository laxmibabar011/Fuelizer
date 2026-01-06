import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import TextArea from "../../../components/form/input/TextArea";
import Select from "../../../components/form/Select";
import ProductMasterService from "../../../services/productMasterService";
import { Check } from "lucide-react";

type Category = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};

type UoM = {
  id: number;
  name: string;
  code: string;
};

interface AddProductProps {
  categories: Category[];
  uoms: UoM[];
  onProductAdded: () => void;
  prefillName?: string;
}

const AddProduct: React.FC<AddProductProps> = ({ categories, uoms, onProductAdded, prefillName }) => {
  const [categoryId, setCategoryId] = useState<string>("");
  const [uomId, setUomId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [itemCode, setItemCode] = useState<string>("");
  const [productCode, setProductCode] = useState<string>("");
  const [hsnCode, setHsnCode] = useState<string>("");
  const [salesPrice, setSalesPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("0");
  const [openingStock, setOpeningStock] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("0");
  const [gstRate, setGstRate] = useState<string>("0");
  const [cgstRate, setCgstRate] = useState<string>("0");
  const [sgstRate, setSgstRate] = useState<string>("0");
  const [igstRate, setIgstRate] = useState<string>("0");
  const [cessRate, setCessRate] = useState<string>("0");
  const [tcsRate, setTcsRate] = useState<string>("0");
  const [taxability, setTaxability] = useState<string>("taxable");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // If a prefillName is provided via URL/query, set it into the name field (one-time when empty)
  useEffect(() => {
    if (prefillName && !name) {
      setName(prefillName);
    }
  }, [prefillName]);

  const canSubmit =
    name.trim().length > 0 &&
    itemCode.trim().length > 0 &&
    !!categoryId &&
    !!uomId &&
    hsnCode.trim().length > 0 &&
    salesPrice.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      window.alert("Please fill in required fields");
      return;
    }
    const form = new FormData();
    form.append("name", name);
    form.append("item_code", itemCode);
    if (productCode) form.append("product_code", productCode);
    form.append("hsn_code", hsnCode);
    if (description) form.append("description", description);
    form.append("category_id", categoryId);
    form.append("uom_id", uomId);
    form.append("sales_price", String(Number(salesPrice)));
    form.append("cost_price", String(Number(costPrice || "0")));
    form.append("opening_stock", String(Number(openingStock || "0")));
    form.append("reorder_level", String(Number(reorderLevel || "0")));
    form.append("gst_rate", String(Number(gstRate || "0")));
    form.append("cgst_rate", String(Number(cgstRate || "0")));
    form.append("sgst_rate", String(Number(sgstRate || "0")));
    form.append("igst_rate", String(Number(igstRate || "0")));
    form.append("cess_rate", String(Number(cessRate || "0")));
    form.append("tcs_rate", String(Number(tcsRate || "0")));
    form.append("taxability", taxability);
    form.append("status", "active");
    if (imageFile) form.append("image", imageFile);

    ProductMasterService.createProductMultipart(form)
      .then(() => {
        onProductAdded();
        clearForm();
        window.alert("Product added successfully");
      })
      .catch(() => window.alert("Failed to add product"));
  };

  const clearForm = () => {
    setCategoryId("");
    setUomId("");
    setName("");
    setItemCode("");
    setProductCode("");
    setHsnCode("");
    setSalesPrice("");
    setCostPrice("0");
    setOpeningStock("0");
    setReorderLevel("0");
    setGstRate("0");
    setCgstRate("0");
    setSgstRate("0");
    setIgstRate("0");
    setCessRate("0");
    setTcsRate("0");
    setTaxability("taxable");
    setDescription("");
    setImage("");
    setImageFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>
            Enter product details to add to your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    defaultValue={categoryId}
                    onChange={(value) => setCategoryId(value)}
                    options={categories.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Item Code <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    value={itemCode} 
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="e.g., D, H2, P, AP31"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Unit of Measurement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    defaultValue={uomId}
                    onChange={(value) => setUomId(value)}
                    options={uoms.map((u) => ({
                      value: String(u.id),
                      label: `${u.name} (${u.code})`,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product Code (Optional)</Label>
                  <Input
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="Legacy product code"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    HSN Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g., 27101242"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Sale Rate (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    placeholder="e.g., 90.17"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cost Price (₹)</Label>
                  <Input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g., 88.04"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Opening Stock</Label>
                  <Input
                    type="number"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    placeholder="e.g., 9273.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reorder Level</Label>
                  <Input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <TextArea value={description} onChange={setDescription} rows={3} />
              </div>
            </div>

            {/* Tax Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Taxability <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    defaultValue={taxability}
                    onChange={(value) => setTaxability(value)}
                    options={[
                      { value: "taxable", label: "Taxable" },
                      { value: "exempt", label: "Exempt" },
                      { value: "nil_rated", label: "Nil Rated" },
                      { value: "non_gst", label: "Non-GST" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    placeholder="e.g., 18 for 18%"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CGST Rate (%)</Label>
                  <Input
                    type="number"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    placeholder="Half of total GST for intra-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SGST Rate (%)</Label>
                  <Input
                    type="number"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    placeholder="Half of total GST for intra-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IGST Rate (%)</Label>
                  <Input
                    type="number"
                    value={igstRate}
                    onChange={(e) => setIgstRate(e.target.value)}
                    placeholder="For inter-state transactions"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cess Rate (%)</Label>
                  <Input
                    type="number"
                    value={cessRate}
                    onChange={(e) => setCessRate(e.target.value)}
                    placeholder="Additional cess"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">TCS Rate (%)</Label>
                  <Input
                    type="number"
                    value={tcsRate}
                    onChange={(e) => setTcsRate(e.target.value)}
                    placeholder="Tax Collected at Source"
                  />
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Image</Label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setImage("");
                      setImageFile(null);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => setImage(String(reader.result || ""));
                    reader.readAsDataURL(file);
                    setImageFile(file);
                  }}
                />
                {image && (
                  <img
                    src={image}
                    alt="preview"
                    className="h-28 w-28 object-cover rounded border"
                  />
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-center gap-4 pt-6 border-t mt-6">
              <Button
                variant="outline"
                onClick={clearForm}
              >
                Clear Form
              </Button>
              <Button className="px-8" onClick={handleSubmit} disabled={!canSubmit}>
                <Check className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
