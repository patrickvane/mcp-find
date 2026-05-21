import { describe, it, expect } from "vitest";
import {
  toSlug,
  buildYaml,
  validate,
  isPackageType,
  isCategory,
  PACKAGE_TYPES,
} from "./submit-helpers";
import type { FormFields } from "./submit-helpers";

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

function validFields(overrides: Partial<FormFields> = {}): FormFields {
  return {
    name: "My Cool Server",
    github_url: "https://github.com/org/repo",
    package_name: "my-cool-server",
    description: "A server that does cool things well.",
    package_type: "npm",
    category: "productivity",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// toSlug
// ---------------------------------------------------------------------------

describe("toSlug", () => {
  it("converts a typical name to lowercase-hyphenated slug", () => {
    // Arrange
    const name = "My Cool Server";
    // Act
    const result = toSlug(name);
    // Assert
    expect(result).toBe("my-cool-server");
  });

  it("returns empty string for all-special-char input", () => {
    const result = toSlug("!!!@@@");
    expect(result).toBe("");
  });

  it("returns empty string for unicode-only input (non-ASCII stripped)", () => {
    const result = toSlug("服务器");
    expect(result).toBe("");
  });

  it("handles mixed alphanumeric and special characters", () => {
    const result = toSlug("Hello, World!");
    expect(result).toBe("hello-world");
  });

  it("strips leading and trailing dashes", () => {
    const result = toSlug("-foo-");
    expect(result).toBe("foo");
  });

  it("collapses multiple consecutive non-alphanumeric characters to single dash", () => {
    const result = toSlug("a   b");
    expect(result).toBe("a-b");
  });

  it("handles an empty string input", () => {
    const result = toSlug("");
    expect(result).toBe("");
  });

  it("preserves numeric characters", () => {
    const result = toSlug("Server 42");
    expect(result).toBe("server-42");
  });

  it("collapses multiple punctuation into single dash", () => {
    const result = toSlug("hello---world");
    expect(result).toBe("hello-world");
  });

  it("handles already-slugified input unchanged", () => {
    const result = toSlug("already-slugified");
    expect(result).toBe("already-slugified");
  });
});

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

describe("validate", () => {
  describe("when all fields are valid", () => {
    it("returns an empty errors object", () => {
      const errors = validate(validFields());
      expect(errors).toEqual({});
    });
  });

  // --- name ---

  describe("name validation", () => {
    it("sets errors.name when name is empty string", () => {
      const errors = validate(validFields({ name: "" }));
      expect(errors.name).toBeDefined();
    });

    it("sets errors.name when name is whitespace-only", () => {
      const errors = validate(validFields({ name: "   " }));
      expect(errors.name).toBeDefined();
    });

    it("sets errors.name when name has only special chars (empty slug)", () => {
      // "!!!" trims to "!!!" which is non-empty, but toSlug("!!!") === ""
      const errors = validate(validFields({ name: "!!!" }));
      expect(errors.name).toBeDefined();
      expect(errors.name).toMatch(/letter or number/i);
    });

    it("accepts a valid name with letters and numbers", () => {
      const errors = validate(validFields({ name: "Valid Server 2" }));
      expect(errors.name).toBeUndefined();
    });
  });

  // --- github_url ---

  describe("github_url validation", () => {
    it("sets errors.github_url when github_url is empty", () => {
      const errors = validate(validFields({ github_url: "" }));
      expect(errors.github_url).toBeDefined();
    });

    it("sets errors.github_url when github_url is whitespace-only", () => {
      const errors = validate(validFields({ github_url: "   " }));
      expect(errors.github_url).toBeDefined();
    });

    it("sets errors.github_url for a malformed URL (not github.com)", () => {
      const errors = validate(
        validFields({ github_url: "https://gitlab.com/org/repo" })
      );
      expect(errors.github_url).toBeDefined();
    });

    it("sets errors.github_url for plain http (not https)", () => {
      const errors = validate(
        validFields({ github_url: "http://github.com/org/repo" })
      );
      expect(errors.github_url).toBeDefined();
    });

    it("accepts a valid org/repo GitHub URL", () => {
      const errors = validate(
        validFields({ github_url: "https://github.com/MCPFind/mcp-find" })
      );
      expect(errors.github_url).toBeUndefined();
    });

    it("accepts a deep link URL with subpath", () => {
      const errors = validate(
        validFields({
          github_url:
            "https://github.com/MCPFind/mcp-find/tree/main",
        })
      );
      expect(errors.github_url).toBeUndefined();
    });

    it("sets errors.github_url when only org is present (no repo segment)", () => {
      const errors = validate(
        validFields({ github_url: "https://github.com/org" })
      );
      expect(errors.github_url).toBeDefined();
    });

    it("accepts a github_url with leading/trailing whitespace (trimmed before regex)", () => {
      // validate() calls .trim() on github_url before regex — current implementation behavior
      const errors = validate(
        validFields({ github_url: "  https://github.com/org/repo  " })
      );
      expect(errors.github_url).toBeUndefined();
    });

    it("sets errors.github_url for URL with no path at all", () => {
      const errors = validate(
        validFields({ github_url: "https://github.com/" })
      );
      expect(errors.github_url).toBeDefined();
    });
  });

  // --- package_name ---

  describe("package_name validation", () => {
    it("sets errors.package_name when package_name is empty", () => {
      const errors = validate(validFields({ package_name: "" }));
      expect(errors.package_name).toBeDefined();
    });

    it("sets errors.package_name when package_name is whitespace-only", () => {
      const errors = validate(validFields({ package_name: "   " }));
      expect(errors.package_name).toBeDefined();
    });

    it("accepts a valid package name", () => {
      const errors = validate(validFields({ package_name: "@org/pkg" }));
      expect(errors.package_name).toBeUndefined();
    });
  });

  // --- description ---

  describe("description validation", () => {
    it("sets errors.description when description is empty", () => {
      const errors = validate(validFields({ description: "" }));
      expect(errors.description).toBeDefined();
    });

    it("sets errors.description when description is below 20 characters", () => {
      const errors = validate(validFields({ description: "Too short." }));
      expect(errors.description).toBeDefined();
    });

    it("sets errors.description when description is exactly 19 chars (below boundary)", () => {
      // 19 chars — one below the 20 char minimum
      const desc = "A".repeat(19);
      const errors = validate(validFields({ description: desc }));
      expect(errors.description).toBeDefined();
    });

    it("accepts description of exactly 20 characters (boundary passes)", () => {
      const desc = "A".repeat(20);
      const errors = validate(validFields({ description: desc }));
      expect(errors.description).toBeUndefined();
    });

    it("accepts description longer than 20 characters", () => {
      const errors = validate(
        validFields({ description: "A very detailed description that is long enough." })
      );
      expect(errors.description).toBeUndefined();
    });

    it("sets errors.description when whitespace-only description trims to under 20 chars", () => {
      const errors = validate(validFields({ description: "   " }));
      expect(errors.description).toBeDefined();
    });
  });

  // --- category ---

  describe("category validation", () => {
    it("sets errors.category when category is empty string", () => {
      const errors = validate(validFields({ category: "" }));
      expect(errors.category).toBeDefined();
    });

    it("accepts a valid category value", () => {
      const errors = validate(validFields({ category: "databases" }));
      expect(errors.category).toBeUndefined();
    });

    it("accepts all valid category values without errors", () => {
      const validCategories = [
        "databases", "cloud", "monitoring", "security", "testing",
        "analytics", "automation", "media", "documentation", "social",
        "ecommerce", "devtools", "communication", "filesystems", "search",
        "ai-ml", "finance", "crm", "productivity", "maps", "other",
      ] as const;

      for (const cat of validCategories) {
        const errors = validate(validFields({ category: cat }));
        expect(errors.category, `category "${cat}" should not error`).toBeUndefined();
      }
    });
  });

  // --- multiple errors ---

  describe("multiple simultaneous errors", () => {
    it("reports all required-field errors at once for an entirely empty form", () => {
      const errors = validate({
        name: "",
        github_url: "",
        package_name: "",
        description: "",
        package_type: "",
        category: "",
      });
      expect(errors.name).toBeDefined();
      expect(errors.github_url).toBeDefined();
      expect(errors.package_name).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.category).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// buildYaml
// ---------------------------------------------------------------------------

describe("buildYaml", () => {
  it("generates well-formed YAML with all fields present", () => {
    const fields = validFields();
    const yaml = buildYaml(fields);

    expect(yaml).toContain("servers:");
    expect(yaml).toContain(`  - name: ${JSON.stringify(fields.name)}`);
    expect(yaml).toContain(`    github_url: ${JSON.stringify(fields.github_url)}`);
    expect(yaml).toContain(`    package_name: ${JSON.stringify(fields.package_name)}`);
    expect(yaml).toContain(`    description: ${JSON.stringify(fields.description)}`);
    expect(yaml).toContain(`    package_type: ${JSON.stringify(fields.package_type)}`);
    expect(yaml).toContain(`    category: ${JSON.stringify(fields.category)}`);
  });

  it("omits package_type from output when package_type is empty string", () => {
    const yaml = buildYaml(validFields({ package_type: "" }));
    expect(yaml).not.toContain("package_type");
  });

  it("omits category from output when category is empty string", () => {
    const yaml = buildYaml(validFields({ category: "" }));
    expect(yaml).not.toContain("category");
  });

  it("JSON.stringify-escapes double quotes in description", () => {
    const fields = validFields({
      description: 'A server with "quoted" content that is long enough.',
    });
    const yaml = buildYaml(fields);
    // JSON.stringify wraps in double quotes and escapes internal quotes
    expect(yaml).toContain(`    description: "A server with \\"quoted\\" content that is long enough."`);
  });

  it("JSON.stringify-escapes newlines in description", () => {
    const fields = validFields({
      description: "Line one\nLine two that makes it long enough.",
    });
    const yaml = buildYaml(fields);
    expect(yaml).toContain("\\n");
  });

  it("output ends with a newline character", () => {
    const yaml = buildYaml(validFields());
    expect(yaml.endsWith("\n")).toBe(true);
  });

  it("snapshot: known-good fixture produces stable output", () => {
    const fields: FormFields = {
      name: "Stable Server",
      github_url: "https://github.com/test/stable",
      package_name: "stable-server",
      description: "A stable, predictable MCP server for testing.",
      package_type: "npm",
      category: "devtools",
    };
    const yaml = buildYaml(fields);
    expect(yaml).toMatchInlineSnapshot(`
      "servers:
        - name: "Stable Server"
          github_url: "https://github.com/test/stable"
          package_name: "stable-server"
          description: "A stable, predictable MCP server for testing."
          package_type: "npm"
          category: "devtools"
      "
    `);
  });
});

// ---------------------------------------------------------------------------
// isPackageType
// ---------------------------------------------------------------------------

describe("isPackageType", () => {
  it("returns true for 'npm'", () => {
    expect(isPackageType("npm")).toBe(true);
  });

  it("returns true for 'pypi'", () => {
    expect(isPackageType("pypi")).toBe(true);
  });

  it("returns true for 'docker'", () => {
    expect(isPackageType("docker")).toBe(true);
  });

  it("returns true for empty string ('' is in PACKAGE_TYPES)", () => {
    // PACKAGE_TYPES = ["npm", "pypi", "docker", ""] as const
    expect(isPackageType("")).toBe(true);
  });

  it("returns true for every value in the PACKAGE_TYPES constant", () => {
    for (const pt of PACKAGE_TYPES) {
      expect(isPackageType(pt), `PACKAGE_TYPES member "${pt}" should pass`).toBe(true);
    }
  });

  it("returns false for an arbitrary string not in PACKAGE_TYPES", () => {
    expect(isPackageType("cargo")).toBe(false);
  });

  it("returns false for a partial match", () => {
    expect(isPackageType("np")).toBe(false);
  });

  it("returns false for an uppercase variant", () => {
    expect(isPackageType("NPM")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isCategory
// ---------------------------------------------------------------------------

describe("isCategory", () => {
  it("returns true for 'productivity'", () => {
    expect(isCategory("productivity")).toBe(true);
  });

  it("returns true for 'ai-ml' (hyphenated category)", () => {
    expect(isCategory("ai-ml")).toBe(true);
  });

  it("returns true for 'other'", () => {
    expect(isCategory("other")).toBe(true);
  });

  it("returns true for every known category", () => {
    const knownCategories = [
      "databases", "cloud", "monitoring", "security", "testing",
      "analytics", "automation", "media", "documentation", "social",
      "ecommerce", "devtools", "communication", "filesystems", "search",
      "ai-ml", "finance", "crm", "productivity", "maps", "other",
    ];
    for (const cat of knownCategories) {
      expect(isCategory(cat), `category "${cat}" should be valid`).toBe(true);
    }
  });

  it("returns false for an unknown category string", () => {
    expect(isCategory("not-a-category")).toBe(false);
  });

  it("returns false for an empty string", () => {
    // Category type is the union of known values — '' is not a member
    expect(isCategory("")).toBe(false);
  });

  it("returns false for a case-variant of a known category", () => {
    expect(isCategory("Productivity")).toBe(false);
  });

  it("returns false for a partial match of a known category", () => {
    expect(isCategory("product")).toBe(false);
  });
});
