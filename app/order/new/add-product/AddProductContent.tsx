"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useOrderStore } from "@/store/order-store";
import {
  productSchemas,
  PRODUCT_CATALOG,
  PRODUCT_TYPES,
  COLLAR_PADI_OPTIONS,
  COLLAR_TYPE_OPTIONS,
} from "@/config/product-schemas";
import { TopBar } from "@/components/TopBar";
import { DropdownRow } from "@/components/DropdownRow";
import { OptionPickerModal, OptionItem } from "@/components/OptionPickerModal";
import { SizeQuantityInput } from "@/components/SizeQuantityInput";
import { ImageUpload } from "@/components/ImageUpload";
import { ProductLineItem, SizeQuantity, ProductImage } from "@/types";
import { toast } from "sonner";

type ActivePicker = {
  fieldId: string;
  title: string;
  options: (string | OptionItem)[];
  selectedValue?: string;
  showThumbnail?: boolean;
} | null;

export default function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editLineId = searchParams.get("edit");

  const { addItem, updateItem, items } = useOrderStore();
  const existingItem = editLineId
    ? items.find((it) => it.lineId === editLineId)
    : null;

  // Step: "details" (Product Details) | "sizes" (Sizes & Quantities)
  const [currentStep, setCurrentStep] = useState<"details" | "sizes">("details");

  // Default to Tshirt if new, or existing item's product type
  const [productType, setProductType] = useState<string>(
    existingItem?.productType ?? "Tshirt"
  );
  const [fields, setFields] = useState<Record<string, string>>(
    existingItem ? (existingItem.fields as Record<string, string>) : {}
  );
  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantity[]>(
    existingItem?.sizeQuantities ?? [{ size: "M", quantity: 1 }]
  );
  const [images, setImages] = useState<ProductImage[]>(
    existingItem?.images ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Active modal picker state
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const schema = useMemo(
    () => productSchemas[productType] ?? [],
    [productType]
  );

  const productOptions: OptionItem[] = useMemo(() => {
    return PRODUCT_CATALOG.map((p) => ({
      label: p.name,
      value: p.name,
      description: p.description,
      meta: p.meta,
      imageUrl: p.imageUrl,
      showThumbnail: true,
    }));
  }, []);

  const validateDetails = useCallback(() => {
    const e: Record<string, string> = {};
    if (!productType) {
      e.productType = "Please select a product.";
      return e;
    }

    for (const field of schema) {
      if (!field.required) continue;
      if (field.conditionalOn) {
        const watchVal = fields[field.conditionalOn.field];
        if (watchVal !== field.conditionalOn.value) continue;
      }
      if (!fields[field.id] || fields[field.id].trim() === "") {
        e[field.id] = `${field.label} is required.`;
      }
    }
    return e;
  }, [schema, fields, productType]);

  const validateSizes = useCallback(() => {
    const e: Record<string, string> = {};
    if (sizeQuantities.length === 0) {
      e.sizes = "Add at least one size and quantity.";
    } else if (sizeQuantities.some((s) => !s.size)) {
      e.sizes = "All size rows must have a size selected.";
    } else if (sizeQuantities.some((s) => s.quantity < 1)) {
      e.sizes = "All quantities must be at least 1.";
    }
    return e;
  }, [sizeQuantities]);

  const handleDetailsContinue = () => {
    const e = validateDetails();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstError = Object.values(e)[0];
      toast.error(firstError || "Please select all required product details.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setCurrentStep("sizes");
  };

  const handleSizesContinue = () => {
    const e = validateSizes();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstError = Object.values(e)[0];
      toast.error(firstError || "Please specify sizes and quantities.");
      return;
    }

    const item: ProductLineItem = {
      lineId: existingItem?.lineId ?? uuidv4(),
      productType,
      fields,
      sizeQuantities,
      images,
    };

    if (existingItem) {
      updateItem(existingItem.lineId, item);
    } else {
      addItem(item);
    }

    router.push("/order/new/cart");
  };

  const handleFieldChange = (fieldId: string, val: string) => {
    setFields((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  const handleProductSelect = (selected: string) => {
    setProductType(selected);
    setFields({});
    if (errors.productType) {
      setErrors((prev) => ({ ...prev, productType: "" }));
    }
  };

  const handleBack = () => {
    if (currentStep === "sizes") {
      setCurrentStep("details");
      return;
    }
    router.back();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        {/* Top App Bar with 2-step progress line (Image 2 style) */}
        <TopBar
          title="Product Details"
          onBack={handleBack}
          onClose={() => router.push("/order/new")}
          showMenu={true}
          showClose={true}
          progressStep={{
            current: currentStep === "details" ? 1 : 2,
            total: 2,
          }}
        />

        <div className="px-5 pt-6 pb-28">
          {currentStep === "details" ? (
            <div>
              <h2 className="text-2xl font-normal text-gray-900 mb-6">
                Enter all details about the product
              </h2>

              {/* 1. Select Your Product Dropdown Row */}
              <DropdownRow
                label="Select Your Product"
                value={productType}
                placeholder="Select Your Product"
                onClick={() =>
                  setActivePicker({
                    fieldId: "__product__",
                    title: "Select Your Product",
                    options: productOptions,
                    selectedValue: productType,
                    showThumbnail: true,
                  })
                }
                onClear={() => {
                  setProductType("");
                  setFields({});
                }}
                error={errors.productType}
              />

              {/* 2. Dynamic Field Dropdown Rows based on Product Schema */}
              {schema.map((fieldDef) => {
                // Check conditional visibility
                if (fieldDef.conditionalOn) {
                  const watched = fields[fieldDef.conditionalOn.field];
                  if (watched !== fieldDef.conditionalOn.value) return null;
                }

                // If text input
                if (fieldDef.type === "text") {
                  return (
                    <div key={fieldDef.id} className="mb-4">
                      <div
                        className={`bg-white border rounded-xl px-4 py-3 ${
                          errors[fieldDef.id]
                            ? "border-red-400"
                            : "border-gray-400"
                        }`}
                      >
                        <input
                          type="text"
                          value={fields[fieldDef.id] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(fieldDef.id, e.target.value)
                          }
                          placeholder={fieldDef.label}
                          className="w-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                        />
                      </div>
                      {errors[fieldDef.id] && (
                        <p className="mt-1 text-xs text-red-500 font-medium px-1">
                          {errors[fieldDef.id]}
                        </p>
                      )}
                    </div>
                  );
                }

                // If select dropdown row
                const currentValue = fields[fieldDef.id] ?? "";
                const isThumbnailField =
                  fieldDef.id === "fabric" ||
                  fieldDef.id === "colour" ||
                  fieldDef.id === "frontPrint" ||
                  fieldDef.id === "backPrint" ||
                  fieldDef.id === "collarType";

                const customOptions =
                  fieldDef.id === "collarPadi"
                    ? COLLAR_PADI_OPTIONS
                    : fieldDef.id === "collarType"
                    ? COLLAR_TYPE_OPTIONS
                    : (fieldDef.options ?? []);

                return (
                  <DropdownRow
                    key={fieldDef.id}
                    label={fieldDef.label}
                    value={currentValue}
                    placeholder={fieldDef.label}
                    onClick={() =>
                      setActivePicker({
                        fieldId: fieldDef.id,
                        title: fieldDef.label,
                        options: customOptions,
                        selectedValue: currentValue,
                        showThumbnail: isThumbnailField,
                      })
                    }
                    onClear={() => handleFieldChange(fieldDef.id, "")}
                    error={errors[fieldDef.id]}
                  />
                );
              })}

              {/* 3. Upload (Optional) Section */}
              <div className="mt-6">
                <ImageUpload value={images} onChange={setImages} />
              </div>
            </div>
          ) : (
            /* Step 2: Sizes & Quantities */
            <div>
              <h2 className="text-2xl font-normal text-gray-900 mb-2">
                Sizes &amp; Quantities
              </h2>
              <p className="text-sm text-gray-500 mb-6 font-normal">
                Specify the quantity needed for each size of {productType}.
              </p>
              <SizeQuantityInput
                value={sizeQuantities}
                onChange={setSizeQuantities}
                isJersey={productType === "Jersey"}
                error={errors.sizes}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <button
          type="button"
          onClick={
            currentStep === "details"
              ? handleDetailsContinue
              : handleSizesContinue
          }
          className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-base transition-colors shadow-sm"
        >
          {currentStep === "sizes" && existingItem
            ? "Save Changes"
            : "Continue"}
        </button>
      </div>

      {/* Full-Screen / Sheet Option Picker Modal */}
      {activePicker && (
        <OptionPickerModal
          title={activePicker.title}
          options={activePicker.options}
          selectedValue={activePicker.selectedValue}
          showThumbnail={activePicker.showThumbnail}
          onSelect={(val) => {
            if (activePicker.fieldId === "__product__") {
              handleProductSelect(val);
            } else {
              handleFieldChange(activePicker.fieldId, val);
            }
          }}
          onClose={() => setActivePicker(null)}
        />
      )}
    </div>
  );
}
