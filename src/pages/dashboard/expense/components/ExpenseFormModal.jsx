import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, Space, Upload, message, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const ExpenseFormModal = ({ visible, onCancel, onSubmit, loading, expense, categories }) => {
  const [form] = Form.useForm();
  const [receiptFileList, setReceiptFileList] = useState([]);
  const isEditMode = !!expense;

  useEffect(() => {
    if (visible) {
      if (expense) {
        // Convert amount_cents to amount for display
        const amount = expense.amount_cents ? expense.amount_cents / 100 : 0;
        form.setFieldsValue({
          title: expense.title,
          category_id: expense.category_id,
          amount: amount,
          date: expense.date ? dayjs(expense.date) : dayjs(),
          notes: expense.notes || "",
        });
        // Initialize receipt file list if existing receipt exists
        if (expense.receipt_url) {
          setReceiptFileList([
            {
              uid: "existing-receipt",
              name: expense.receipt_url.split("/").pop() || "receipt",
              status: "done",
              url: expense.receipt_url,
              isExisting: true,
            },
          ]);
        } else {
          setReceiptFileList([]);
        }
      } else {
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
        });
        setReceiptFileList([]);
      }
    } else {
      setReceiptFileList([]);
    }
  }, [visible, expense, form]);

  const validateReceiptFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"];
    const isValidType = allowedTypes.includes(file.type);
    if (!isValidType) {
      message.error(`${file.name} is not a valid file type. Please upload only JPEG, PNG, GIF, WebP, or PDF files.`);
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error("Receipt file size must be less than 10MB");
      return false;
    }
    return true;
  };

  const handleSubmit = (values) => {
    const formData = new FormData();

    // Add form fields
    formData.append("title", values.title?.trim() || "");
    formData.append("category_id", values.category_id);
    formData.append("amount_cents", Math.round((values.amount || 0) * 100));
    formData.append("currency", "INR"); // Always set to INR
    formData.append("date", values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"));
    if (values.notes) {
      formData.append("notes", values.notes.trim());
    }

    // Handle receipt file upload
    if (receiptFileList.length > 0) {
      const receiptFile = receiptFileList[0];
      if (receiptFile.originFileObj && !receiptFile.isExisting) {
        // New file upload
        formData.append("receipt", receiptFile.originFileObj);
      } else if (receiptFile.isExisting && receiptFile.url) {
        // Preserve existing receipt
        formData.append("existing_receipt_url", receiptFile.url);
      }
    }

    onSubmit(formData);
  };

  return (
    <Modal centered title={isEditMode ? "Edit Expense" : "Create Expense"} open={visible} onCancel={onCancel} footer={null} maskClosable={!loading} closable={!loading} width={600}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: "Please enter expense title" },
            { min: 3, message: "Title must be at least 3 characters" },
            { max: 256, message: "Title cannot exceed 256 characters" },
          ]}
        >
          <Input placeholder="Enter expense title" disabled={loading} />
        </Form.Item>

        <Form.Item name="category_id" label="Category" rules={[{ required: true, message: "Please select a category" }]}>
          <Select
            placeholder={categories.length === 0 ? "No categories available" : "Select category"}
            disabled={loading || categories.length === 0}
            showSearch
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id} label={cat.name}>
                <Space>
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
        {categories.length === 0 && (
          <div style={{ marginBottom: 16, padding: 8, background: "#fff7e6", borderRadius: 4, color: "#d46b08" }}>No categories available. Please create a category first.</div>
        )}

        <Form.Item
          name="amount"
          label="Amount"
          rules={[
            { required: true, message: "Please enter amount" },
            { type: "number", min: 0.01, message: "Amount must be greater than 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0.01}
            step={0.01}
            precision={2}
            placeholder="Enter amount"
            disabled={loading}
            formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please select date" }]}
          getValueFromEvent={(date) => date}
          getValueProps={(date) => ({ value: date ? dayjs(date) : null })}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            disabledDate={(current) => {
              if (!current) return false;
              const now = dayjs();
              const diffDays = Math.abs(current.diff(now, "days"));
              return diffDays > 365;
            }}
            disabled={loading}
          />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Enter notes (optional)" disabled={loading} maxLength={1000} showCount />
        </Form.Item>

        <Form.Item
          label="Receipt (Optional)"
          rules={[
            {
              validator: () => {
                if (receiptFileList.length > 1) {
                  return Promise.reject(new Error("Please upload only one receipt file"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Upload
            fileList={receiptFileList}
            beforeUpload={(file) => {
              if (!validateReceiptFile(file)) {
                return Upload.LIST_IGNORE;
              }
              const fileWithProps = {
                uid: file.uid || `${file.name}-${Date.now()}`,
                name: file.name || "unknown-file",
                status: "done",
                originFileObj: file,
                isExisting: false,
              };
              setReceiptFileList([fileWithProps]);
              return false; // Prevent auto upload
            }}
            onRemove={() => {
              setReceiptFileList([]);
              return true;
            }}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
            listType="picture-card"
            maxCount={1}
            disabled={loading}
            itemRender={(originNode, file) => {
              if (file.isExisting && file.url) {
                const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                const isPDF = file.url.match(/\.pdf$/i);
                return (
                  <div>
                    {isImage ? (
                      <Image src={file.url} alt="Receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} preview />
                    ) : isPDF ? (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
                        <div style={{ fontSize: "12px" }}>PDF Receipt</div>
                      </div>
                    ) : (
                      originNode
                    )}
                  </div>
                );
              }
              return originNode;
            }}
          >
            {receiptFileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload Receipt</div>
              </div>
            )}
          </Upload>
          <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Supported formats: JPEG, PNG, GIF, WebP, PDF (Max 10MB)</div>
        </Form.Item>

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Space>
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? "Update" : "Create"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseFormModal;
