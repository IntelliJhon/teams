import { FieldDef, ProductCatalogItem } from "@/types";
import { OptionItem } from "@/components/OptionPickerModal";

// ─────────────────────────────────────────────
//  Size options (shared across products)
// ─────────────────────────────────────────────
export const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "Free Size",
];

// Numeric sizes (from Image 2)
export const NUMERIC_SIZE_OPTIONS = [
  "22", "24", "26", "28", "30",
  "32", "34", "36", "38", "40",
  "42", "44", "46", "48", "50"
];

// ─────────────────────────────────────────────
//  Product Catalog (15 products from screenshots)
// ─────────────────────────────────────────────
export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    name: "Tshirt",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/tshirt.svg",
  },
  {
    name: "Jersey",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/jersey.svg",
  },
  {
    name: "Shorts",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/shorts.svg",
  },
  {
    name: "Lower",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/lower.svg",
  },
  {
    name: "Socks",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/socks.svg",
  },
  {
    name: "Upper",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/upper.svg",
  },
  {
    name: "FormalShirt",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/formalshirt.svg",
  },
  {
    name: "Formalpants",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/formalpants.svg",
  },
  {
    name: "Apron",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/apron.svg",
  },
  {
    name: "Coat",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/coat.svg",
  },
  {
    name: "Frock",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/frock.svg",
  },
  {
    name: "Skirt",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/skirt.svg",
  },
  {
    name: "Wib",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/wib.svg",
  },
  {
    name: "Slashes",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/slashes.svg",
  },
  {
    name: "Flag",
    description: "Description",
    meta: "Meta Data",
    imageUrl: "/products/flag.svg",
  },
];

export const PRODUCT_TYPES = PRODUCT_CATALOG.map((p) => p.name);

// ─────────────────────────────────────────────
//  Shared Option Lists (from screenshots)
// ─────────────────────────────────────────────
export const FABRIC_OPTIONS: string[] = [
  "Lacoste",
  "Dot-Knit",
  "Selina",
  "PP",
  "Lycra",
  "Nirmal-Knit",
  "Rice-Knit",
  "Butter-Scotch",
  "Mars",
  "Honey-Comp",
  "OC-Polo-Inner-Cotton",
  "Mono-Knit",
  "Jaquard",
  "Box-Knit",
  "Honey-Sap",
  "Oc-Polo-Normal",
  "Pop-Knit",
];

export const COLOUR_OPTIONS: string[] = [
  "NA",
  "Black",
  "White",
  "Navy-Blue",
  "Royal-Blue",
  "Sky-Blue",
  "Golden-Yellow",
  "Lemon-Yellow",
  "Banana/Mango-Yellow",
  "P-Green",
  "Z-Green",
  "B-Green",
  "F-Green",
  "Peacock-Green",
  "Dark-Green",
  "Dark-Grey",
  "Light-Grey",
  "Light-Pink",
  "Dark-Pink",
  "Purple",
  "Lavender",
  "Maroon",
  "Coffee",
  "Camel",
  "Kaki",
  "Orange",
  "F-Orange",
];

export const PRODUCTION_TYPE_OPTIONS: string[] = [
  "Cut & Sew",
  "Sublimation",
  "Screen Printing",
  "Ready Made",
];

export const SLEEVE_TYPE_OPTIONS: string[] = [
  "FULL SLEEVE",
  "HALF SLEEVE",
  "MEGA SLEEVE",
];

export const COLLAR_PADI_OPTIONS: OptionItem[] = [
  { label: "Normal", value: "Normal", description: "Description", meta: "Meta Data" },
  { label: "Short", value: "Short", description: "Description", meta: "Meta Data" },
  { label: "Innerpadi", value: "Innerpadi", description: "Only in CUT N SEW", meta: "Meta Data" },
  { label: "NA", value: "NA", description: "Description", meta: "Meta Data" },
];

export const BUTTON_OPTIONS: string[] = [
  "No Button",
  "One Button",
  "Two Button",
  "ZIP",
];

export const PRINT_TYPE_OPTIONS: string[] = [
  "NA",
  "EMBROIDERY",
  "DTF",
  "SCREEN",
  "SUBLI P",
  "HD",
  "Woven-Applique",
  "Sublimation-Applique",
];

export const COLLAR_TYPE_OPTIONS: OptionItem[] = Array.from({ length: 10 }).map((_, i) => ({
  label: `Collar${i + 1}`,
  value: `Collar${i + 1}`,
  description: "Description",
  meta: "Meta Data",
  showThumbnail: true,
}));

export const YES_NO: string[] = ["Yes", "No"];
export const PRINT_YES_NO: string[] = ["YES", "NO"];

// ─────────────────────────────────────────────
//  Product schemas
// ─────────────────────────────────────────────
export const productSchemas: Record<string, FieldDef[]> = {
  // ── Tshirt (matching Image 1 exactly) ───────
  Tshirt: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "SELECT YOUR SLEEVE TYPE",
      type: "select",
      options: SLEEVE_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "collarTipping",
      label: "COLLAR TIPPING",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "collarPadi",
      label: "SELECT YOUR COLLAR PADI",
      type: "select",
      options: COLLAR_PADI_OPTIONS.map((c) => c.value),
      required: true,
    },
    {
      id: "handCuff",
      label: "HAND CUFF",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "button",
      label: "SELECT YOUR BUTTON",
      type: "select",
      options: BUTTON_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "SELECT YOUR PRINT TYPE",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "YES" },
    },
    {
      id: "printTypeOtherText",
      label: "Describe Your Print",
      type: "text",
      placeholder: "Describe the custom print…",
      conditionalOn: { field: "printType", value: "Other" },
    },
    {
      id: "backPrint",
      label: "Back Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
    {
      id: "backPrintType",
      label: "Select Back Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "backPrint", value: "YES" },
    },
  ],

  // ── Jersey (matching Images 2 & 3) ─────────
  Jersey: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "SELECT YOUR SLEEVE TYPE",
      type: "select",
      options: SLEEVE_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "SELECT YOUR PRINT TYPE",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "frontPrint", value: "YES" },
    },
    {
      id: "backPrint",
      label: "Back Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
    {
      id: "backPrintType",
      label: "Select Back Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "backPrint", value: "YES" },
    },
    {
      id: "collarType",
      label: "Select Collar Type",
      type: "select",
      options: COLLAR_TYPE_OPTIONS.map((c) => c.value),
      required: true,
    },
    {
      id: "rib",
      label: "Rib",
      type: "select",
      options: YES_NO,
      required: true,
    },
  ],

  // ── Shorts ────────────────────────────────
  Shorts: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Lower ─────────────────────────────────
  Lower: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Socks ─────────────────────────────────
  Socks: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Upper ─────────────────────────────────
  Upper: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "SELECT YOUR SLEEVE TYPE",
      type: "select",
      options: SLEEVE_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "button",
      label: "SELECT YOUR BUTTON",
      type: "select",
      options: BUTTON_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── FormalShirt ───────────────────────────
  FormalShirt: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "SELECT YOUR SLEEVE TYPE",
      type: "select",
      options: ["FULL SLEEVE", "HALF SLEEVE"],
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
  ],

  // ── Formalpants ───────────────────────────
  Formalpants: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
  ],

  // ── Apron ─────────────────────────────────
  Apron: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Coat ──────────────────────────────────
  Coat: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "button",
      label: "SELECT YOUR BUTTON",
      type: "select",
      options: BUTTON_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
  ],

  // ── Frock ─────────────────────────────────
  Frock: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "SELECT YOUR SLEEVE TYPE",
      type: "select",
      options: SLEEVE_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Skirt ─────────────────────────────────
  Skirt: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "POCKET",
      type: "select",
      options: YES_NO,
      required: true,
    },
  ],

  // ── Wib ───────────────────────────────────
  Wib: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Slashes ───────────────────────────────
  Slashes: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],

  // ── Flag ──────────────────────────────────
  Flag: [
    {
      id: "fabric",
      label: "SELECT YOUR FABRIC",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "SELECT YOUR COLOUR",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      required: true,
    },
  ],
};
