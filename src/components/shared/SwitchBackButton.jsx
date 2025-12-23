import React from "react";
import { Button } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { switchBack, selectOriginalAdmin } from "../../redux/auth/authSlice";

const SwitchBackButton = () => {
  const dispatch = useDispatch();
  const originalAdmin = useSelector(selectOriginalAdmin);

  const handleSwitchBack = async () => {
    try {
      await dispatch(switchBack()).unwrap();
      // Toast is handled in the thunk
      // Refresh the page to update all components with original admin context
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      // Error toast is handled in the thunk
      console.error("Switch back failed:", error);
    }
  };

  if (!originalAdmin) {
    return null;
  }

  return (
    <Button
      type="default"
      icon={<SwapOutlined />}
      onClick={handleSwitchBack}
      style={{
        backgroundColor: "#52c41a",
        borderColor: "#52c41a",
        color: "white",
      }}
    >
      Switch Back to {originalAdmin.admin_name || "Original Account"}
    </Button>
  );
};

export default SwitchBackButton;

