import React, { useState } from "react";
import { Modal, Form, DatePicker, message, Button, Alert } from "antd";
import foodService from "../../../../services/foodService";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {() => void} props.onSuccess
 */
const GenerateFoodReportModal = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    /** @param {any} values */
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { range } = values;
            const startDate = range[0].format("YYYY-MM-DD");
            const endDate = range[1].format("YYYY-MM-DD");

            // Fetch the weekly summary data
            const resp = await foodService.getWeeklySummary(startDate, endDate);
            const reportData = resp.data.data || [];

            if (reportData.length === 0) {
                message.warning("No data found for the selected range.");
                return;
            }

            // Map data for Excel export
            const exportData = reportData.map(row => ({
                Date: dayjs(row.date || row.poll_date).format("YYYY-MM-DD"),
                Day: dayjs(row.date || row.poll_date).format("dddd"),
                Breakfast: row.breakfast_count || 0,
                Lunch: row.lunch_count || 0,
                Dinner: row.dinner_count || 0,
                "Total Respondents": row.total_users || 0,
                "Total Meals": row.total_meals || 0
            }));

            // Create and download Excel file
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Food Report Summary");

            // Set column widths
            const wscols = [
                { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 15 }
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Food_Report_${startDate}_to_${endDate}.xlsx`);

            message.success(`Food report downloaded for period ${startDate} to ${endDate}`);
            onSuccess();
        } catch (error) {
            console.error("Report Generation Error:", error);
            message.error("Failed to generate and download report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Generate Food Report"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                    className="bg-gray-700 hover:!bg-gray-800 border-none px-6"
                >
                    Download Excel Report
                </Button>,
            ]}
        >
            <Alert
                message="Export Detailed Food Analytics"
                description="Select a date range to generate a comprehensive food preference and billing report as an Excel file."
                type="info"
                showIcon
                className="mb-6 rounded-lg"
            />
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Report Period"
                    name="range"
                    rules={[{ required: true, message: "Please select a date range" }]}
                >
                    <RangePicker className="w-full h-11 rounded-lg border-gray-200" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default GenerateFoodReportModal;
