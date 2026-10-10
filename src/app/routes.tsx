import * as Icons from "lucide-react";
import { AppAbility, hasPermission } from "@/lib/ability";

export interface Route {
  path: string;
  title: string;
  icon?: keyof typeof Icons;
  children?: Route[];
  // Backend permission string ("service.resource.view") required to see this
  // tab. Omit for routes with no matching backend resource yet, or that
  // should always be visible (e.g. home). super-admin/owner bypass this.
  permission?: string;
  // Platform-level tab: visible to the platform's super-admin only. Unlike
  // `permission`, tenant owners do NOT get this — they bypass permission
  // checks but are not platform admins.
  superAdminOnly?: boolean;
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
        permission: "workspace.vision.view",
      },
      {
        path: "goals",
        title: "routes.goals",
        icon: "Target",
        permission: "workspace.goal.view",
      },
      {
        path: "organization-structure",
        title: "routes.organization_structure",
        icon: "Network",
        permission: "workspace.department.view",
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
        permission: "workspace.project.view",
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
        permission: "workspace.user.view",
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
        permission: "workspace.position.view",
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
        permission: "workspace.vacancy.view",
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
        permission: "workspace.job_application.view",
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
        path: "job-offers",
        title: "routes.job_offer",
        icon: "FileSignature",
        permission: "workspace.job_offer.view",
        children: [
          {
            path: "create",
            title: "routes.create_job_offer",
          },
          {
            path: "edit",
            title: "routes.edit_job_offer",
          },
        ],
      },
      {
        path: "interviews",
        title: "routes.interviews",
        icon: "Handshake",
        permission: "workspace.job_interview.view",
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
        permission: "workspace.shift.view",
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
        permission: "workspace.holiday.view",
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
        permission: "workspace.attendance.view",
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
        permission: "workspace.mission.view",
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
        permission: "workspace.attendance_permission.view",
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
        permission: "workspace.scholarship.view",
        children: [
          {
            path: "available-scholarships",
            title: "routes.available_scholarships",
            permission: "workspace.scholarship.view",
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
            permission: "workspace.scholarship_request.view",
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
            permission: "workspace.attendance_permission.view",
          },
          {
            path: "mission-requests",
            title: "routes.mission_requests",
            permission: "workspace.mission.view",
          },
          {
            path: "scholarship-requests",
            title: "routes.scholarship_requests",
            permission: "workspace.scholarship_request.view",
          },
        ],
      },
    ],
  },
  {
    path: "/finance",
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
            permission: "finance.quote.view",
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
            permission: "finance.invoice.view",
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
            permission: "finance.cash_invoice.view",
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
            permission: "finance.credit_note.view",
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
            permission: "finance.delivery_note.view",
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
            permission: "finance.bill.view",
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
            permission: "finance.cash_expense.view",
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
            permission: "finance.debit_note.view",
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
            permission: "finance.purchase_order.view",
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
        permission: "finance.customer.view",
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
            permission: "finance.payroll.view",
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
            permission: "finance.payrun.view",
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
            permission: "finance.payroll_payment.view",
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
            permission: "finance.item.view",
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
            permission: "finance.warehouse.view",
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
            permission: "finance.inventory_adjustment.view",
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
            permission: "finance.account.view",
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
            permission: "finance.tax_rate.view",
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
            permission: "finance.journal.view",
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
        permission: "finance.bank_account.view",
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
        permission: "finance.fixed_asset.view",
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
      {
        path: "cost-centers",
        title: "routes.cost_centers",
        icon: "Building2",
        permission: "finance.cost_center.view",
        children: [
          {
            path: "create",
            title: "routes.create_cost_center",
          },
          {
            path: "edit",
            title: "routes.edit_cost_center",
          },
        ],
      },
    ],
  },

  {
    path: "/governance",
    title: "routes.governance",
    icon: "Landmark",
    children: [
      {
        path: "bodies",
        title: "routes.governance_bodies",
        icon: "Building2",
        permission: "workspace.governance_body.view",
      },
      {
        path: "meetings",
        title: "routes.governance_meetings",
        icon: "CalendarCheck2",
        permission: "workspace.governance_meeting.view",
      },
      {
        path: "elections",
        title: "routes.governance_elections",
        icon: "Vote",
        permission: "workspace.governance_election.view",
      },
      {
        path: "approvals",
        title: "routes.enterprise_approvals",
        icon: "BadgeCheck",
        permission: "workspace.enterprise_approval.view",
      },
      {
        path: "transitions",
        title: "routes.governance_transitions",
        icon: "ArrowLeftRight",
        permission: "workspace.governance_transition.view",
      },
      {
        path: "championship",
        title: "routes.ceo_championship",
        icon: "Trophy",
        permission: "workspace.ceo_championship.view",
      },
    ],
  },
  {
    path: "/cars",
    title: "routes.cars",
    icon: "Car",
    permission: "workspace.car.view",
  },
  {
    path: "/permissions",
    title: "routes.permissions",
    icon: "ShieldCheck",
    permission: "workspace.user.update",
  },
  {
    path: "/documents",
    title: "routes.documents",
    icon: "FileText",
    children: [
      {
        path: "templates",
        title: "routes.document_templates",
        icon: "LayoutTemplate",
        permission: "workspace.document_template.view",
        children: [
          {
            path: "create",
            title: "routes.create_document_template",
          },
          {
            path: "edit",
            title: "routes.edit_document_template",
          },
        ],
      },
      {
        path: "issued",
        title: "routes.issued_documents",
        icon: "FileSignature",
        permission: "workspace.document.view",
        children: [
          {
            path: "create",
            title: "routes.create_document",
          },
          {
            path: "edit",
            title: "routes.edit_document",
          },
        ],
      },
      {
        path: "signatures",
        title: "routes.signature_assets",
        icon: "Stamp",
        children: [
          {
            path: "create",
            title: "routes.create_signature_asset",
          },
        ],
      },
    ],
  },
  {
    path: "/buffets",
    title: "routes.buffets",
    icon: "Coffee",
    permission: "workspace.buffet.view",
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
        permission: "website.setting.view",
      },
      {
        path: "customization",
        title: "routes.customization",
        icon: "Palette",
        permission: "website.setting.view",
      },
      {
        path: "pages",
        title: "routes.pages",
        icon: "FileText",
        permission: "website.page.view",
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
        permission: "website.setting.view",
      },
      {
        path: "orders",
        title: "routes.orders",
        icon: "Package",
        permission: "website.setting.view",
      },
      {
        path: "plans",
        title: "routes.plans",
        icon: "Package",
        permission: "website.setting.view",
      },
      {
        path: "subscribers",
        title: "routes.subscribers",
        icon: "Users",
        superAdminOnly: true,
      },
      {
        path: "verification",
        title: "routes.verification",
        icon: "BadgeCheck",
        permission: "website.setting.view",
      },
      {
        path: "verification-requests",
        title: "routes.verification_requests",
        icon: "ShieldCheck",
        superAdminOnly: true,
      },
    ],
  },
  {
    path: "/tickets",
    title: "routes.tickets",
    icon: "MessageSquare",
    permission: "workspace.ticket.view",
  },
  {
    path: "/auditor",
    title: "routes.auditor",
    icon: "Search",
    children: [
      {
        path: "companies",
        title: "routes.companies",
        icon: "Building2",
        permission: "auth.tenant.view",
      },
      {
        path: "incoming-requests",
        title: "routes.incoming_requests",
        icon: "Inbox",
        permission: "auth.audit_request.view",
      },
      {
        path: "outgoing-requests",
        title: "routes.outgoing_requests",
        icon: "Send",
        permission: "auth.audit_request.view",
      },
      {
        path: "subsidiaries",
        title: "routes.subsidiaries",
        icon: "Handshake",
        permission: "auth.audit_request.view",
      },
    ],
  },
];

/**
 * A route is visible if it carries its own permission the user holds, or
 * (when it has no permission of its own) if at least one descendant is
 * visible. Routes with neither a permission nor children (e.g. home) stay
 * visible by default.
 */
export function isRouteVisible(
  route: Route,
  ability: AppAbility,
  isSuperAdmin = false,
): boolean {
  if (route.superAdminOnly && !isSuperAdmin) return false;
  if (route.permission) return hasPermission(ability, route.permission);
  if (route.children && route.children.length > 0) {
    return route.children.some((child) =>
      isRouteVisible(child, ability, isSuperAdmin),
    );
  }
  return true;
}
