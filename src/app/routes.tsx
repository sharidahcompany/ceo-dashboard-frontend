import * as Icons from "lucide-react";

export interface Route {
  path: string;
  title: string;
  icon?: keyof typeof Icons;
  children?: Route[];
}
export const routes: Route[] = [
  {
    path: "/",
    title: "routes.home",
    icon: "House",
  },
  {
    path: "/company-spirit",
    title: "routes.company_spirit",
    icon: "Heart",
    children: [
      {
        path: "vision",
        title: "routes.vision",
        icon: "Eye",
      },
      {
        path: "goals",
        title: "routes.goals",
        icon: "Target",
      },
      {
        path: "organization-structure",
        title: "routes.organization_structure",
        icon: "Network",
      },
    ],
  },
  {
    path: "/core-operations",
    title: "routes.core_operations",
    icon: "Activity",
    children: [
      {
        path: "projects",
        title: "routes.projects",
        icon: "Activity",
        children: [
          {
            path: "project",
            title: "routes.project",
            icon: "Activity",
            children: [
              {
                path: "overview",
                title: "routes.overview",
                children: [],
              },
              {
                path: "board",
                title: "routes.board",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/hr",
    title: "routes.hr",
    icon: "Users",
    children: [
      {
        path: "employees",
        title: "routes.employees",
        icon: "Users",
        children: [
          {
            path: "create",
            title: "routes.create_employee",
          },
          {
            path: "edit",
            title: "routes.edit_employee",
          },
        ],
      },
      {
        path: "positions",
        title: "routes.positions",
        icon: "BriefcaseBusiness",
        children: [
          {
            path: "create",
            title: "routes.create_position",
          },
          {
            path: "edit",
            title: "routes.edit_position",
          },
        ],
      },
      {
        path: "vacancies",
        title: "routes.vacancies",
        icon: "Zap",
        children: [
          {
            path: "create",
            title: "routes.create_vacancy",
          },
          {
            path: "edit",
            title: "routes.edit_vacancy",
          },
        ],
      },
      {
        path: "candidates",
        title: "routes.candidates",
        icon: "UserPen",
        children: [
          {
            path: "create",
            title: "routes.create_candidate",
          },
          {
            path: "edit",
            title: "routes.edit_candidate",
          },
        ],
      },
      {
        path: "interviews",
        title: "routes.interviews",
        icon: "Handshake",
        children: [
          {
            path: "create",
            title: "routes.create_interview",
          },
          {
            path: "edit",
            title: "routes.edit_interview",
          },
        ],
      },
      {
        path: "shifts",
        title: "routes.shifts",
        icon: "CalendarDays",
        children: [
          {
            path: "create",
            title: "routes.create_shift",
          },
          {
            path: "edit",
            title: "routes.edit_shift",
          },
        ],
      },
      {
        path: "holidays",
        title: "routes.holidays",
        icon: "CalendarHeart",
        children: [
          {
            path: "create",
            title: "routes.create_holiday",
          },
          {
            path: "edit",
            title: "routes.edit_holiday",
          },
        ],
      },
      {
        path: "attendance",
        title: "routes.attendance",
        icon: "FingerprintPattern",
        children: [
          {
            path: "create",
            title: "routes.create_attendance",
          },
          {
            path: "edit",
            title: "routes.edit_attendance",
          },
        ],
      },
      {
        path: "missions",
        title: "routes.missions",
        icon: "Flag",
        children: [
          {
            path: "create",
            title: "routes.create_mission",
          },
          {
            path: "edit",
            title: "routes.edit_mission",
          },
        ],
      },
      {
        path: "attendance-permissions",
        title: "routes.attendance_permissions",
        icon: "UserX",
        children: [
          {
            path: "create",
            title: "routes.create_attendance_permission",
          },
          {
            path: "edit",
            title: "routes.edit_attendance_permission",
          },
        ],
      },
      {
        path: "scholarships",
        title: "routes.scholarships",
        icon: "GraduationCap",
        children: [
          {
            path: "available-scholarships",
            title: "routes.available_scholarships",
            children: [
              {
                path: "create",
                title: "routes.create_scholarship",
              },
              {
                path: "edit",
                title: "routes.edit_scholarship",
              },
            ],
          },
          {
            path: "scholarship-requests",
            title: "routes.scholarship_requests",
            children: [
              {
                path: "create",
                title: "routes.create_scholarship_request",
              },
            ],
          },
        ],
      },
      {
        path: "employee-requests",
        title: "routes.employee_requests",
        icon: "FileText",
        children: [
          {
            path: "leave-requests",
            title: "routes.leave_requests",
          },
          {
            path: "mission-requests",
            title: "routes.mission_requests",
          },
          {
            path: "scholarship-requests",
            title: "routes.scholarship_requests",
          },
        ],
      },
    ],
  },
  {
    path: "/financial-services",
    title: "routes.financial_services",
    icon: "DollarSign",
    children: [
      {
        path: "sales",
        title: "routes.sales",
        icon: "CircleDollarSign",
        children: [
          {
            path: "quotes-and-proformas",
            title: "routes.quotes_and_proformas",
            children: [
              {
                path: "create",
                title: "routes.create_quote",
              },
              {
                path: "edit",
                title: "routes.edit_quote",
              },
            ],
          },
          {
            path: "invoices",
            title: "routes.invoices",
            icon: "Receipt",
            children: [
              {
                path: "create",
                title: "routes.create_invoice",
              },
              {
                path: "edit",
                title: "routes.edit_invoice",
              },
            ],
          },
          {
            path: "cash-invoices",
            title: "routes.cash_invoices",
            icon: "Banknote",
            children: [
              {
                path: "create",
                title: "routes.create_cash_invoice",
              },
              {
                path: "edit",
                title: "routes.edit_cash_invoice",
              },
            ],
          },
          {
            path: "credit-notes",
            title: "routes.credit_notes",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_credit_note",
              },
              {
                path: "edit",
                title: "routes.edit_credit_note",
              },
            ],
          },
          {
            path: "delivery-notes",
            title: "routes.delivery_notes",
            icon: "Truck",
            children: [
              {
                path: "create",
                title: "routes.create_delivery_note",
              },
              {
                path: "edit",
                title: "routes.edit_delivery_note",
              },
            ],
          },
        ],
      },
      {
        path: "purchases",
        title: "routes.purchases",
        icon: "ShoppingBag",
        children: [
          {
            path: "bills",
            title: "routes.bills",
            icon: "Receipt",
            children: [
              {
                path: "create",
                title: "routes.create_bill",
              },
              {
                path: "edit",
                title: "routes.edit_bill",
              },
            ],
          },
          {
            path: "cash-expenses",
            title: "routes.cash_expenses",
            icon: "Banknote",
            children: [
              {
                path: "create",
                title: "routes.create_cash_expense",
              },
              {
                path: "edit",
                title: "routes.edit_cash_expense",
              },
            ],
          },
          {
            path: "debit-notes",
            title: "routes.debit_notes",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_debit_note",
              },
              {
                path: "edit",
                title: "routes.edit_debit_note",
              },
            ],
          },
          {
            path: "purchase-orders",
            title: "routes.purchase_orders",
            icon: "Truck",
            children: [
              {
                path: "create",
                title: "routes.create_purchase_order",
              },
              {
                path: "edit",
                title: "routes.edit_purchase_order",
              },
            ],
          },
        ],
      },
      {
        path: "customers",
        title: "routes.customers",
        icon: "Users",
        children: [
          {
            path: "create",
            title: "routes.create_customer",
          },
          {
            path: "edit",
            title: "routes.edit_customer",
          },
        ],
      },
      {
        path: "payroll-management",
        title: "routes.payroll_management",
        icon: "CreditCard",
        children: [
          {
            path: "payroll",
            title: "routes.payroll",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_payroll",
              },
              {
                path: "edit",
                title: "routes.edit_payroll",
              },
            ],
          },
          {
            path: "payruns",
            title: "routes.payruns",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_payrun",
              },
              {
                path: "edit",
                title: "routes.edit_payrun",
              },
            ],
          },
          {
            path: "payroll-payments",
            title: "routes.payroll_payments",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_payroll_payment",
              },
              {
                path: "edit",
                title: "routes.edit_payroll_payment",
              },
            ],
          },
        ],
      },
      {
        path: "inventory",
        title: "routes.inventory",
        icon: "Box",
        children: [
          {
            path: "items",
            title: "routes.items",
            icon: "Box",
            children: [
              {
                path: "create",
                title: "routes.create_item",
              },
              {
                path: "edit",
                title: "routes.edit_item",
              },
            ],
          },
          {
            path: "warehouses",
            title: "routes.warehouses",
            icon: "Building",
            children: [
              {
                path: "create",
                title: "routes.create_warehouse",
              },
              {
                path: "edit",
                title: "routes.edit_warehouse",
              },
            ],
          },
          {
            path: "adjustments",
            title: "routes.adjustments",
            icon: "Box",
            children: [
              {
                path: "create",
                title: "routes.create_adjustment",
              },
              {
                path: "edit",
                title: "routes.edit_adjustment",
              },
            ],
          },
        ],
      },
      {
        path: "accounting",
        title: "routes.accounting",
        icon: "CreditCard",
        children: [
          {
            path: "accounts",
            title: "routes.accounts",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_account",
              },
              {
                path: "edit",
                title: "routes.edit_account",
              },
            ],
          },
          {
            path: "tax-rates",
            title: "routes.tax_rates",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_tax_rate",
              },
              {
                path: "edit",
                title: "routes.edit_tax_rate",
              },
            ],
          },
          {
            path: "manual-journals",
            title: "routes.manual_journals",
            icon: "CreditCard",
            children: [
              {
                path: "create",
                title: "routes.create_manual_journal",
              },
              {
                path: "edit",
                title: "routes.edit_manual_journal",
              },
            ],
          },
        ],
      },
      {
        path: "bank-accounts",
        title: "routes.bank_accounts",
        icon: "Landmark",
        children: [
          {
            path: "create",
            title: "routes.create_bank_account",
          },
          {
            path: "edit",
            title: "routes.edit_bank_account",
          },
        ],
      },
      {
        path: "fixed-assets",
        title: "routes.fixed_assets",
        icon: "PackageOpen",
        children: [
          {
            path: "create",
            title: "routes.create_fixed_asset",
          },
          {
            path: "edit",
            title: "routes.edit_fixed_asset",
          },
        ],
      },
    ],
  },
  {
    path: "/buffets",
    title: "routes.buffets",
    icon: "Coffee",
    children: [
      {
        path: "[id]",
        title: "routes.buffet",
        icon: "Coffee",
        children: [
          {
            path: "requests",
            title: "routes.buffet_requests",
            icon: "Coffee",
          },
        ],

      },
    ],
  },
  {
    path: "/website",
    title: "routes.website",
    icon: "Globe",
    children: [
      {
        path: "settings",
        title: "routes.settings",
        icon: "Settings",
      },
      {
        path: "customization",
        title: "routes.customization",
        icon: "Palette",
      },
      {
        path: "pages",
        title: "routes.pages",
        icon: "FileText",
        children: [
          {
            path: "create",
            title: "routes.create_page",
          },
          {
            path: "edit",
            title: "routes.edit_page",
          },
        ],
      },
      {
        path: "theme-store",
        title: "routes.theme_store",
        icon: "LayoutTemplate",
      },
      {
        path: "products",
        title: "routes.products",
        icon: "Package",
      },
      {
        path: "plans",
        title: "routes.plans",
        icon: "Package",
      }
    ],
  },
  {
    path: "/auditor",
    title: "routes.auditor",
    icon: "WifiPen",
    children: [
      {
        path: "companies",
        title: "routes.companies",
        icon: "WifiPen",
      },
      {
        path: "incoming-requests",
        title: "routes.incoming_requests",
        icon: "WifiPen",
      },
      {
        path: "outgoing-requests",
        title: "routes.outgoing_requests",
        icon: "WifiPen",
      },
      {
        path: "subsidiaries",
        title: "routes.subsidiaries",
        icon: "WifiPen",
      },
    ],
  },
];
