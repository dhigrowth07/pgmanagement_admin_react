import jsPDF from "jspdf";
import dayjs from "dayjs";

/**
 * Helper function to convert HTML to formatted plain text for PDF
 * Preserves structure like headings, paragraphs, and lists
 * @param {string} html - HTML string
 * @returns {string} - Formatted plain text string with proper line breaks
 */
const htmlToPlainText = (html) => {
  if (!html) return "";

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const result = [];

  // Function to extract text from a node
  const getTextContent = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      return Array.from(node.childNodes)
        .map((child) => getTextContent(child))
        .join("")
        .trim();
    }
    return "";
  };

  // Process all child nodes of the container
  const processElement = (element, skipListItems = false) => {
    if (!element) return;

    Array.from(element.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          result.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName?.toLowerCase();

        // Handle headings
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          const textContent = getTextContent(node).trim();
          if (textContent) {
            if (result.length > 0 && result[result.length - 1] !== "") {
              result.push(""); // Blank line before heading
            }
            result.push(`[HEADING]${textContent}`);
            result.push(""); // Blank line after heading
          }
        }
        // Handle list items
        else if (tagName === "li") {
          const textContent = getTextContent(node).trim();
          if (textContent) {
            const parent = node.parentElement;
            if (parent) {
              const parentTag = parent.tagName?.toLowerCase();
              if (parentTag === "ol") {
                // Numbered list - find index
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(node);
                result.push(`${index + 1}. ${textContent}`);
              } else if (parentTag === "ul") {
                // Bullet list
                result.push(`• ${textContent}`);
              } else {
                result.push(textContent);
              }
            } else {
              result.push(textContent);
            }
          }
        }
        // Handle lists - process children but don't add wrapper text
        else if (["ul", "ol"].includes(tagName)) {
          processElement(node, true); // Process children
        }
        // Handle paragraphs and divs
        else if (["p", "div"].includes(tagName)) {
          const textContent = getTextContent(node).trim();
          if (textContent) {
            if (result.length > 0 && result[result.length - 1] !== "") {
              result.push(""); // Blank line before paragraph
            }
            result.push(textContent);
            result.push(""); // Blank line after paragraph
          }
        }
        // Handle other block elements - recursively process
        else if (["section", "article", "main", "body"].includes(tagName)) {
          processElement(node, skipListItems); // Recursively process
        }
        // Handle inline elements - recursively process to get nested text
        else {
          processElement(node, skipListItems);
        }
      }
    });
  };

  // Process the container
  processElement(tempDiv);

  // Join with newlines and clean up
  let text = result
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
    .trim();

  return text;
};

/**
 * Generates a PDF document for customer registration
 * @param {Object} customerData - Customer form data
 * @param {Object} [options] - Additional options (tenant name, autoDownload, termsAndConditions, signature, etc.)
 * @param {string} [options.tenantName] - Tenant name for PDF header
 * @param {boolean} [options.autoDownload=false] - Whether to automatically download the PDF (default: false)
 * @param {string} [options.termsAndConditions] - HTML or plain text terms and conditions content
 * @param {string} [options.signature] - Base64 data URL of signature image
 * @returns {Object} - Object containing doc, file, fileName, and blob
 */
export const generateCustomerPDF = (customerData, options = {}) => {
  const { autoDownload = false, tenantName, termsAndConditions, signature } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add a section title
  const addSectionTitle = (title, fontSize = 14) => {
    checkPageBreak(15);
    yPosition += 2; // Reduced spacing before section
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPosition);
    yPosition += 6; // Reduced spacing after title
  };

  // Helper function to add a label-value pair
  const addField = (label, value, isBold = false) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const labelWidth = doc.getTextWidth(label + ": ");
    doc.text(label + ":", margin, yPosition);

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const displayValue = value || "N/A";
    // Handle long text by splitting into multiple lines
    const textLines = doc.splitTextToSize(displayValue, maxWidth - labelWidth - margin);
    doc.text(textLines, margin + labelWidth, yPosition);
    yPosition += textLines.length * 6; // Reduced line height from 7 to 6
  };

  // Helper function to render structured terms and conditions
  const renderTermsAndConditions = (text) => {
    if (!text || text.trim() === "") return;

    const lines = text.split("\n");
    const normalFontSize = 9;
    const headingFontSize = 11;
    const normalLineHeight = 5;
    const headingLineHeight = 7;
    const paragraphSpacing = 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(normalFontSize);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines (they represent paragraph breaks)
      if (line === "") {
        yPosition += paragraphSpacing;
        continue;
      }

      // Check if this is a heading
      if (line.startsWith("[HEADING]")) {
        const headingText = line.replace("[HEADING]", "").trim();
        checkPageBreak(headingLineHeight + 5);

        // Add extra space before heading
        if (i > 0 && lines[i - 1]?.trim() !== "") {
          yPosition += 3;
        }

        doc.setFontSize(headingFontSize);
        doc.setFont("helvetica", "bold");

        // Split heading if too long
        const headingLines = doc.splitTextToSize(headingText, maxWidth);
        headingLines.forEach((headingLine) => {
          checkPageBreak(headingLineHeight + 2);
          doc.text(headingLine, margin, yPosition);
          yPosition += headingLineHeight;
        });

        doc.setFontSize(normalFontSize);
        doc.setFont("helvetica", "normal");
        yPosition += 2; // Small space after heading
      } else {
        // Regular text or list item
        checkPageBreak(normalLineHeight + 2);

        // Check if it's a list item (starts with number or bullet)
        const isListItem = /^(\d+\.|•)\s/.test(line);

        if (isListItem) {
          // List item - indent slightly
          const indent = 5;
          const textLines = doc.splitTextToSize(line, maxWidth - indent);
          textLines.forEach((textLine) => {
            checkPageBreak(normalLineHeight + 2);
            doc.text(textLine, margin + indent, yPosition);
            yPosition += normalLineHeight;
          });
        } else {
          // Regular paragraph text
          const textLines = doc.splitTextToSize(line, maxWidth);
          textLines.forEach((textLine) => {
            checkPageBreak(normalLineHeight + 2);
            doc.text(textLine, margin, yPosition);
            yPosition += normalLineHeight;
          });
        }
      }
    }
  };

  // Helper function to add a horizontal line
  const addHorizontalLine = () => {
    checkPageBreak(5);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // ============================================
  // HEADER SECTION
  // ============================================
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Terms and Conditions", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Tenant Name (if available)
  if (tenantName) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Tenant: ${tenantName}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
  }

  // Date of Registration (Human-readable format)
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const registrationDate = dayjs().format("DD MMM YYYY, h:mm A");
  doc.text(`Date: ${registrationDate}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Line separator
  addHorizontalLine();

  // ============================================
  // PERSONAL INFORMATION SECTION
  // ============================================
  addSectionTitle("Personal Information", 14);

  doc.setFontSize(10);
  addField("Full Name", customerData.name);
  addField("Email", customerData.email);
  addField("Phone Number", customerData.phone);

  // Gender
  const gender = customerData.gender ? customerData.gender.charAt(0).toUpperCase() + customerData.gender.slice(1).toLowerCase() : null;
  addField("Gender", gender);

  // Date of Birth
  let dob = "N/A";
  if (customerData.dob) {
    if (typeof customerData.dob === "string") {
      dob = dayjs(customerData.dob).format("DD-MM-YYYY");
    } else if (customerData.dob.format) {
      // dayjs object
      dob = customerData.dob.format("DD-MM-YYYY");
    } else {
      dob = dayjs(customerData.dob).format("DD-MM-YYYY");
    }
  }
  addField("Date of Birth", dob);

  // Add spacing before next section (reduced)
  yPosition += 3;

  // ============================================
  // EMERGENCY CONTACTS SECTION
  // ============================================
  addSectionTitle("Emergency Contacts", 14);

  doc.setFontSize(10);
  addField("Emergency Contact 1", customerData.emergency_number_one);
  addField("Emergency Contact 2", customerData.emergency_number_two);

  // Add spacing before next section (reduced)
  yPosition += 3;

  // ============================================
  // ROOM ASSIGNMENT SECTION
  // ============================================
  addSectionTitle("Room Assignment", 14);

  doc.setFontSize(10);
  addField("Room Number", customerData.room_number);

  // Advance Amount (formatted as currency with proper INR formatting)
  // Using "INR" text for better PDF compatibility (₹ symbol may not render correctly in jsPDF)
  let advanceAmount = "INR 0.00";
  if (customerData.advance_amount !== undefined && customerData.advance_amount !== null && customerData.advance_amount !== "") {
    const amount = parseFloat(customerData.advance_amount);
    if (!isNaN(amount) && amount > 0) {
      // Format with Indian number system (lakhs, crores) - e.g., 1,00,000.00
      const formattedAmount = amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      advanceAmount = `INR ${formattedAmount}`;
    }
  }
  addField("Advance Amount", advanceAmount);

  // Add spacing before next section (reduced)
  yPosition += 3;

  // ============================================
  // ADDITIONAL INFORMATION SECTION
  // ============================================
  addSectionTitle("Additional Information", 14);

  doc.setFontSize(10);

  // ID Proofs count
  let idProofCount = 0;
  if (customerData.id_proofs) {
    if (Array.isArray(customerData.id_proofs)) {
      idProofCount = customerData.id_proofs.length;
    } else if (typeof customerData.id_proofs === "number") {
      idProofCount = customerData.id_proofs;
    }
  }
  addField("ID Proofs", `${idProofCount} document(s) uploaded`);

  // Profile Image status
  const hasProfileImage = customerData.profile_image === true || customerData.profile_image === "true" || (customerData.profile_image && customerData.profile_image.length > 0);
  addField("Profile Image", hasProfileImage ? "Uploaded" : "Not provided");

  // Add spacing before next section (reduced)
  yPosition += 3;

  // ============================================
  // TERMS AND CONDITIONS SECTION
  // ============================================
  if (termsAndConditions) {
    yPosition += 3;

    // Convert HTML to formatted plain text
    const termsText = htmlToPlainText(termsAndConditions);

    if (termsText) {
      // Render structured terms and conditions
      renderTermsAndConditions(termsText);
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Terms and conditions not available.", margin, yPosition);
      yPosition += 7;
    }

    // Add spacing before footer
    yPosition += 10;
  } else {
    // Add spacing before footer if no terms
    yPosition += 10;
  }

  // ============================================
  // SIGNATURE SECTION
  // ============================================
  if (signature) {
    // Add spacing before signature
    yPosition += 15;
    checkPageBreak(50); // Ensure enough space for signature

    // Signature image dimensions - smaller size
    const signatureWidth = 60;
    const signatureHeight = 20; // Smaller height
    const signatureX = pageWidth - signatureWidth - margin; // Right-aligned to right edge with margin

    try {
      // Add signature label first, right-aligned
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const labelText = "Signature:";
      const labelWidth = doc.getTextWidth(labelText);
      const labelX = signatureX + signatureWidth - labelWidth; // Right-aligned label
      doc.text(labelText, labelX, yPosition);

      // Add signature image below the label
      yPosition += 8; // Small space after label
      const signatureY = yPosition;
      doc.addImage(signature, "PNG", signatureX, signatureY, signatureWidth, signatureHeight);

      yPosition += signatureHeight + 10; // Add space after signature section
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
      // If image fails to load, just add text
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Signature image could not be loaded", signatureX, yPosition + 20);
      yPosition += 30;
    }
  }

  // ============================================
  // FOOTER SECTION
  // ============================================
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text("This is a system-generated document.", pageWidth / 2, footerY, { align: "center" });
  doc.text("Generated by PG Management System", pageWidth / 2, footerY + 5, { align: "center" });
  doc.setTextColor(0, 0, 0); // Reset to black

  // ============================================
  // GENERATE FILENAME AND SAVE
  // ============================================
  // Generate filename: Customer_Registration_{Name}_{Timestamp}.pdf
  const customerName = customerData.name ? customerData.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") : "Customer";
  const timestamp = dayjs().format("YYYYMMDD_HHmmss");
  const fileName = `Customer_Registration_${customerName}_${timestamp}.pdf`;

  // Get PDF blob for uploading to backend
  const pdfBlob = doc.output("blob");

  // Create File object from blob for FormData
  const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

  // Save the PDF (download for user) only if autoDownload is true
  if (autoDownload) {
    doc.save(fileName);
  }

  // Return both the doc and the file for backend upload
  return {
    doc,
    file: pdfFile,
    fileName,
    blob: pdfBlob,
  };
};
