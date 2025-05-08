import { Context } from "hono";
import * as XLSX from "xlsx";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

interface ColumnDefinition {
  id: string;
  name: string;
  children_of: string | null;
}

const ColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  children_of: z.string().nullable(),
});

const ColumnResponseSchema = z.object({
  columns: z.array(ColumnSchema),
});

const prompt = `You are a helpful assistant that extracts column names from a CSV file, including complex multi-level column headers. Your task is to:

1. Identify the hierarchical structure of columns at any depth
2. Create a list of column objects preserving the full hierarchy
3. Each column should have:
   - id: a slug-format unique identifier (lowercase, hyphens instead of spaces)
   - name: the original column name
   - children_of: the id of the parent column, or null if it's a top-level column

For a CSV structure like:
   Department    |        Sales          |           Marketing           |
   Region       | Q1     |     Q2       | Campaign | Channel | Results  |
   Location     | Value  | Target | Value| Type     | Social  | ROI     |

Return:
{
  "columns": [
    {
      "id": "department",
      "name": "Department",
      "children_of": null
    },
    {
      "id": "department-region",
      "name": "Region",
      "children_of": "department"
    },
    {
      "id": "department-region-location",
      "name": "Location",
      "children_of": "department-region"
    },
    {
      "id": "sales",
      "name": "Sales",
      "children_of": null
    },
    {
      "id": "sales-q1",
      "name": "Q1",
      "children_of": "sales"
    },
    {
      "id": "sales-q1-value",
      "name": "Value",
      "children_of": "sales-q1"
    },
    {
      "id": "sales-q2",
      "name": "Q2",
      "children_of": "sales"
    },
    {
      "id": "sales-q2-target",
      "name": "Target",
      "children_of": "sales-q2"
    },
    {
      "id": "sales-q2-value",
      "name": "Value",
      "children_of": "sales-q2"
    },
    {
      "id": "marketing",
      "name": "Marketing",
      "children_of": null
    },
    {
      "id": "marketing-campaign",
      "name": "Campaign",
      "children_of": "marketing"
    },
    {
      "id": "marketing-campaign-type",
      "name": "Type",
      "children_of": "marketing-campaign"
    },
    {
      "id": "marketing-channel",
      "name": "Channel",
      "children_of": "marketing"
    },
    {
      "id": "marketing-channel-social",
      "name": "Social",
      "children_of": "marketing-channel"
    },
    {
      "id": "marketing-results",
      "name": "Results",
      "children_of": "marketing"
    },
    {
      "id": "marketing-results-roi",
      "name": "ROI",
      "children_of": "marketing-results"
    }
  ]
}

Important rules:
1. Create unique ids by combining parent names with current name
2. Handle any depth of nested columns (3+ levels deep)
3. Preserve the exact column names as shown in the CSV
4. Ensure proper parent-child relationships at all levels
5. Don't add any columns that are not in the CSV file
6. Ignore any index columns (typically the first column when it appears to be row numbers/identifiers)

Additional note about index columns:
- Index columns are often unnamed or have names like "Index", "ID", or "No."
- They typically contain sequential numbers or unique identifiers
- When you detect such a column, exclude it from the output entirely`;

const openai = new OpenAI({
  // baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey:
    "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",
  // "AIzaSyB7aZbWK1swCsO3rUVoHIY1cQPNBLD7uNk",
});

const MODEL = "gpt-4.1-mini";
// ;

export const listExcelSheets = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return c.json(
        { error: "Invalid file format. Only .xlsx and .xls files are allowed" },
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    return c.json({
      success: true,
      sheets: workbook.SheetNames,
    });
  } catch (error) {
    console.error("File sheet listing error:", error);
    return c.json({ error: "Error processing file" }, 500);
  }
};

export const parseExcelColumns = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const sheetName = formData.get("sheetName") as string;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!sheetName) {
      return c.json({ error: "No sheet name provided" }, 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return c.json(
        { error: "Invalid file format. Only .xlsx and .xls files are allowed" },
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    if (!workbook.SheetNames.includes(sheetName)) {
      return c.json({ error: "Sheet not found in workbook" }, 400);
    }

    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      blankrows: false,
      skipHidden: true,
      FS: ",",
      RS: "\n",
    });

    const response = await openai.responses.parse({
      model: MODEL,
      input: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: csv },
      ],
      text: {
        format: zodTextFormat(ColumnResponseSchema, "result"),
      },
    });

    if (!response.output_parsed) {
      return c.json(
        { error: "Failed to parse columns from OpenAI response" },
        500
      );
    }

    const parsedData = response.output_parsed;
    const columns = parsedData.columns || [];

    return c.json({
      success: true,
      columns,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return c.json({ error: "Error processing file" }, 500);
  }
};
