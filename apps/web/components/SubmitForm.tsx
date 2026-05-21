"use client";

import { useState, type FormEvent } from "react";
import { IconBrandGithub, IconArrowUpRight } from "@tabler/icons-react";
import { CATEGORIES, CATEGORY_LABELS } from "@mcpfind/shared";
import type { Category } from "@mcpfind/shared";

interface FormFields {
  name: string;
  github_url: string;
  package_name: string;
  description: string;
  package_type: "npm" | "pypi" | "docker" | "";
  category: Category | "";
}

interface FormErrors {
  name?: string;
  github_url?: string;
  package_name?: string;
  description?: string;
  category?: string;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildYaml(fields: FormFields): string {
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

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Server name is required.";
  }

  if (!fields.github_url.trim()) {
    errors.github_url = "GitHub URL is required.";
  } else if (!fields.github_url.startsWith("https://github.com/")) {
    errors.github_url = 'URL must start with "https://github.com/".';
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

const INPUT_BASE =
  "w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50";
const INPUT_ERROR = "border-red-500/60 focus:border-red-500 focus:ring-red-500/30";

export function SubmitForm() {
  const [fields, setFields] = useState<FormFields>({
    name: "",
    github_url: "",
    package_name: "",
    description: "",
    package_type: "",
    category: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormFields>>(new Set());

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field once user types
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function markTouched(key: keyof FormFields) {
    setTouched((prev) => new Set(prev).add(key));
  }

  function handleBlur(key: keyof FormFields) {
    markTouched(key);
    const fieldErrors = validate(fields);
    setErrors((prev) => ({ ...prev, [key]: fieldErrors[key as keyof FormErrors] }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fieldErrors = validate(fields);
    setErrors(fieldErrors);
    // Mark all as touched so errors show
    setTouched(new Set(Object.keys(fields) as Array<keyof FormFields>));

    if (Object.keys(fieldErrors).length > 0) return;

    const slug = toSlug(fields.name);
    const yaml = buildYaml(fields);
    const encoded = encodeURIComponent(yaml);
    const url = `https://github.com/MCPFind/mcp-find/new/main?filename=submissions/${slug}.yml&value=${encoded}`;
    window.open(url, "_blank");
  }

  const activeErrors = validate(fields);
  const hasErrors = Object.keys(activeErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Server Name */}
      <div>
        <label htmlFor="sf-name" className="block text-sm font-medium text-neutral-300 mb-2">
          Server Name <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-name"
          type="text"
          placeholder="e.g. My Awesome MCP Server"
          value={fields.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          className={[INPUT_BASE, touched.has("name") && errors.name ? INPUT_ERROR : ""].join(" ")}
        />
        {touched.has("name") && errors.name && (
          <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* GitHub URL */}
      <div>
        <label htmlFor="sf-url" className="block text-sm font-medium text-neutral-300 mb-2">
          GitHub Repository URL <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-url"
          type="url"
          placeholder="https://github.com/org/repo"
          value={fields.github_url}
          onChange={(e) => setField("github_url", e.target.value)}
          onBlur={() => handleBlur("github_url")}
          className={[INPUT_BASE, touched.has("github_url") && errors.github_url ? INPUT_ERROR : ""].join(" ")}
        />
        {touched.has("github_url") && errors.github_url && (
          <p className="mt-1.5 text-xs text-red-400">{errors.github_url}</p>
        )}
      </div>

      {/* Package Name */}
      <div>
        <label htmlFor="sf-pkg" className="block text-sm font-medium text-neutral-300 mb-2">
          Package Name <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-pkg"
          type="text"
          placeholder="e.g. my-mcp-server or @org/mcp-server"
          value={fields.package_name}
          onChange={(e) => setField("package_name", e.target.value)}
          onBlur={() => handleBlur("package_name")}
          className={[INPUT_BASE, touched.has("package_name") && errors.package_name ? INPUT_ERROR : ""].join(" ")}
        />
        <p className="mt-1.5 text-xs text-neutral-600">npm package name, PyPI name, or Docker image</p>
        {touched.has("package_name") && errors.package_name && (
          <p className="mt-1 text-xs text-red-400">{errors.package_name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="sf-desc" className="block text-sm font-medium text-neutral-300 mb-2">
          Short Description <span className="text-red-400">*</span>
        </label>
        <input
          id="sf-desc"
          type="text"
          placeholder="One sentence description of what your server does"
          value={fields.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={() => handleBlur("description")}
          className={[INPUT_BASE, touched.has("description") && errors.description ? INPUT_ERROR : ""].join(" ")}
        />
        <p className="mt-1.5 text-xs text-neutral-600">Min 20 characters</p>
        {touched.has("description") && errors.description && (
          <p className="mt-1 text-xs text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Package Type (optional) */}
      <div>
        <label htmlFor="sf-type" className="block text-sm font-medium text-neutral-300 mb-2">
          Package Type <span className="text-neutral-600 text-xs font-normal">(optional)</span>
        </label>
        <select
          id="sf-type"
          value={fields.package_type}
          onChange={(e) => setField("package_type", e.target.value as FormFields["package_type"])}
          className={[INPUT_BASE, "appearance-none"].join(" ")}
        >
          <option value="">Select package type...</option>
          <option value="npm">npm</option>
          <option value="pypi">PyPI</option>
          <option value="docker">Docker</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="sf-cat" className="block text-sm font-medium text-neutral-300 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <select
          id="sf-cat"
          value={fields.category}
          onChange={(e) => setField("category", e.target.value as Category | "")}
          onBlur={() => handleBlur("category")}
          className={[INPUT_BASE, "appearance-none", touched.has("category") && errors.category ? INPUT_ERROR : ""].join(" ")}
        >
          <option value="">Select a category...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        {touched.has("category") && errors.category && (
          <p className="mt-1.5 text-xs text-red-400">{errors.category}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={touched.size > 0 && hasErrors}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 text-base"
      >
        <IconBrandGithub size={18} />
        Open GitHub Editor
        <IconArrowUpRight size={16} />
      </button>

      <p className="text-center text-neutral-600 text-xs">
        This opens GitHub&apos;s web editor with your data prefilled. GitHub will prompt you to fork
        and open a pull request — no extra account setup needed.
      </p>
    </form>
  );
}
