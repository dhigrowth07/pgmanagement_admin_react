import React from "react";
import { Modal } from "antd";

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 * @param {string} [props.title]
 * @param {string} [props.content]
 * @param {string} [props.okText]
 */
const DeleteConfirmModal = ({ visible, onCancel, onConfirm, title, content, okText = "Delete" }) => {
  return (
    <Modal
      centered
      title={title || "Confirm Delete"}
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
      }}
    >
      <p>{content || "Are you sure you want to delete this item? This action cannot be undone."}</p>
    </Modal>
  );
};

export default DeleteConfirmModal;
