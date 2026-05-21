import { type Category, CATEGORIES } from "@mcpfind/shared";

export type { Category };

export interface FormFields {
  name: string;
  github_url: string;
  package_name: string;
  description: string;
  package_type: "npm" | "pypi" | "docker" | "";
  category: Category | "";
}

export interface FormErrors {
  name?: string;
  github_url?: string;
  package_name?: string;
  description?: string;
  category?: string;
}

export const PACKAGE_TYPES = ["npm", "pypi", "docker", ""] as const;
type PackageType = (typeof PACKAGE_TYPES)[number];

export function isPackageType(v: string): v is PackageType {
  return (PACKAGE_TYPES as readonly string[]).includes(v);
}

const VALID_CATEGORIES: readonly string[] = CATEGORIES;

export function isCategory(v: string): v is Category {
  return VALID_CATEGORIES.includes(v);
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildYaml(fields: FormFields): string {
  const lines: string[] = ["servers:"];
  lines.push(`  - name: ${JSON.stringify(fields.name)}`);
  lines.push(`    github_url: ${JSON.stringify(fields.github_url)}`);
  lines.push(`    package_name: ${JSON.stringify(fields.package_name)}`);
  lines.push(`    description: ${JSON.stringify(fields.description)}`);
  if (fields.package_type) {
    lines.push(`    package_type: ${JSON.stringify(fields.package_type)}`);
  }
  if (fields.category) {
    lines.push(`    category: ${JSON.stringify(fields.category)}`);
  }
  return lines.join("\n") + "\n";
}

export function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Server name is required.";
  } else if (!toSlug(fields.name)) {
    // Fix 3: empty-slug guard moved into validate() so hasErrors reflects it
    errors.name = "Name must contain at least one letter or number.";
  }

  if (!fields.github_url.trim()) {
    errors.github_url = "GitHub URL is required.";
  } else if (
    // Fix #5: tighter GitHub URL regex (requires org/repo segments)
    // Fix 2: anchored regex — rejects trailing garbage, allows deep links
    !/^https:\/\/github\.com\/[^/]+\/[^/?#]+(?:[/?#].*)?$/.test(fields.github_url.trim())
  ) {
    errors.github_url =
      "Must be a full GitHub repo URL (e.g. https://github.com/org/repo)";
  }

  if (!fields.package_name.trim()) {
    errors.package_name = "Package name is required.";
  }

  if (!fields.description.trim()) {
    errors.description = "Description is required.";
  } else if (fields.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  }

  if (!fields.category) {
    errors.category = "Please select a category.";
  }

  return errors;
}
