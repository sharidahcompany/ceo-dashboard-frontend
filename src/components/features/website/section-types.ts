// Predefined Section Types matching Laravel Backend Enum
export const SECTION_TYPES = [
    { value: "navbar", label: "Navbar" },
    { value: "header", label: "Header" },
    { value: "vision", label: "Vision" },
    { value: "goals", label: "Goals" },
    { value: "section", label: "Section" },
    { value: "features", label: "Features" },
    { value: "carousel", label: "Carousel" },
    { value: "products", label: "Products" },
    { value: "branches_map", label: "Branches Map" },
    { value: "team", label: "Our Team" },
    { value: "contact_us", label: "Contact Us" },
    { value: "footer", label: "Footer" },
    { value: "plans", label: "Plans" },
    { value: "subscribers", label: "Subscribers" },
];

// Sections the landing page renders entirely from backend data, so there is
// nothing to configure here and they are always saved with an empty content.
export const FIXED_SECTION_TYPES = [
    "navbar",
    "products",
    "vision",
    "goals",
    "branches_map",
    "team",
    "contact_us",
    "footer",
    "plans",
    "subscribers",
];

export const isFixedSectionType = (type: string) => FIXED_SECTION_TYPES.includes(type);
