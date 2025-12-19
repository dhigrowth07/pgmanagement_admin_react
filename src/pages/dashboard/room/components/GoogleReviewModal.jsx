import React, { useEffect } from "react";
import { Modal, Form, Input, Button } from "antd";

const GoogleReviewModal = ({ visible, onCancel, onSubmit, block, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (block) {
        // Reset and set form values when modal opens with block data
        form.resetFields();
        form.setFieldsValue({ google_review_link: block.google_review_link || "" });
      } else {
        // Reset form if no block data
        form.resetFields();
      }
    }
  }, [block, visible, form]);

  const handleFinish = (values) => {
    if (!loading && block) {
      onSubmit({ blockId: block.block_id, ...values });
    }
  };

  return (
    <Modal open={visible} title={`Google Review Link for ${block?.block_name}`} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ google_review_link: block?.google_review_link || "" }}>
        <Form.Item
          name="google_review_link"
          label="Google Review Link"
          rules={[
            { required: true, message: "Please enter the Google Review link" },
            { type: "url", message: "Please enter a valid URL" },
          ]}
        >
          <Input placeholder="https://g.page/r/..." />
        </Form.Item>
        <Form.Item style={{ textAlign: "right" }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Link
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GoogleReviewModal;
