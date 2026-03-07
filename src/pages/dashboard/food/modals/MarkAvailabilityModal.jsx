import React, { useState } from "react";
import { Modal, Form, DatePicker, Checkbox, Row, Col, Button, message } from "antd";
import foodService from "../../../../services/foodService";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {() => void} props.onSuccess
 */
const MarkAvailabilityModal = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    /** @param {any} values */
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formattedData = {
                ...values,
                date: values.date.format("YYYY-MM-DD"),
            };
            await foodService.markAvailability(formattedData);
            message.success("Food availability marked successfully!");
            onSuccess();
        } catch (error) {
            console.error(error);
            message.error("Failed to mark availability");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Mark Food Availability"
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
                    className="bg-blue-600 hover:!bg-blue-700 border-none"
                >
                    Update Availability
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: "Please select a date" }]}
                >
                    <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item label="Available Meals" name="meals">
                    <Checkbox.Group className="w-full">
                        <Row>
                            <Col span={8}>
                                <Checkbox value="breakfast">Breakfast</Checkbox>
                            </Col>
                            <Col span={8}>
                                <Checkbox value="lunch">Lunch</Checkbox>
                            </Col>
                            <Col span={8}>
                                <Checkbox value="dinner">Dinner</Checkbox>
                            </Col>
                        </Row>
                    </Checkbox.Group>
                </Form.Item>

                <Form.Item label="Special Notes" name="notes">
                    <Checkbox.Group className="w-full flex flex-col gap-2">
                        <Checkbox value="veg_only">Vegetarian Only Today</Checkbox>
                        <Checkbox value="special_menu">Special Occasion Menu</Checkbox>
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MarkAvailabilityModal;
