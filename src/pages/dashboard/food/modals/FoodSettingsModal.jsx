import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, TimePicker, Divider, Button, Space, message, Spin, Typography } from "antd";
import { Settings, Save, Clock, IndianRupee, Info, Trash, Plus } from "lucide-react";
import dayjs from "dayjs";
import foodService from "../../../../services/foodService";

const { Text, Title } = Typography;

const FoodSettingsModal = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchSettings();
        }
    }, [visible]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [configResp, pricingResp] = await Promise.all([
                foodService.getConfig(),
                foodService.getPricing()
            ]);

            // Backend returns an array of { config_key, config_value }
            const configArray = configResp.data.data || [];
            const config = configArray.reduce((acc, curr) => {
                acc[curr.config_key] = curr.config_value;
                return acc;
            }, {});

            const pricing = (pricingResp.data.data || []).map(item => ({
                ...item,
                price_per_meal: parseFloat(item.price) || 0
            }));

            // Convert hour/minute to dayjs for TimePicker
            const deadline = dayjs()
                .hour(parseInt(config.poll_deadline_hour) || 22)
                .minute(parseInt(config.poll_deadline_minute) || 0)
                .second(0);

            form.setFieldsValue({
                deadline,
                minimum_meal_price: parseInt(config.minimum_meal_price),
                pricing_tiers: pricing
            });
        } catch (error) {
            console.error("Error fetching food settings:", error);
            message.error("Failed to load food settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const deadline = values.deadline;
            const configData = {
                poll_deadline_hour: deadline.hour(),
                poll_deadline_minute: deadline.minute(),
                minimum_meal_price: values.minimum_meal_price
            };

            // Update Config and Pricing Table
            console.log("Saving Food Settings:", { configData, pricing_tiers: values.pricing_tiers });
            await Promise.all([
                foodService.updateConfig(configData),
                foodService.updatePricing(values.pricing_tiers)
            ]);

            message.success("Food settings updated successfully");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving food settings:", error);
            message.error(error.response?.data?.msg || "Failed to save food settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-blue-600">
                    <Settings size={20} />
                    <span className="font-bold">Food Management Settings</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
            className="rounded-2xl overflow-hidden"
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Spin size="large" />
                    <Text className="text-gray-400">Loading configurations...</Text>
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    onFinishFailed={(errorInfo) => {
                        console.error("Form Validation Failed:", errorInfo);
                        message.error("Please check the form for errors before saving.");
                    }}
                    initialValues={{ pricing_tiers: [] }}
                >
                    <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 flex gap-3">
                        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <Text className="text-blue-700 text-xs leading-relaxed">
                            These settings control the daily meal polling deadline and tiered pricing for residents.
                            Changes will reflect in real-time on the resident mobile app.
                        </Text>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Form.Item
                            name="deadline"
                            label={<span className="font-bold flex items-center gap-2"><Clock size={14} className="text-gray-400" /> Poll Deadline</span>}
                            rules={[{ required: true, message: 'Please select a deadline' }]}
                            extra="Time after which residents cannot change their meal preferences for the next day."
                        >
                            <TimePicker
                                format="hh:mm A"
                                className="w-full h-11 rounded-lg border-gray-200"
                                minuteStep={15}
                                use12Hours
                                allowClear={false}
                            />
                        </Form.Item>

                        <Form.Item
                            name="minimum_meal_price"
                            label={<span className="font-bold flex items-center gap-2"><IndianRupee size={14} className="text-gray-400" /> Base Monthly Price</span>}
                            rules={[{ required: true, message: 'Please enter base price' }]}
                            extra="Fixed monthly price if tiers are not matched."
                        >
                            <InputNumber
                                className="w-full h-11 rounded-lg border-gray-200 flex items-center"
                                prefix="₹"
                                min={0}
                            />
                        </Form.Item>
                    </div>

                    <Divider className="my-4"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiered Pricing Strategy</span></Divider>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <Text className="text-[11px] text-gray-400 uppercase font-black">Pricing Table</Text>
                        </div>

                        {/* Header Row */}
                        <div className="flex gap-2 px-3 py-1.5 bg-gray-100 rounded-t-lg border-x border-t border-gray-200">
                            <Text className="flex-1 text-[9px] uppercase font-bold text-gray-500">Min. Meal Count</Text>
                            <div className="w-4 text-center text-gray-400"></div>
                            <Text className="flex-1 text-[9px] uppercase font-bold text-gray-500">Price Per Meal</Text>
                            <div className="w-10 text-center text-[9px] uppercase font-bold text-gray-500">Del</div>
                        </div>

                        <Form.List name="pricing_tiers">
                            {(fields, { add, remove }) => (
                                <div className="border border-gray-200 rounded-b-lg overflow-hidden divide-y divide-gray-100 bg-white">
                                    {fields.length === 0 && (
                                        <div className="p-6 text-center bg-gray-50/50">
                                            <Text className="text-gray-400 text-xs italic">No pricing tiers defined.</Text>
                                        </div>
                                    )}
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="flex items-center gap-2 py-1 px-3 hover:bg-blue-50/20 transition-colors group">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'meal_count']}
                                                className="mb-0 flex-1"
                                                rules={[{ required: true, message: '' }]}
                                            >
                                                <InputNumber
                                                    placeholder="Count"
                                                    className="w-full h-8 rounded border-gray-200"
                                                    min={1}
                                                />
                                            </Form.Item>


                                            <Form.Item
                                                {...restField}
                                                name={[name, 'price_per_meal']}
                                                className="mb-0 flex-1"
                                                rules={[{ required: true, message: '' }]}
                                            >
                                                <InputNumber
                                                    placeholder="Price"
                                                    className="w-full h-8 rounded border-gray-200"
                                                    prefix="₹"
                                                    min={0}
                                                />
                                            </Form.Item>

                                            <div className="w-10 flex justify-center items-center">
                                                <Button
                                                    danger
                                                    type="text"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        remove(name);
                                                    }}
                                                    className="hover:bg-rose-100 flex items-center justify-center p-0 w-8 h-8 rounded-full border-none shadow-none opacity-40 hover:opacity-100 group-hover:opacity-100 transition-all pointer-events-auto cursor-pointer"
                                                    icon={<Trash size={16} className="text-rose-600" />}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-2 bg-gray-50/30">
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            size="small"
                                            className="h-8 rounded border-gray-200 font-bold text-[11px] text-gray-400 hover:text-blue-500 hover:border-blue-300 flex items-center justify-center gap-1.5"
                                        >
                                            <Plus size={14} /> Add Tier
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form.List>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button
                            onClick={onCancel}
                            className="h-11 rounded-lg px-6 font-bold text-gray-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            onClick={() => console.log("--- SAVE BUTTON PHYSICALLY CLICKED ---")}
                            icon={<Save size={18} />}
                            className="bg-blue-600 hover:!bg-blue-700 h-11 px-8 rounded-lg font-bold border-none"
                        >
                            Save Settings
                        </Button>
                    </div>
                </Form>
            )}
        </Modal>
    );
};

export default FoodSettingsModal;
