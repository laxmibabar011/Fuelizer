import React, { useState } from "react";
import {
  Card,
  CardContent,
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
  PlusCircle,
  Check,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  category_type: "Fuel" | "Non-Fuel";
  description?: string;
  is_active?: boolean;
};

type Product = {
  id: number;
  name: string;
  product_code?: string;
  hsn_code?: string;
  description?: string;
  image_url?: string;
  category_id: number;
  uom_id: number;
  sales_price: number;
  gst_rate: number;
  status: string;
  ProductCategory?: Category;
  UnitOfMeasure?: any;
  InventoryLevel?: any;
};

interface ProductCategoriesProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
}

const ProductCategories: React.FC<ProductCategoriesProps> = ({ categories, products, onRefresh }) => {
  // const [showArchivedCategories, setShowArchivedCategories] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<Category>({
    id: 0,
    name: "",
    category_type: "Non-Fuel",
    description: "",
    is_active: true,
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState<boolean>(false);

  const emptyCategory: Category = {
    id: 0,
    name: "",
    category_type: "Non-Fuel",
    description: "",
    is_active: true,
  };

  function handleEditCategory(category: Category) {
    setEditingCategory({ ...category });
    setIsEditCategoryOpen(true);
  }

  function handleUpdateCategory() {
    if (!editingCategory) return;
    if (!editingCategory.name || !editingCategory.category_type) {
      window.alert("Please fill in all required fields");
      return;
    }
    const payload: any = {
      name: editingCategory.name,
      category_type: editingCategory.category_type,
      description: editingCategory.description,
      is_active: true,
    };
    ProductMasterService.updateCategory(editingCategory.id, payload)
      .then(() => {
        onRefresh();
        setIsEditCategoryOpen(false);
        setEditingCategory(null);
        window.alert("Category updated successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to update category");
      });
  }

  function handleDeleteCategory(categoryId: number) {
    const hasProducts = products.some((p) => p.category_id === categoryId);
    if (hasProducts) {
      window.alert("Cannot delete category with products.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    ProductMasterService.deleteCategory(categoryId)
      .then(() => {
        onRefresh();
        window.alert("Category deleted successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to delete category");
      });
  }

  function handleAddCategory() {
    if (!newCategory.name || !newCategory.category_type) {
      window.alert("Please enter category name and select category type");
      return;
    }
    const payload: any = {
      name: newCategory.name,
      category_type: newCategory.category_type,
      description: newCategory.description,
      is_active: true,
    };
    ProductMasterService.createCategory(payload)
      .then(() => {
        onRefresh();
        setNewCategory({ ...emptyCategory });
        setIsAddCategoryOpen(false);
        window.alert("Category added successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to add category");
      });
  }

  function CategoryCard({ category }: { category: Category }) {
    const productCount = products.filter(
      (p) => p.category_id === category.id
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
              <Badge 
                variant={category.category_type === "Fuel" ? "default" : "secondary"} 
                className="text-xs mt-1"
              >
                {category.category_type}
              </Badge>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Categories
          </h2>
          <Badge variant="outline" className="text-sm">
            {categories.length} categories
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Switch
            label="Show archived"
            defaultChecked={false}
            onChange={() => {/* archived filter not implemented */}}
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
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

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
              <Label htmlFor="categoryName">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryType">
                Category Type <span className="text-red-500">*</span>
              </Label>
              <Select
                options={[
                  { value: "Fuel", label: "Fuel" },
                  { value: "Non-Fuel", label: "Non-Fuel" }
                ]}
                defaultValue={newCategory.category_type}
                onChange={(value) =>
                  setNewCategory({ ...newCategory, category_type: value as "Fuel" | "Non-Fuel" })
                }
                placeholder="Select category type"
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
                disabled={!newCategory.name || !newCategory.category_type}
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
                <Label htmlFor="editCategoryName">
                  Category Name <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="editCategoryType">
                  Category Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={[
                    { value: "Fuel", label: "Fuel" },
                    { value: "Non-Fuel", label: "Non-Fuel" }
                  ]}
                  defaultValue={editingCategory.category_type}
                  onChange={(value) =>
                    setEditingCategory({
                      ...editingCategory,
                      category_type: value as "Fuel" | "Non-Fuel",
                    })
                  }
                  placeholder="Select category type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Description</Label>
                <TextArea
                  placeholder="Describe the category products"
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
                  disabled={!editingCategory.name || !editingCategory.category_type}
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

export default ProductCategories;
