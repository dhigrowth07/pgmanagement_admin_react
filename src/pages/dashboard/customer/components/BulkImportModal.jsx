import React, { useState, useMemo, useEffect } from "react";
import { Modal, Upload, Button, Table, Steps, Typography, Alert, Space, Tooltip, Tag, Result, Spin, Collapse } from "antd";
import { InboxOutlined, UserAddOutlined, CheckCircleOutlined, FileExcelOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { isValidEmail, isValidPassword, isValidPhone } from "../../../../utils/validators";
import { useSelector } from "react-redux";
import { selectAllBlocks } from "../../../../redux/room/roomSlice";

const { Dragger } = Upload;
const { Title, Text, Link } = Typography;
const { Panel } = Collapse;

const BulkImportModal = ({ visible, onCancel, onSubmit, loading, apiResult }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fileList, setFileList] = useState([]);
  const blocks = useSelector(selectAllBlocks);

  const REQUIRED_HEADERS = ["name", "email", "password", "phone"];

  const handleFileParse = (file) => {
    setFileList([file]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (json.length < 2) {
        setValidationErrors([{ row: 0, errors: ["File is empty or has no data rows."] }]);
        return;
      }

      const headers = json[0].map((h) => String(h).toLowerCase().trim().replace(/\s+/g, "_"));
      const dataRows = json.slice(1);

      const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setValidationErrors([{ row: 0, errors: [`Missing required columns: ${missingHeaders.join(", ")}`] }]);
        setParsedData([]);
        return;
      }

      const parsed = dataRows.map((row, rowIndex) => {
        const rowData = {};
        headers.forEach((header, colIndex) => {
          let value = row[colIndex];

          if (header === "dob" && value) {
            if (typeof value === "number") {
              const date = new Date((value - 25569) * 86400 * 1000);
              value = date.toISOString().split("T")[0];
            } else {
              value = String(value).trim();
            }
          }

          if (["phone", "emergency_number_one", "emergency_number_two"].includes(header) && value) {
            value = String(value).trim();
          }

          // Trim block_name and room_number
          if (["block_name", "room_number"].includes(header) && value) {
            value = String(value).trim();
          }

          if (header) rowData[header] = value;
        });
        rowData.key = rowIndex;
        return rowData;
      });

      validateData(parsed);
      setParsedData(parsed);
      setCurrentStep(1);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const validateData = (data) => {
    const errors = [];
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Required field validations
      if (!row.name || !String(row.name).trim()) {
        rowErrors.push("Name is required and cannot be empty.");
      }
      if (!row.email || !isValidEmail(row.email)) {
        rowErrors.push("A valid Email is required.");
      }
      if (!row.phone || !isValidPhone(String(row.phone))) {
        rowErrors.push("A valid Phone number (10 digits) is required.");
      }
      if (!row.password || !isValidPassword(String(row.password))) {
        rowErrors.push("Password must be at least 6 characters.");
      }
      
      // Date validation
      if (row.dob && isNaN(Date.parse(row.dob))) {
        rowErrors.push("DOB must be a valid date (YYYY-MM-DD format).");
      }
      
      // Block and Room validation - Best Practice: Both must be provided together
      const hasBlockName = row.block_name && String(row.block_name).trim();
      const hasRoomNumber = row.room_number && String(row.room_number).trim();
      
      if (hasRoomNumber && !hasBlockName) {
        rowErrors.push("block_name is required when room_number is provided.");
      }
      if (hasBlockName && !hasRoomNumber) {
        rowErrors.push("room_number is required when block_name is provided.");
      }
      
      // Optional: Validate block_name exists in system (if blocks are loaded)
      if (hasBlockName && blocks && blocks.length > 0) {
        const blockExists = blocks.some(
          (b) => b.block_name && b.block_name.toLowerCase().trim() === String(row.block_name).toLowerCase().trim()
        );
        if (!blockExists) {
          rowErrors.push(`Block "${row.block_name}" not found in system. Available blocks: ${blocks.map(b => b.block_name).join(", ")}`);
        }
      }

      if (rowErrors.length > 0) errors.push({ row: index, errors: rowErrors });
    });
    setValidationErrors(errors);
  };

  const validRecords = useMemo(() => {
    const errorRows = validationErrors.map((e) => e.row);
    return parsedData.filter((_, index) => !errorRows.includes(index));
  }, [parsedData, validationErrors]);

  const handleImport = () => {
    // Clean up the data: remove empty strings for optional fields, keep block_name and room_number
    const recordsToSubmit = validRecords.map(({ key, ...rest }) => {
      const cleaned = { ...rest };
      // Convert empty strings to undefined for optional fields (except block_name and room_number which need to be sent)
      Object.keys(cleaned).forEach((k) => {
        if (cleaned[k] === '' && !['block_name', 'room_number'].includes(k)) {
          delete cleaned[k];
        }
      });
      // Debug: Log block_name and room_number if present
      if (cleaned.block_name || cleaned.room_number) {
        console.log(`[Bulk Import] Sending user ${cleaned.email}: block_name="${cleaned.block_name}", room_number="${cleaned.room_number}"`);
      }
      return cleaned;
    });
    onSubmit(recordsToSubmit);
    setCurrentStep(2);
  };

  const resetState = () => {
    setCurrentStep(0);
    setParsedData([]);
    setValidationErrors([]);
    setFileList([]);
  };

  const handleModalCancel = () => {
    resetState();
    onCancel();
  };

  const columns = [
    { title: "Row", dataIndex: "key", key: "key", render: (text) => text + 2 },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Password", dataIndex: "password", key: "password" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Block Name", dataIndex: "block_name", key: "block_name" },
    { title: "Room Number", dataIndex: "room_number", key: "room_number" },
    { title: "DOB", dataIndex: "dob", key: "dob" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Emergency 1", dataIndex: "emergency_number_one", key: "emergency_number_one" },
    { title: "Emergency 2", dataIndex: "emergency_number_two", key: "emergency_number_two" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const error = validationErrors.find((e) => e.row === record.key);
        if (error) {
          return (
            <Tooltip title={error.errors.join(" ")}>
              <Tag color="red">Invalid</Tag>
            </Tooltip>
          );
        }
        return <Tag color="green">Valid</Tag>;
      },
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Alert
              message="Instructions"
              description={
                <>
                  Download the template, fill in the customer data, and upload the file. <br />
                  <strong>Required columns:</strong> name, email, password, phone <br />
                  <strong>Optional columns:</strong> block_name, room_number (both must be provided together), 
                  dob, gender, emergency_number_one, emergency_number_two, tariff_id, advance <br />
                  <strong>Note:</strong> Use block_name + room_number to assign users to rooms. 
                  If you provide room_id, it will be used instead of block_name + room_number. <br />
                  <Link href="/bulk_import_template.xlsx" target="_blank">
                    Download Template
                  </Link>
                </>
              }
              type="info"
              showIcon
              className="mb-4"
              style={{ marginBottom: "10px" }}
            />
            {blocks && blocks.length > 0 && (
              <Collapse className="mb-4" ghost>
                <Panel 
                  header={
                    <Space>
                      <InfoCircleOutlined />
                      <Text strong>Available Blocks ({blocks.length})</Text>
                    </Space>
                  } 
                  key="blocks"
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {blocks.map((block) => (
                      <Tag key={block.block_id} color="blue">
                        {block.block_name}
                      </Tag>
                    ))}
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
                    Use these exact block names in your Excel file for successful room assignment.
                  </Text>
                </Panel>
              </Collapse>
            )}
            <Dragger name="file" multiple={false} beforeUpload={handleFileParse} onRemove={() => setFileList([])} fileList={fileList} accept=".xlsx">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag XLSX file to this area to upload</p>
              <p className="ant-upload-hint">Strictly follow the template format for a successful import.</p>
            </Dragger>
          </>
        );
      case 1:
        return (
          <>
            <Alert
              message={`Validation Complete: ${validRecords.length} valid records, ${validationErrors.length} invalid records found.`}
              type={validationErrors.length > 0 ? "warning" : "success"}
              showIcon
              style={{ marginBottom: "10px" }}
            />
            <Table
              columns={columns}
              dataSource={parsedData}
              pagination={{ pageSize: 5 }}
              size="small"
              rowClassName={(record) => (validationErrors.some((e) => e.row === record.key) ? "bg-red-50" : "")}
              scroll={{ x: "max-content" }}
            />
          </>
        );
      case 2:
        return loading ? (
          <Result icon={<Spin size="large" />} title="Importing..." subTitle="Please wait while we process your records." />
        ) : (
          <Result
            status={apiResult?.failed?.length > 0 ? "warning" : "success"}
            title="Import Complete"
            subTitle={`Successfully imported: ${apiResult?.successful?.length || 0}. Failed: ${apiResult?.failed?.length || 0}.`}
          >
            {apiResult?.failed?.length > 0 && (
              <div className="text-left mt-4 p-4 bg-gray-100 rounded">
                <Title level={5}>Failed Records</Title>
                <ul>
                  {apiResult.failed.map((item, index) => (
                    <li key={index}>
                      <Text strong>{item.user?.email}:</Text> <Text type="danger">{item.error}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Result>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        return [
          <Button key="cancel" onClick={handleModalCancel}>
            Cancel
          </Button>,
        ];
      case 1:
        return [
          <Button key="back" style={{ margin: 5 }} onClick={() => setCurrentStep(0)}>
            Upload a different file
          </Button>,
          <Button key="import" style={{ margin: 5 }} type="primary" onClick={handleImport} disabled={validRecords.length === 0} loading={loading}>
            Import {validRecords.length} Valid Records
          </Button>,
        ];
      case 2:
        return [
          <Button key="finish" type="primary" onClick={handleModalCancel}>
            Finish
          </Button>,
          <Button key="another" onClick={resetState}>
            Import Another File
          </Button>,
        ];
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          Bulk Import Customers
        </Space>
      }
      open={visible}
      onCancel={handleModalCancel}
      footer={renderFooter()}
      width={1000}
      maskClosable={false}
    >
      <Steps current={currentStep} className="my-6">
        <Steps.Step title="Upload File" icon={<FileExcelOutlined />} />
        <Steps.Step title="Validate & Preview" icon={<CheckCircleOutlined />} />
        <Steps.Step title="Results" icon={<ExclamationCircleOutlined />} />
      </Steps>
      <div className="mt-6">{renderStepContent()}</div>
    </Modal>
  );
};

export default BulkImportModal;
