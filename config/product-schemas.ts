import { FieldDef } from "@/types";

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

// ─────────────────────────────────────────────
//  Shared field option lists
// ─────────────────────────────────────────────
const FABRIC_OPTIONS = [
  "180 GSM Cotton",
  "200 GSM Cotton",
  "220 GSM Cotton",
  "Polyester",
  "Dri-Fit",
  "Cotton-Polyester Blend",
  "Fleece",
  "French Terry",
];

const COLOUR_OPTIONS = [
  "White",
  "Black",
  "Navy Blue",
  "Royal Blue",
  "Red",
  "Maroon",
  "Green",
  "Bottle Green",
  "Grey",
  "Charcoal Grey",
  "Yellow",
  "Orange",
  "Purple",
  "Beige",
  "Custom / Other",
];

const PRODUCTION_TYPE_OPTIONS = [
  "Cut & Sew",
  "Sublimation",
  "Screen Printing",
  "Ready Made",
];

const PRINT_TYPE_OPTIONS = [
  "NA",
  "Embroidery",
  "DTF",
  "Screen",
  "Subli P",
  "HD",
  "Woven-Applique",
  "Sublimation-Applique",
  "Other",
];

const YES_NO = ["Yes", "No"];

// ─────────────────────────────────────────────
//  Product schemas
// ─────────────────────────────────────────────
export const productSchemas: Record<string, FieldDef[]> = {
  // ── T-Shirt (fully specified) ──────────────
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
      label: "Select Your Fabric",
      type: "select",
      options: FABRIC_OPTIONS,
      required: true,
    },
    {
      id: "colour",
      label: "Select Your Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "Select Your Sleeve Type",
      type: "select",
      options: ["Full Sleeve", "Half Sleeve", "Mega Sleeve"],
      required: true,
    },
    {
      id: "pocket",
      label: "Pocket",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "collarTipping",
      label: "Collar Tipping",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "collarPadi",
      label: "Select Your Collar Padi",
      type: "select",
      options: ["Normal", "Short", "Innerpadi", "NA"],
      required: true,
    },
    {
      id: "handCuff",
      label: "Hand Cuff",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "button",
      label: "Select Your Button",
      type: "select",
      options: ["No Button", "One Button", "Two Button", "ZIP"],
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "Select Your Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "Yes" },
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
      options: YES_NO,
      required: true,
    },
    {
      id: "backPrintType",
      label: "Select Back Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "backPrint", value: "Yes" },
    },
    {
      id: "backPrintTypeOtherText",
      label: "Describe Back Print",
      type: "text",
      placeholder: "Describe the custom back print…",
      conditionalOn: { field: "backPrintType", value: "Other" },
    },
  ],

  // ── Jersey (stubbed) ──────────────────────
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
      label: "Select Your Fabric",
      type: "select",
      // TODO: confirm jersey-specific fabrics
      options: ["Dri-Fit", "Polyester", "Mesh", "Interlock"],
      required: true,
    },
    {
      id: "colour",
      label: "Select Your Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "Select Your Sleeve Type",
      type: "select",
      options: ["Full Sleeve", "Half Sleeve", "Sleeveless"],
      required: true,
    },
    {
      id: "collarType",
      label: "Select Collar Type",
      type: "select",
      // TODO: confirm collar type options for jersey
      options: ["Round Neck", "V-Neck", "Polo Collar", "NA"],
      required: true,
    },
    {
      id: "rib",
      label: "Rib",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "Select Your Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "Yes" },
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
      options: YES_NO,
      required: true,
    },
    {
      id: "backPrintType",
      label: "Select Back Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "backPrint", value: "Yes" },
    },
  ],

  // ── Shorts (stubbed) ──────────────────────
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
      label: "Select Your Fabric",
      type: "select",
      // TODO: confirm shorts-specific fabrics
      options: ["Dri-Fit", "Polyester", "Cotton", "Nylon"],
      required: true,
    },
    {
      id: "colour",
      label: "Select Your Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "Pocket",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "Select Your Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "Yes" },
    },
    {
      id: "printTypeOtherText",
      label: "Describe Your Print",
      type: "text",
      placeholder: "Describe the custom print…",
      conditionalOn: { field: "printType", value: "Other" },
    },
  ],

  // ── Hoodie (stubbed) ──────────────────────
  Hoodie: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "Select Your Fabric",
      type: "select",
      // TODO: confirm hoodie-specific fabrics
      options: ["Fleece", "French Terry", "Cotton Blend", "Polar Fleece"],
      required: true,
    },
    {
      id: "colour",
      label: "Select Your Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "pocket",
      label: "Pocket (Kangaroo)",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "button",
      label: "Zipper / Button",
      type: "select",
      options: ["No Button", "ZIP", "One Button", "Two Button"],
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "Select Your Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "Yes" },
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
      options: YES_NO,
      required: true,
    },
    {
      id: "backPrintType",
      label: "Select Back Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      conditionalOn: { field: "backPrint", value: "Yes" },
    },
  ],

  // ── Polo (stubbed) ────────────────────────
  Polo: [
    {
      id: "productionType",
      label: "Select Production Type",
      type: "select",
      options: PRODUCTION_TYPE_OPTIONS,
      required: true,
    },
    {
      id: "fabric",
      label: "Select Your Fabric",
      type: "select",
      // TODO: confirm polo-specific fabrics
      options: ["Pique Cotton", "Dri-Fit Pique", "Lacoste", "Cotton Blend"],
      required: true,
    },
    {
      id: "colour",
      label: "Select Your Colour",
      type: "select",
      options: COLOUR_OPTIONS,
      required: true,
    },
    {
      id: "sleeveType",
      label: "Select Your Sleeve Type",
      type: "select",
      options: ["Half Sleeve", "Full Sleeve"],
      required: true,
    },
    {
      id: "collarType",
      label: "Select Collar Type",
      type: "select",
      options: ["Polo Collar", "Rib Collar"],
      required: true,
    },
    {
      id: "collarTipping",
      label: "Collar Tipping",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "button",
      label: "Select Your Button",
      type: "select",
      options: ["No Button", "One Button", "Two Button"],
      required: true,
    },
    {
      id: "pocket",
      label: "Pocket",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "frontPrint",
      label: "Front Print",
      type: "select",
      options: YES_NO,
      required: true,
    },
    {
      id: "printType",
      label: "Select Your Print Type",
      type: "select",
      options: PRINT_TYPE_OPTIONS,
      required: true,
      conditionalOn: { field: "frontPrint", value: "Yes" },
    },
    {
      id: "printTypeOtherText",
      label: "Describe Your Print",
      type: "text",
      placeholder: "Describe the custom print…",
      conditionalOn: { field: "printType", value: "Other" },
    },
  ],
};

export const PRODUCT_TYPES = Object.keys(productSchemas);
