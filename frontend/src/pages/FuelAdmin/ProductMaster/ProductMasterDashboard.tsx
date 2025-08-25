import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { Badge } from "../../../components/ui/badge";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import TextArea from "../../../components/form/input/TextArea";
import Select from "../../../components/form/Select";
import { Modal } from "../../../components/ui/modal";
import Switch from "../../../components/form/switch/Switch";
import ProductMasterService from "../../../services/productMasterService";
import {
  Edit,
  Trash2,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Check,
  List,
  Layers,
  PlusCircle,
} from "lucide-react";

type ProductStatus = "active" | "inactive";

type Product = {
  id: string;
  categoryId?: string; // Optional for Fuel products
  categoryType: "Fuel" | "Other Product";
  name: string;
  description: string;
  supplier: string;
  image: string;
  mrp?: number; // Only for Other Product
  salePrice?: number; // Only for Other Product
  stock?: number; // Only for Other Product
  reorderLevel?: number; // Only for Other Product
  uom: string;
  pricePerUom?: number;
  hsn: string;
  sac: string;
  cgst: number;
  sgst: number;
  igst: number;
  vat: number;
  discount?: number; // Only for Other Product
  status: ProductStatus;
};

type Category = {
  id: string;
  name: string;
  description?: string;
  categoryType: "Fuel" | "Other Product";
  color?: string; // tailwind background classes for category badge
};

// Data is now loaded from backend; keep only UI types below

// Data is now loaded from backend; keep only UI types below

const emptyProduct: Product = {
  id: "",
  categoryType: "Other Product",
  name: "",
  description: "",
  supplier: "",
  uom: "",
  hsn: "",
  sac: "",
  cgst: 0,
  sgst: 0,
  igst: 0,
  vat: 0,
  image: "",
  status: "active",
};

const emptyCategory: Category = {
  id: "",
  name: "",
  description: "",
  categoryType: "Other Product",
};

const ProductMasterDashboard: React.FC = () => {
  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || "";
  const resolveImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setNewProduct] = useState<Product>({ ...emptyProduct });
  const [newCategory, setNewCategory] = useState<Category>({
    ...emptyCategory,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [, setImagePreview] = useState<string>("");
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState<boolean>(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [showArchivedCategories, setShowArchivedCategories] =
    useState<boolean>(false);
  const [showArchivedFuelProducts, setShowArchivedFuelProducts] =
    useState<boolean>(false);
  const [showArchivedOtherProducts, setShowArchivedOtherProducts] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("fuel");
  
  // Ref for the edit form to call updateParentProduct
  const editFormRef = useRef<{ updateParentProduct: () => void }>(null);

  const totalProducts = products.length;
  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active").length,
    [products]
  );
  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => (p.stock || 0) <= (p.reorderLevel || 0)).length,
    [products]
  );

  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      if (isEdit) {
        setEditImagePreview(result);
        setEditingProduct((prev) => (prev ? { ...prev, image: result } : prev));
        setEditImageFile(file);
      } else {
        setImagePreview(result);
        setNewProduct((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleEditProduct(product: Product) {
    setEditingProduct({ ...product });
    setEditImagePreview(product.image);
    setIsEditProductOpen(true);
  }

  function handleUpdateProduct() {
    if (!editingProduct) return;
    
    // Update the parent product state with current form data
    if (editFormRef.current) {
      editFormRef.current.updateParentProduct();
    }
    
    if (
      !editingProduct.name ||
      !editingProduct.categoryType ||
      (editingProduct.categoryType === "Other Product" &&
        !editingProduct.categoryId)
    ) {
      window.alert("Please fill in all required fields");
      return;
    }

    // If a new image file was chosen, send multipart; else JSON
    if (editImageFile) {
      const form = new FormData();
      form.append("category_type", editingProduct.categoryType);
      if (
        editingProduct.categoryType === "Other Product" &&
        editingProduct.categoryId
      ) {
        form.append("category_id", editingProduct.categoryId);
      }
      form.append("name", editingProduct.name);
      form.append("supplier", editingProduct.supplier || "");
      form.append("uom", editingProduct.uom || "");
      form.append("hsn", editingProduct.hsn || "");
      form.append("description", editingProduct.description || "");
      if (editingProduct.categoryType === "Other Product") {
        form.append("mrp", String(Number(editingProduct.mrp || 0)));
        form.append(
          "sale_price",
          String(Number(editingProduct.salePrice || 0))
        );
        form.append("stock", String(Number(editingProduct.stock || 0)));
        form.append(
          "reorder_level",
          String(Number(editingProduct.reorderLevel || 0))
        );
        form.append("discount", String(Number(editingProduct.discount || 0)));
      }
      form.append("cgst", String(Number(editingProduct.cgst || 0)));
      form.append("sgst", String(Number(editingProduct.sgst || 0)));
      form.append("igst", String(Number(editingProduct.igst || 0)));
      form.append("vat", String(Number(editingProduct.vat || 0)));
      form.append("sac", editingProduct.sac || "");
      form.append("status", editingProduct.status || "active");
      form.append("image", editImageFile);

      ProductMasterService.updateProductMultipart(editingProduct.id, form)
        .then(() => {
          refreshProducts();
          setIsEditProductOpen(false);
          setEditingProduct(null);
          setEditImagePreview("");
          setEditImageFile(null);
          window.alert("Product updated successfully");
        })
        .catch((err) => {
          console.error(err);
          window.alert("Failed to update product");
        });
      return;
    }

    const payload: any = {
      category_type: editingProduct.categoryType,
      category_id:
        editingProduct.categoryType === "Other Product"
          ? editingProduct.categoryId
          : undefined,
      name: editingProduct.name,
      supplier: editingProduct.supplier,
      uom: editingProduct.uom,
      hsn: editingProduct.hsn,
      description: editingProduct.description,
      mrp:
        editingProduct.categoryType === "Other Product"
          ? Number(editingProduct.mrp || 0)
          : undefined,
      sale_price:
        editingProduct.categoryType === "Other Product"
          ? Number(editingProduct.salePrice || 0)
          : undefined,
      stock:
        editingProduct.categoryType === "Other Product"
          ? Number(editingProduct.stock || 0)
          : undefined,
      reorder_level:
        editingProduct.categoryType === "Other Product"
          ? Number(editingProduct.reorderLevel || 0)
          : undefined,
      discount:
        editingProduct.categoryType === "Other Product"
          ? Number(editingProduct.discount || 0)
          : undefined,
      cgst: Number(editingProduct.cgst || 0),
      sgst: Number(editingProduct.sgst || 0),
      igst: Number(editingProduct.igst || 0),
      vat: Number(editingProduct.vat || 0),
      sac: editingProduct.sac,
      status: editingProduct.status,
    };

    ProductMasterService.updateProduct(editingProduct.id, payload)
      .then(() => {
        refreshProducts();
        setIsEditProductOpen(false);
        setEditingProduct(null);
        setEditImagePreview("");
        setEditImageFile(null);
        window.alert("Product updated successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to update product");
      });
  }

  function handleDeleteProduct(product: Product) {
    if (
      !window.confirm(
        `Do you want to delete "${product.name}"?\nThis will archive the product.`
      )
    )
      return;
    ProductMasterService.deleteProduct(product.id)
      .then(() => {
        refreshProducts();
        window.alert("Product deleted successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to delete product");
      });
  }

  function handleEditCategory(category: Category) {
    setEditingCategory({ ...category });
    setIsEditCategoryOpen(true);
  }

  function handleUpdateCategory() {
    if (!editingCategory) return;
    if (
      !editingCategory.categoryType ||
      (editingCategory.categoryType === "Other Product" &&
        !editingCategory.name)
    ) {
      window.alert("Please fill in all required fields");
      return;
    }
    const payload: any = {
      category_type: editingCategory.categoryType,
      name:
        editingCategory.categoryType === "Fuel"
          ? undefined
          : editingCategory.name,
      description: editingCategory.description,
      is_active: true,
    };
    ProductMasterService.updateCategory(editingCategory.id, payload)
      .then(() => {
        refreshCategories();
        setIsEditCategoryOpen(false);
        setEditingCategory(null);
        window.alert("Category updated successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to update category");
      });
  }

  function handleDeleteCategory(categoryId: string) {
    const hasProducts = products.some((p) => p.categoryId === categoryId);
    if (hasProducts) {
      window.alert("Cannot delete category with products.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    ProductMasterService.deleteCategory(categoryId)
      .then(() => {
        refreshCategories();
        window.alert("Category deleted successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to delete category");
      });
  }

  function handleAddCategory() {
    if (
      !newCategory.categoryType ||
      (newCategory.categoryType === "Other Product" && !newCategory.name)
    ) {
      window.alert("Please fill in all required fields");
      return;
    }
    const payload: any = {
      category_type: newCategory.categoryType,
      name: newCategory.categoryType === "Fuel" ? undefined : newCategory.name,
      description: newCategory.description,
      is_active: true,
    };
    ProductMasterService.createCategory(payload)
      .then(() => {
        refreshCategories();
        setNewCategory({ ...emptyCategory });
        setIsAddCategoryOpen(false);
        window.alert("Category added successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to add category");
      });
  }

  // Helpers to load data from API
  function mapApiCategory(c: any): Category {
    return {
      id: String(c.id),
      name: c.category_type === "Fuel" ? "Fuels" : c.name || "",
      description: c.description || "",
      categoryType: c.category_type,
    };
  }

  function mapApiProduct(p: any): Product {
    return {
      id: String(p.id),
      categoryId: p.category_id ? String(p.category_id) : undefined,
      categoryType: p.category_type,
      name: p.name,
      description: p.description || "",
      supplier: p.supplier || "",
      image: resolveImageUrl(p.image_url || ""),
      mrp: p.mrp ?? undefined,
      salePrice: p.sale_price ?? undefined,
      stock: p.stock ?? undefined,
      reorderLevel: p.reorder_level ?? undefined,
      uom: p.uom || "",
      pricePerUom: undefined,
      hsn: p.hsn || "",
      sac: p.sac || "",
      cgst: p.cgst ?? 0,
      sgst: p.sgst ?? 0,
      igst: p.igst ?? 0,
      vat: p.vat ?? 0,
      discount: p.discount ?? undefined,
      status: p.status || "active",
    };
  }

  function refreshCategories() {
    const params: any = {};
    // if archived toggle ON, fetch inactive (is_active=false), else active (true)
    params.is_active = showArchivedCategories ? false : true;
    ProductMasterService.listCategories(params)
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setCategories(list.map(mapApiCategory));
      })
      .catch((err) => console.error(err));
  }

  function refreshProducts() {
    const params: any = {};
    const isArchiveMode = 
      (activeTab === "fuel" && showArchivedFuelProducts) ||
      (activeTab === "other-products" && showArchivedOtherProducts);
    params.status = isArchiveMode ? "inactive" : "active";
    ProductMasterService.listProducts(params)
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setProducts(list.map(mapApiProduct));
      })
      .catch((err) => console.error(err));
  }

  React.useEffect(() => {
    refreshCategories();
  }, [showArchivedCategories]);

  React.useEffect(() => {
    refreshProducts();
  }, [showArchivedFuelProducts, showArchivedOtherProducts, activeTab]);

  React.useEffect(() => {
    // initial load
    refreshCategories();
    refreshProducts();
  }, []);

  function ProductCard({ product }: { product: Product }) {
    const category = categories.find((c) => c.id === product.categoryId);
    const isLowStock = (product.stock || 0) <= (product.reorderLevel || 0);

    return (
      <Card className="relative w-full max-w-sm border shadow-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/70">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {((activeTab === "fuel" && showArchivedFuelProducts) || 
            (activeTab === "other-products" && showArchivedOtherProducts)) && 
            product.status === "inactive" ? (
            <Button
              size="sm"
              variant="outline"
              className="!h-7 !px-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-medium border-green-600"
              onClick={() => {
                ProductMasterService.restoreProduct(product.id)
                  .then(() => {
                    refreshProducts();
                    window.alert("Product restored");
                  })
                  .catch(() => window.alert("Failed to restore product"));
              }}
              aria-label="Restore product"
            >
              <Check className="h-3 w-3 mr-1 text-white" /> Restore
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="!h-7 !w-7 !p-0 !px-0 !py-0 bg-white/90 hover:bg-blue-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handleEditProduct(product)}
                aria-label="Edit product"
              >
                <Edit className="h-3 w-3 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="!h-7 !w-7 !p-0 !px-0 !py-0 bg-white/90 hover:bg-red-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handleDeleteProduct(product)}
                aria-label="Delete product"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </>
          )}
        </div>

        <CardContent className="p-4">
          <div className="relative mb-3 mt-6">
            <div className="w-full h-32 bg-white border-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                ID: {product.id}
              </p>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {product.name}
              </h3>
            </div>

            <div>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {product.categoryType === "Fuel"
                  ? "Fuel"
                  : category?.name || "No Category"}
              </Badge>
            </div>

            {product.categoryType === "Other Product" ? (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Sale Price
                      </p>
                      <p className="font-bold text-green-700 dark:text-green-400">
                        ₹{product.salePrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 line-through">
                        ₹{product.mrp}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        per {product.uom}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Stock:{" "}
                      <span
                        className={`font-semibold ${isLowStock ? "text-red-600" : "text-green-600"}`}
                      >
                        {product.stock}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Reorder:{" "}
                      <span className="font-semibold">
                        {product.reorderLevel}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Fuel Product
                  </p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">
                    per {product.uom}
                  </p>
                </div>
              </div>
            )}

            {isLowStock && product.categoryType === "Other Product" && (
              <div className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 p-1 rounded text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Low Stock Alert</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function CategoryCard({ category }: { category: Category }) {
    const productCount = products.filter(
      (p) => p.categoryId === category.id
    ).length;
    const hasProducts = productCount > 0;

    return (
      <Card className="relative w-full max-w-sm hover:shadow-md transition-shadow duration-200">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="!h-6 !w-6 !p-0 !px-0 !py-0 bg-white/90 hover:bg-blue-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => handleEditCategory(category)}
            aria-label="Edit category"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="!h-6 !w-6 !p-0 !px-0 !py-0 bg-white/90 hover:bg-red-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
            disabled={hasProducts}
            onClick={() => handleDeleteCategory(category.id)}
            aria-label="Delete category"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </Button>
        </div>

        <CardContent className="p-5 pt-8">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {category.name}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {productCount} items
            </Badge>
          </div>

          {category.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const CompactProductForm = React.forwardRef<
    { updateParentProduct: () => void },
    {
      product: Product;
      setProduct: (p: Product) => void;
      image: string;
      onImageUpload: (
        e: React.ChangeEvent<HTMLInputElement>,
        isEdit?: boolean
      ) => void;
      isEdit?: boolean;
    }
  >(({ product, setProduct, image, onImageUpload, isEdit = false }, ref) => {
    // Use individual state variables like AddProductForm for better typing experience
    const [name, setName] = useState<string>(product.name || "");
    const [supplier, setSupplier] = useState<string>(product.supplier || "");
    const [uom, setUom] = useState<string>(product.uom || "");
    const [hsn, setHsn] = useState<string>(product.hsn || "");
    const [description, setDescription] = useState<string>(product.description || "");
    const [categoryId, setCategoryId] = useState<string>(product.categoryId || "");
    const [vat, setVat] = useState<string>(String(product.vat || "0"));
    const [sac, setSac] = useState<string>(product.sac || "");
    const [mrp, setMrp] = useState<string>(String(product.mrp || ""));
    const [salePrice, setSalePrice] = useState<string>(String(product.salePrice || ""));
    const [stock, setStock] = useState<string>(String(product.stock || ""));
    const [reorderLevel, setReorderLevel] = useState<string>(String(product.reorderLevel || ""));
    const [discount, setDiscount] = useState<string>(String(product.discount || ""));
    const [cgst, setCgst] = useState<string>(String(product.cgst || "0"));
    const [igst, setIgst] = useState<string>(String(product.igst || "0"));
    const [sgst, setSgst] = useState<string>(String(product.sgst || "0"));

    // Update parent product state when form is submitted
    const updateParentProduct = () => {
      const updatedProduct = {
        ...product,
        name,
        supplier,
        uom,
        hsn,
        description,
        categoryId,
        vat: Number(vat || 0),
        sac,
        mrp: mrp ? Number(mrp) : undefined,
        salePrice: salePrice ? Number(salePrice) : undefined,
        stock: stock ? Number(stock) : undefined,
        reorderLevel: reorderLevel ? Number(reorderLevel) : undefined,
        discount: discount ? Number(discount) : undefined,
        cgst: Number(cgst || 0),
        igst: Number(igst || 0),
        sgst: Number(sgst || 0),
      };
      setProduct(updatedProduct);
    };

    // Expose updateParentProduct function to parent component
    React.useImperativeHandle(ref, () => ({
      updateParentProduct
    }), [name, supplier, uom, hsn, description, categoryId, vat, sac, mrp, salePrice, stock, reorderLevel, discount, cgst, igst, sgst]);

    // Update local state when product changes (e.g., when editing different products)
    useEffect(() => {
      setName(product.name || "");
      setSupplier(product.supplier || "");
      setUom(product.uom || "");
      setHsn(product.hsn || "");
      setDescription(product.description || "");
      setCategoryId(product.categoryId || "");
      setVat(String(product.vat || "0"));
      setSac(product.sac || "");
      setMrp(String(product.mrp || ""));
      setSalePrice(String(product.salePrice || ""));
      setStock(String(product.stock || ""));
      setReorderLevel(String(product.reorderLevel || ""));
      setDiscount(String(product.discount || ""));
      setCgst(String(product.cgst || "0"));
      setIgst(String(product.igst || "0"));
      setSgst(String(product.sgst || "0"));
    }, [product]);

    return (
      <div className="space-y-6 max-w-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-2">
              <Label htmlFor="categoryType" className="text-sm font-medium">
                Category Type <span className="text-red-500">*</span>
              </Label>
              <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 flex items-center">
                {product.categoryType}
              </div>
            </div>
            {product.categoryType === "Other Product" && (
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  defaultValue={categoryId}
                  onChange={(value) => setCategoryId(value)}
                  options={categories
                    .filter((c) => c.categoryType === "Other Product")
                    .map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-sm font-medium">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
            {product.categoryType === "Other Product" && (
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="uom" className="text-sm font-medium">
                Unit of Measurement <span className="text-red-500">*</span>
              </Label>
                              <Select
                  defaultValue={uom}
                  onChange={(value) => setUom(value)}
                  options={[
                    { value: "Liter", label: "Liter" },
                    { value: "Kg", label: "Kg" },
                    { value: "Piece", label: "Piece" },
                    { value: "Gallon", label: "Gallon" },
                  ]}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsn" className="text-sm font-medium">
                HSN Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hsn"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="h-11"
              />
            </div>
            {product.categoryType === "Fuel" && (
              <div className="space-y-2">
                <Label htmlFor="vat" className="text-sm font-medium">
                  VAT (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vat"
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  className="h-11"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <TextArea
              rows={3}
              value={description}
              onChange={setDescription}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Product Image</Label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageUpload(e, isEdit)}
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

        {product.categoryType === "Other Product" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Pricing & Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp" className="text-sm font-medium">
                  MRP (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mrp"
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-sm font-medium">
                  Sale Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium">
                  Stock Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel" className="text-sm font-medium">
                  Reorder Level <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-medium">
                  Discount (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}

        {product.categoryType === "Other Product" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgst" className="text-sm font-medium">
                  CGST (%)
                </Label>
                <Input
                  id="cgst"
                  type="number"
                  value={cgst}
                  onChange={(e) => setCgst(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgst" className="text-sm font-medium">
                  SGST (%)
                </Label>
                <Input
                  id="sgst"
                  type="number"
                  value={sgst}
                  onChange={(e) => setSgst(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igst" className="text-sm font-medium">
                  IGST (%)
                </Label>
                <Input
                  id="igst"
                  type="number"
                  value={igst}
                  onChange={(e) => setIgst(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat" className="text-sm font-medium">
                  VAT (%)
                </Label>
                <Input
                  id="vat"
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sac" className="text-sm font-medium">
                  SAC Code
                </Label>
                <Input
                  id="sac"
                  value={sac}
                  onChange={(e) => setSac(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  // Robust Add Product form with local string state to avoid typing glitches
  function AddProductForm({
    categories,
    onSubmitted,
  }: {
    categories: Category[];
    onSubmitted: () => void;
  }) {

    const [categoryType, setCategoryType] = useState<"Fuel" | "Other Product">(
      "Other Product"
    );
    const [categoryId, setCategoryId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [supplier, setSupplier] = useState<string>("");
    const [uom, setUom] = useState<string>("");
    const [hsn, setHsn] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [image, setImage] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [sac, setSac] = useState<string>("");
    const [cgst, setCgst] = useState<string>("0");
    const [igst, setIgst] = useState<string>("0");
    const [sgst, setSgst] = useState<string>("0");
    const [vat, setVat] = useState<string>("0");
    const [mrp, setMrp] = useState<string>("");
    const [salePrice, setSalePrice] = useState<string>("");
    const [stock, setStock] = useState<string>("");
    const [reorderLevel, setReorderLevel] = useState<string>("");
    const [discount, setDiscount] = useState<string>("");

    const canSubmit =
      name.trim().length > 0 &&
      !!uom &&
      hsn.trim().length > 0 &&
      (categoryType === "Fuel" ? vat.trim().length > 0 : (!!categoryId && supplier.trim().length > 0));

    const handleSubmit = () => {
      if (!canSubmit) {
        window.alert("Please fill in required fields");
        return;
      }
      const form = new FormData();
      form.append("category_type", categoryType);
      if (categoryType === "Other Product")
        form.append("category_id", categoryId);
      form.append("name", name);
      if (categoryType === "Other Product") {
        form.append("supplier", supplier);
      }
      form.append("uom", uom);
      form.append("hsn", hsn);
      form.append("description", description);
      if (categoryType === "Fuel") {
        form.append("vat", String(Number(vat || "0")));
      } else {
        // Other Product
        if (mrp !== "") form.append("mrp", String(Number(mrp)));
        if (salePrice !== "")
          form.append("sale_price", String(Number(salePrice)));
        if (stock !== "") form.append("stock", String(Number(stock)));
        if (reorderLevel !== "")
          form.append("reorder_level", String(Number(reorderLevel)));
        if (discount !== "") form.append("discount", String(Number(discount)));
        form.append("cgst", String(Number(cgst || "0")));
        form.append("igst", String(Number(igst || "0")));
        form.append("sgst", String(Number(sgst || "0")));
        form.append("vat", String(Number(vat || "0")));
        form.append("sac", sac);
      }
      form.append("status", "active");
      if (imageFile) form.append("image", imageFile);

      ProductMasterService.createProductMultipart(form)
        .then(() => {
          refreshProducts();
          onSubmitted();
          // reset
          setCategoryType("Other Product");
          setCategoryId("");
          setName("");
          setSupplier("");
          setUom("");
          setHsn("");
          setDescription("");
          setImage("");
          setImageFile(null);
          setSac("");
          setCgst("0");
          setIgst("0");
          setSgst("0");
          setVat("0");
          setMrp("");
          setSalePrice("");
          setStock("");
          setReorderLevel("");
          setDiscount("");
          window.alert("Product added successfully");
        })
        .catch((e) => {
          console.error(e);
          window.alert("Failed to add product");
        });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category Type <span className="text-red-500">*</span></Label>
            <Select
              defaultValue={categoryType}
              onChange={(value) => {
                const next = value as "Fuel" | "Other Product";
                setCategoryType(next);
                if (next === "Fuel") setCategoryId("");
              }}
              options={[
                { value: "Fuel", label: "Fuel" },
                { value: "Other Product", label: "Other Product" },
              ]}
            />
          </div>

          {categoryType === "Other Product" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category Name <span className="text-red-500">*</span></Label>
              <Select
                defaultValue={categoryId}
                onChange={(value) => setCategoryId(value)}
                options={categories
                  .filter((c) => c.categoryType === "Other Product")
                  .map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {categoryType === "Other Product" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier <span className="text-red-500">*</span></Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Unit of Measurement <span className="text-red-500">*</span></Label>
            <Select
              defaultValue={uom}
              onChange={(value) => setUom(value)}
              options={[
                { value: "Liter", label: "Liter" },
                { value: "Kg", label: "Kg" },
                { value: "Piece", label: "Piece" },
                { value: "Gallon", label: "Gallon" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">HSN Code <span className="text-red-500">*</span></Label>
            <Input
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
            />
          </div>

          {categoryType === "Fuel" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">VAT (%) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Description</Label>
          <TextArea
            value={description}
            onChange={setDescription}
            rows={3}
          />
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

        {categoryType === "Other Product" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">MRP (₹) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sale Price (₹) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stock Quantity <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reorder Level <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Discount (%)</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>
        )}

        {categoryType === "Other Product" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CGST (%)</Label>
                <Input
                  type="number"
                  value={cgst}
                  onChange={(e) => setCgst(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">IGST (%)</Label>
                <Input
                  type="number"
                  value={igst}
                  onChange={(e) => setIgst(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">SGST (%)</Label>
                <Input
                  type="number"
                  value={sgst}
                  onChange={(e) => setSgst(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">VAT (%)</Label>
                <Input
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">SAC Code</Label>
                <Input
                  value={sac}
                  onChange={(e) => setSac(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setCategoryType("Other Product");
              setCategoryId("");
              setName("");
              setSupplier("");
              setUom("");
              setHsn("");
              setDescription("");
              setImage("");
              setImageFile(null);
              setSac("");
              setCgst("0");
              setSgst("0");
              setIgst("0");
              setVat("0");
              setMrp("");
              setSalePrice("");
              setStock("");
              setReorderLevel("");
              setDiscount("");
            }}
          >
            Clear Form
          </Button>
          <Button className="px-8" onClick={handleSubmit} disabled={!canSubmit}>
            <Check className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Product Master Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your fuel station products and categories
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Product List</span>
          </TabsTrigger>
          <TabsTrigger value="add-product" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Categories
                    </p>
                    <p className="text-2xl font-bold">{categories.length}</p>
          </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold">{totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Active Products
                    </p>
                    <p className="text-2xl font-bold">{activeProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Low Stock
                    </p>
                    <p className="text-2xl font-bold">{lowStockProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs 
            defaultValue="fuel" 
            className="space-y-6"
            onValueChange={(value) => {
              setActiveTab(value);
              // Reset archive states when switching tabs
              setShowArchivedFuelProducts(false);
              setShowArchivedOtherProducts(false);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fuel" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Fuel Products</span>
              </TabsTrigger>
              <TabsTrigger
                value="other-products"
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Other Products</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fuel" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Fuel Products
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {products.filter((p) => p.categoryType === "Fuel").length}{" "}
                    products
                  </Badge>
                  <div className="ml-auto">
                    <Switch
                      label="Show archived"
                      defaultChecked={showArchivedFuelProducts}
                      onChange={(checked) => setShowArchivedFuelProducts(checked)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {products.filter((p) => p.categoryType === "Fuel").length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-10">
                      {showArchivedFuelProducts ? "No archived products" : "No products"}
                    </div>
                  ) : (
                    products
                      .filter((p) => p.categoryType === "Fuel")
                      .map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))
                  )}
                </div>
          </div>
        </TabsContent>

            <TabsContent value="other-products" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Other Products
            </h2>
                  <Badge variant="secondary" className="text-xs">
                    {products.filter((p) => p.categoryType === "Other Product").length} products
                  </Badge>
                  <div className="ml-auto">
                    <Switch
                      label="Show archived"
                      defaultChecked={showArchivedOtherProducts}
                      onChange={(checked) => setShowArchivedOtherProducts(checked)}
                    />
          </div>
                </div>

                {products.filter((p) => p.categoryType === "Other Product").length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    {showArchivedOtherProducts ? "No archived products" : "No products"}
                  </div>
                ) : (
                  categories
                    .filter((c) => c.categoryType === "Other Product")
                    .map((category) => {
                      const categoryProducts = products.filter(
                        (product) =>
                          product.categoryType === "Other Product" &&
                          product.categoryId === category.id
                      )
                      if (categoryProducts.length === 0) return null
                      return (
                        <div key={category.id} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                              {category.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {categoryProducts.length} products
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {categoryProducts.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      )
                    })
                )}
          </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="add-product" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                  Enter product details to add to your inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Use robust AddProductForm to prevent scroll/typing glitches */}
                <AddProductForm
                  categories={categories}
                  onSubmitted={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Categories
            </h2>
              <Badge variant="outline" className="text-sm">
                {categories.filter((c) => c.categoryType === "Other Product").length} categories
              </Badge>
          </div>
            <div className="flex items-center gap-4">
              <Switch
                label="Show archived"
                defaultChecked={false}
                onChange={(checked) => setShowArchivedCategories(checked)}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAddCategoryOpen(true)}
                startIcon={<PlusCircle className="h-4 w-4" />}
              >
                Create
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories
              .filter((category) => category.categoryType === "Other Product")
              .map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditProductOpen}
        onClose={() => setIsEditProductOpen(false)}
        className="max-w-4xl w-full"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 space-y-4 rounded-3xl">
          <div className="pb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Update the product information below.
            </p>
          </div>
          <CompactProductForm
            ref={editFormRef}
            product={editingProduct || emptyProduct}
            setProduct={(p) => setEditingProduct(p)}
            image={editImagePreview}
            onImageUpload={(e) => handleImageUpload(e, true)}
            isEdit
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditProductOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={
                !editingProduct?.name ||
                !editingProduct?.categoryType ||
                (editingProduct?.categoryType === "Other Product" &&
                  !editingProduct?.categoryId)
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Update Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        className="max-w-xl p-6"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add New Category
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new product category
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryType">Category Type <span className="text-red-500">*</span></Label>
              <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 flex items-center">
                Other Product
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name <span className="text-red-500">*</span></Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <TextArea
                rows={3}
                value={newCategory.description || ""}
                onChange={(value) =>
                  setNewCategory({ ...newCategory, description: value })
                }
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setNewCategory({ ...emptyCategory });
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  !newCategory.categoryType ||
                  (newCategory.categoryType === "Other Product" &&
                    !newCategory.name)
                }
                onClick={handleAddCategory}
              >
                <Check className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditCategoryOpen}
        onClose={() => setIsEditCategoryOpen(false)}
        className="max-w-xl p-6"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Category
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {editingCategory?.name
                ? `Update category information for ${editingCategory.name}`
                : "Update category information"}
            </p>
          </div>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryType">Category Type <span className="text-red-500">*</span></Label>
                <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 flex items-center">
                  Other Product
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Category Name <span className="text-red-500">*</span></Label>
                <Input
                  id="editCategoryName"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Description</Label>
                <TextArea
                  placeholder={
                    editingCategory.categoryType === "Fuel"
                      ? "Petrol, Diesel and Special variants"
                      : "Describe the category products"
                  }
                  rows={3}
                  value={editingCategory.description || ""}
                  onChange={(value) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditCategoryOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    !editingCategory.categoryType ||
                    (editingCategory.categoryType === "Other Product" &&
                      !editingCategory.name)
                  }
                  onClick={handleUpdateCategory}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Update Category
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProductMasterDashboard;
