import { Context } from "hono";
import * as XLSX from "xlsx";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const ColumnListSchema = z.object({ columns: z.array(z.string()) });

const prompt = `
You are a helpful assistant that extracts column names from a CSV file, including multi-level column headers. For multi-level columns, combine the levels using hyphens in the format "level1-level2-level3". Extract all column names from the header rows and flatten them into single strings. Return only the list of column names as an array of strings in the 'columns' field.

For example, if a CSV has a structure like:
   Main      |    Category A    |
   SubA SubB | Item1 Item2 Item3

It should be converted to:
{
  "columns": [
    "Main-SubA",
    "Main-SubB", 
    "Category A-Item1",
    "Category A-Item2",
    "Category A-Item3"
  ]
}

Note: Ensure all levels are connected with hyphens, maintain the order of levels.
`;

const openai = new OpenAI({
  apiKey:
    "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",
});

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
    const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });

    const response = await openai.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: csv },
      ],
      text: {
        format: zodTextFormat(ColumnListSchema, "columns"),
      },
    });

    if (!response.output_parsed) {
      return c.json(
        { error: "Failed to parse columns from OpenAI response" },
        500
      );
    }
    const columns = response.output_parsed.columns;
    return c.json({
      success: true,
      columns,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return c.json({ error: "Error processing file" }, 500);
  }
};
