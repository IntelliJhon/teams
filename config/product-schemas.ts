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
  "Subli",
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
  "Front Sublimation",
  "Screen Printing",
  "Ready Made",
  "Repeat Order",
];

// Production type that requires the previous order's files to be uploaded
export const REPEAT_ORDER_PRODUCTION_TYPE = "Repeat Order";

export const SLEEVE_TYPE_OPTIONS: string[] = [
  "FULL SLEEVE",
  "HALF SLEEVE",
  "MEGA SLEEVE",
  "5 SLEEVE",
  "SLEEVELESS",
];

export const COLLAR_PADI_OPTIONS: OptionItem[] = [
  { label: "Normal", value: "Normal", description: "Description", meta: "Meta Data" },
  { label: "Short", value: "Short", description: "Description", meta: "Meta Data" },
  { label: "Innerpadi", value: "Innerpadi", description: "Only in CUT N SEW", meta: "Meta Data" },
  { label: "NA", value: "NA", description: "Description", meta: "Meta Data" },
];

export const COLLAR_TIPPING_LINE_OPTIONS: string[] = ["Single Line", "Double Line"];

export const BUTTON_OPTIONS: string[] = [
  "No Button",
  "One Button",
  "Two Button",
  "Three Button",
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

// Collar value that asks for the ready-made collar's colour
export const READY_MADE_COLLAR = "Ready Made";

export const COLLAR_TYPE_OPTIONS: OptionItem[] = [
  ...Array.from({ length: 10 }).map((_, i) => ({
    label: `Collar${i + 1}`,
    value: `Collar${i + 1}`,
    description: "Description",
    meta: "Meta Data",
    imageUrl: `/collars/collar${i + 1}.png`,
    showThumbnail: true,
  })),
  {
    label: READY_MADE_COLLAR,
    value: READY_MADE_COLLAR,
    description: "Ready-made collar",
    meta: "Meta Data",
    showThumbnail: true,
  },
];

// Where each front image is printed; "Others" lets the customer type their own placement
export const OTHER_POSITION = "Others";
export const FRONT_IMAGE_POSITIONS: string[] = [
  "Left Chest Logo",
  "Right Chest Logo",
  "Central Matter",
  "Right Hand Logo",
  "Left Hand Logo",
  OTHER_POSITION,
];

// Where each back image is printed (player names/numbers go in the separate Name List)
export const BACK_IMAGE_POSITIONS: string[] = [
  "Neck Logo",
  "Sponsor Logo",
  OTHER_POSITION,
];

export const YES_NO: string[] = ["Yes", "No"];
export const POCKET_OPTIONS: string[] = ["Yes", "No", "Inner Pocket"];
export const PRINT_YES_NO: string[] = ["YES", "NO"];

/** True when a field's conditionalOn rule is met (no rule = always shown) */
export function isConditionMet(
  rule: FieldDef["conditionalOn"],
  values: Record<string, string | boolean | undefined>
): boolean {
  if (!rule) return true;
  const watched = values[rule.field];
  return rule.value === undefined ? Boolean(watched) : watched === rule.value;
}

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
      options: POCKET_OPTIONS,
      display: "chips",
      required: true,
    },
    {
      id: "collarTipping",
      label: "COLLAR TIPPING",
      type: "select",
      options: YES_NO,
      display: "chips",
      required: true,
    },
    {
      id: "collarTippingLine",
      label: "Select Collar Tipping Line",
      type: "select",
      options: COLLAR_TIPPING_LINE_OPTIONS,
      required: true,
      display: "chips",
      conditionalOn: { field: "collarTipping", value: "Yes" },
    },
    {
      id: "collarTippingColour",
      label: "Select Collar Tipping Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "collarTipping", value: "Yes" },
    },
    {
      id: "collarPadi",
      label: "SELECT YOUR COLLAR PADI",
      type: "select",
      options: COLLAR_PADI_OPTIONS.map((c) => c.value),
      required: true,
    },
    {
      id: "innerPadiColour",
      label: "Select Inner Padi Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "collarPadi", value: "Innerpadi" },
    },
    {
      id: "collarType",
      label: "Select Collar Type",
      type: "select",
      options: COLLAR_TYPE_OPTIONS.map((c) => c.value),
      required: true,
    },
    {
      id: "collarColour",
      label: "Select Collar Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "collarType" },
    },
    {
      id: "rib",
      label: "Rib",
      type: "select",
      options: YES_NO,
      display: "chips",
      required: true,
    },
    {
      id: "ribColour",
      label: "Select Rib Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "rib", value: "Yes" },
    },
    {
      id: "handCuff",
      label: "HAND CUFF",
      type: "select",
      options: YES_NO,
      display: "chips",
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
      display: "chips",
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
      display: "chips",
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
      id: "collarType",
      label: "Select Collar Type",
      type: "select",
      options: COLLAR_TYPE_OPTIONS.map((c) => c.value),
      required: true,
    },
    {
      id: "collarColour",
      label: "Select Collar Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "collarType" },
    },
    {
      id: "rib",
      label: "Rib",
      type: "select",
      options: YES_NO,
      display: "chips",
      required: true,
    },
    {
      id: "ribColour",
      label: "Select Rib Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
      conditionalOn: { field: "rib", value: "Yes" },
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      display: "chips",
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
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      display: "chips",
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
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
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
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: PRINT_YES_NO,
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
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
      display: "chips",
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
      options: POCKET_OPTIONS,
      display: "chips",
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
      display: "chips",
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
      display: "chips",
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
      display: "chips",
      required: true,
    },
  ],
};
