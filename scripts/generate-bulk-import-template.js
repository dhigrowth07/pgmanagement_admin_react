import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the template structure
const headers = [
  "name",
  "email",
  "password",
  "phone",
  "block_name",
  "room_number",
  "dob",
  "gender",
  "emergency_number_one",
  "emergency_number_two",
  "tariff_id",
  "advance",
];

// Example data rows
const exampleData = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    phone: "9876543210",
    block_name: "Block A",
    room_number: "101",
    dob: "1990-01-15",
    gender: "male",
    emergency_number_one: "9876543211",
    emergency_number_two: "9876543212",
    tariff_id: "1",
    advance: "3000",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    password: "securepass456",
    phone: "9876543213",
    block_name: "Block B",
    room_number: "205",
    dob: "1992-05-20",
    gender: "female",
    emergency_number_one: "9876543214",
    emergency_number_two: "",
    tariff_id: "2",
    advance: "5000",
  },
  {
    name: "Raj Kumar",
    email: "raj.kumar@example.com",
    password: "mypass789",
    phone: "9876543215",
    block_name: "Block A",
    room_number: "102",
    dob: "1995-08-10",
    gender: "male",
    emergency_number_one: "9876543216",
    emergency_number_two: "9876543217",
    tariff_id: "",
    advance: "2000",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    password: "pass1234",
    phone: "9876543218",
    block_name: "",
    room_number: "",
    dob: "1993-12-25",
    gender: "female",
    emergency_number_one: "9876543219",
    emergency_number_two: "",
    tariff_id: "1",
    advance: "0",
  },
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet with headers and data
const worksheetData = [
  headers,
  ...exampleData.map((row) => headers.map((header) => row[header] || "")),
];
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column widths for better readability
const columnWidths = [
  { wch: 20 }, // name
  { wch: 30 }, // email
  { wch: 15 }, // password
  { wch: 15 }, // phone
  { wch: 15 }, // block_name
  { wch: 15 }, // room_number
  { wch: 12 }, // dob
  { wch: 10 }, // gender
  { wch: 18 }, // emergency_number_one
  { wch: 18 }, // emergency_number_two
  { wch: 12 }, // tariff_id
  { wch: 12 }, // advance
];
worksheet["!cols"] = columnWidths;

// Style the header row (bold)
const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  if (!worksheet[cellAddress]) continue;
  worksheet[cellAddress].s = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E0E0E0" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Import Template");

// Determine output path
const outputPath = path.join(__dirname, "../public/bulk_import_template.xlsx");

// Write file
XLSX.writeFile(workbook, outputPath);

console.log("✅ Bulk import template generated successfully!");
console.log(`📁 Location: ${outputPath}`);
console.log("\n📋 Template includes:");
console.log("   - Required columns: name, email, password, phone");
console.log(
  "   - Block assignment: block_name, room_number (must be provided together)"
);
console.log(
  "   - Optional columns: dob, gender, emergency_number_one, emergency_number_two, tariff_id, advance"
);
console.log("   - 4 example rows with sample data");
