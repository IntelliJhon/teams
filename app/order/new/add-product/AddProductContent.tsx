"use client";

import { Fragment, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useOrderStore } from "@/store/order-store";
import {
  productSchemas,
  PRODUCT_CATALOG,
  PRODUCT_TYPES,
  COLLAR_PADI_OPTIONS,
  COLLAR_TYPE_OPTIONS,
  REPEAT_ORDER_PRODUCTION_TYPE,
  FRONT_IMAGE_POSITIONS,
  BACK_IMAGE_POSITIONS,
  isConditionMet,
} from "@/config/product-schemas";
import { TopBar } from "@/components/TopBar";
import { DropdownRow } from "@/components/DropdownRow";
import { OptionPickerModal, OptionItem } from "@/components/OptionPickerModal";
import { SizeQuantityInput } from "@/components/SizeQuantityInput";
import { ImageUpload } from "@/components/ImageUpload";
import { NameListModal } from "@/components/NameListModal";
import { readTable, rowsToPlayers } from "@/lib/nameListImport";
import { ProductLineItem, SizeQuantity, ProductImage, FieldDef, PlayerDetail } from "@/types";
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
  const [frontImages, setFrontImages] = useState<ProductImage[]>(
    existingItem?.frontImages ?? existingItem?.images ?? []
  );
  const [backImages, setBackImages] = useState<ProductImage[]>(
    existingItem?.backImages ?? []
  );
  const [repeatOrderFiles, setRepeatOrderFiles] = useState<ProductImage[]>(
    existingItem?.repeatOrderFiles ?? []
  );
  const isRepeatOrder = fields.productionType === REPEAT_ORDER_PRODUCTION_TYPE;
  // Back print master name list. Older items only had per-size players, so seed from those.
  const [nameList, setNameList] = useState<PlayerDetail[]>(() => {
    if (existingItem?.nameList?.length) return existingItem.nameList;
    return (existingItem?.sizeQuantities ?? []).flatMap((r) =>
      (r.players ?? [])
        .filter((p) => (p.number || "").trim() || (p.name || "").trim())
        .map((p) => ({ ...p, size: r.size }))
    );
  });
  const [nameListFiles, setNameListFiles] = useState<ProductImage[]>(
    existingItem?.nameListFiles ?? []
  );
  const [nameListModalOpen, setNameListModalOpen] = useState(false);
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
      if (!isConditionMet(field.conditionalOn, fields)) continue;
      if (!fields[field.id] || fields[field.id].trim() === "") {
        e[field.id] = `${field.label} is required.`;
      }
    }
    if (isRepeatOrder && repeatOrderFiles.length === 0) {
      e.repeatOrderFiles = "Please upload the previous order file for a Repeat Order.";
    }
    const frontShown = !schema.some((f) => f.id === "frontPrint") || fields.frontPrint === "YES";
    if (frontShown && frontImages.some((img) => !img.position?.trim())) {
      e.frontImages = "Choose where each front image goes (or type it under Others).";
    }
    const backShown = !schema.some((f) => f.id === "backPrint") || fields.backPrint === "YES";
    if (backShown && backImages.some((img) => !img.position?.trim())) {
      e.backImages = "Choose where each back image goes (or type it under Others).";
    }
    return e;
  }, [schema, fields, productType, isRepeatOrder, repeatOrderFiles, frontImages, backImages]);

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

    // Front/back uploads only count when their print question was answered YES
    const keptFront = hasFrontPrintField && fields.frontPrint !== "YES" ? [] : frontImages;
    const backKept = !hasBackPrintField || fields.backPrint === "YES";
    const keptBack = backKept ? backImages : [];

    const item: ProductLineItem = {
      lineId: existingItem?.lineId ?? uuidv4(),
      productType,
      fields,
      // Per-size player lists come from the master name list when it is in use
      sizeQuantities:
        backKept && nameList.length > 0
          ? sizeQuantities.map((r) => ({
              ...r,
              players: nameList
                .filter((p) => p.size === r.size)
                .map((p) => ({ number: p.number, name: p.name })),
            }))
          : sizeQuantities,
      images: [...keptFront, ...keptBack],
      frontImages: keptFront,
      backImages: keptBack,
      ...(isRepeatOrder ? { repeatOrderFiles } : {}),
      ...(backKept && nameList.length > 0 ? { nameList } : {}),
      ...(backKept && nameListFiles.length > 0
        ? { nameListFiles: nameListFiles.filter((f, i) => nameListFiles.findIndex((g) => g.url === f.url) === i) }
        : {}),
    };

    if (existingItem) {
      updateItem(existingItem.lineId, item);
    } else {
      addItem(item);
    }

    router.push("/order/new/cart");
  };

  const handleFieldChange = (fieldId: string, val: string) => {
    setFields((prev) => {
      const next = { ...prev, [fieldId]: val };
      // Drop follow-up answers whose condition no longer holds (e.g. collar colour after leaving Ready Made)
      for (const f of schema) {
        if (!isConditionMet(f.conditionalOn, next)) {
          delete next[f.id];
        }
      }
      return next;
    });
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

  // A CSV / Excel list uploaded in the Name List box fills the typed list too
  const importNameListFiles = async (files: File[]) => {
    for (const file of files) {
      const table = await readTable(file, file.name).catch(() => null);
      if (!table) continue;
      const players = rowsToPlayers(table);
      if (players.length === 0) continue;
      if (nameList.length === 0) {
        setNameList(players);
        toast.success(`Added ${players.length} players from ${file.name}. Tap "Edit typed names" to check them.`);
      } else {
        toast.info(`${file.name} has ${players.length} players. Open "Edit typed names" to replace or add them.`);
      }
      return;
    }
  };

  const hasFrontPrintField = schema.some((f) => f.id === "frontPrint");
  const hasBackPrintField = schema.some((f) => f.id === "backPrint");
  // The name list lives under Back Print (or at the bottom for products without that question)
  const nameListActive = !hasBackPrintField || fields.backPrint === "YES";

  const frontUpload = (
    <div className={hasFrontPrintField ? "-mt-1 mb-4 pl-3 border-l-2 border-emerald-200" : ""}>
      <ImageUpload
        label="Front Images (Optional)"
        sublabel="Upload Front Design / Logo / Sponsor"
        maxFiles={10}
        value={frontImages}
        onChange={(imgs) => {
          setFrontImages(imgs);
          if (errors.frontImages) setErrors((prev) => ({ ...prev, frontImages: "" }));
        }}
        positionOptions={FRONT_IMAGE_POSITIONS}
        error={errors.frontImages}
      />
    </div>
  );

  const backUpload = (
    <div className={hasBackPrintField ? "-mt-1 mb-4 pl-3 border-l-2 border-emerald-200" : ""}>
      <ImageUpload
        label="Back Images (Optional)"
        sublabel="Upload Back Design / Player Artwork / Sponsor"
        maxFiles={10}
        value={backImages}
        onChange={(imgs) => {
          setBackImages(imgs);
          if (errors.backImages) setErrors((prev) => ({ ...prev, backImages: "" }));
        }}
        positionOptions={BACK_IMAGE_POSITIONS}
        error={errors.backImages}
      />

      {/* Name List: names + numbers for the back, as a file or typed in */}
      <div className="mb-4 -mt-2 p-3 rounded-2xl border border-gray-200 bg-gray-50/60">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900">Name List (Optional)</h3>
          {(nameList.length > 0 || nameListFiles.length > 0) && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {nameList.length > 0 ? `${nameList.length} typed` : ""}
              {nameList.length > 0 && nameListFiles.length > 0 ? " · " : ""}
              {nameListFiles.length > 0 ? `${nameListFiles.length} file` : ""}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Player names &amp; numbers for the back — upload your Excel / CSV list or type them in.
        </p>

        <button
          type="button"
          onClick={() => setNameListModalOpen(true)}
          className="w-full mb-3 py-2.5 px-4 rounded-full border border-emerald-600 bg-white text-emerald-700 text-sm font-medium flex items-center justify-center gap-2 active:bg-emerald-50 transition-colors cursor-pointer"
        >
          <span>✍️</span>
          <span>{nameList.length > 0 ? `Edit typed names (${nameList.length})` : "Type names & numbers"}</span>
        </button>

        {nameList.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {nameList.slice(0, 8).map((p, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-0.5 uppercase"
              >
                {p.number ? `#${p.number} ` : ""}
                {p.name}
                {p.size ? <span className="text-emerald-700"> · {p.size}</span> : null}
              </span>
            ))}
            {nameList.length > 8 && (
              <span className="text-[11px] text-gray-500 px-1 py-0.5">+{nameList.length - 8} more</span>
            )}
          </div>
        )}

        <ImageUpload
          label="Or upload the list"
          sublabel="Excel, CSV or a photo of the list"
          maxFiles={3}
          allowDocuments
          documentAccept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
          hint="Excel (.xlsx, .xls), CSV, PDF, Word or a photo."
          buttonLabel="Upload Excel / CSV"
          value={nameListFiles}
          onChange={setNameListFiles}
          onFilesPicked={importNameListFiles}
        />
      </div>
    </div>
  );

  const renderField = (fieldDef: FieldDef) => {
    // Check conditional visibility
    if (!isConditionMet(fieldDef.conditionalOn, fields)) return null;

    // Short option lists: tap-to-select buttons shown inline
    if (fieldDef.display === "chips") {
      const selected = fields[fieldDef.id] ?? "";
      return (
        <div
          key={fieldDef.id}
          className={
            fieldDef.conditionalOn
              ? "mb-4 -mt-1 pl-3 border-l-2 border-emerald-200"
              : "mb-4"
          }
        >
          <p
            className={
              fieldDef.conditionalOn
                ? "text-xs font-medium text-gray-500 mb-2"
                : "text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-1"
            }
          >
            {fieldDef.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {(fieldDef.options ?? []).map((opt) => {
              const isActive = selected === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleFieldChange(fieldDef.id, opt)}
                  aria-pressed={isActive}
                  className={`flex-1 min-w-[90px] px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : errors[fieldDef.id]
                      ? "border-red-400 bg-white text-gray-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {isActive ? "✓ " : ""}
                  {opt}
                </button>
              );
            })}
          </div>
          {errors[fieldDef.id] && (
            <p className="mt-1 text-xs text-red-500 font-medium px-1">
              {errors[fieldDef.id]}
            </p>
          )}
        </div>
      );
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
      fieldDef.id === "collarColour" ||
      fieldDef.id === "collarTippingColour" ||
      fieldDef.id === "innerPadiColour" ||
      fieldDef.id === "ribColour" ||
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
      <Fragment key={fieldDef.id}>
        <div className={fieldDef.conditionalOn ? "-mt-1 pl-3 border-l-2 border-emerald-200" : undefined}>
          <DropdownRow
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
        </div>

        {/* Repeat Order: previous order file upload, right under the Production Type dropdown */}
        {fieldDef.id === "productionType" && isRepeatOrder && (
          <div className="-mt-1 mb-4 px-4 pt-4 pb-1 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <ImageUpload
              label="Previous Order File"
              sublabel="Upload the earlier order's design / PDF / invoice to repeat"
              maxFiles={5}
              allowDocuments
              value={repeatOrderFiles}
              onChange={(files) => {
                setRepeatOrderFiles(files);
                if (errors.repeatOrderFiles) {
                  setErrors((prev) => ({ ...prev, repeatOrderFiles: "" }));
                }
              }}
              error={errors.repeatOrderFiles}
            />
          </div>
        )}
      </Fragment>
    );
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

              {/* 2. Dynamic Field Rows based on Product Schema (print uploads sit under their YES answer) */}
              {schema.map((fieldDef) => (
                <Fragment key={fieldDef.id}>
                  {renderField(fieldDef)}
                  {fieldDef.id === "frontPrint" && fields.frontPrint === "YES" && frontUpload}
                  {fieldDef.id === "backPrint" && fields.backPrint === "YES" && backUpload}
                </Fragment>
              ))}

              {/* 3. Products without a Front/Back Print question keep the uploads at the bottom */}
              {!hasFrontPrintField && (
                <div className="mt-6 pt-5 border-t border-gray-100">{frontUpload}</div>
              )}
              {!hasBackPrintField && (
                <div className="mt-4 pt-4 border-t border-gray-100">{backUpload}</div>
              )}
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
                {...(nameListActive
                  ? { nameList, onNameListChange: setNameList }
                  : {})}
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

      {/* Back print name list (typed) */}
      <NameListModal
        isOpen={nameListModalOpen}
        players={nameList}
        onSave={setNameList}
        onClose={() => setNameListModalOpen(false)}
        referenceFiles={nameListFiles}
        onReferenceChange={setNameListFiles}
      />

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
