import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Space, Spin, Alert, Image } from "antd";
import { ReloadOutlined, DownloadOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectUser } from "../../../redux/auth/authSlice";
import api from "../../../services/api";
import toast from "react-hot-toast";

const { Title, Text } = Typography;

const QRCodePage = () => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [adminQRCode, setAdminQRCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminId = localStorage.getItem("admin_id");

      if (!adminId) {
        setError("Admin ID not found. Please ensure you are logged in as an admin.");
        setLoading(false);
        return;
      }

      // Fetch admin QR code
      try {
        const adminResponse = await api.get(`/api/v1/tenant-admins/${adminId}/qr-code`);
        if (adminResponse.data?.data?.qr_code_url) {
          setAdminQRCode(adminResponse.data.data);
        }
      } catch (adminError) {
        if (adminError.response?.status === 404) {
          setError("QR code not generated yet. Click 'Regenerate' to create one.");
        } else {
          setError(adminError.response?.data?.msg || "Failed to fetch QR code");
          console.error("Error fetching admin QR code:", adminError);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Failed to fetch QR code");
      console.error("Error fetching QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAdminQRCode = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const adminId = localStorage.getItem("admin_id");
      if (!adminId) {
        toast.error("Admin ID not found");
        return;
      }

      const response = await api.post(`/api/v1/tenant-admins/${adminId}/regenerate-qr-code`);
      if (response.data?.data?.qr_code_url) {
        setAdminQRCode(response.data.data);
        toast.success("QR code regenerated successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to regenerate QR code");
      console.error("Error regenerating QR code:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const downloadQRCode = async (adminId, filename) => {
    try {
      toast.loading("Downloading QR code...", { id: "download-toast" });

      // Use backend proxy endpoint to bypass CORS
      const response = await api.get(`/api/v1/tenant-admins/${adminId}/qr-code/download`, {
        responseType: "blob", // Important: tell axios to handle as blob
      });

      // Check if response is actually a blob (successful download)
      if (response.data instanceof Blob) {
        // Create a blob URL from the response
        const blobUrl = window.URL.createObjectURL(response.data);

        // Create a temporary anchor element and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename || "qr-code.png";
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        toast.success("QR code downloaded successfully!", { id: "download-toast" });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error downloading QR code:", err);

      // Handle blob error responses (when backend returns error as JSON but axios treats it as blob)
      let errorMessage = "Failed to download QR code";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.msg || errorMessage;
        } catch (parseError) {
          // If parsing fails, use default message
        }
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { id: "download-toast" });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <QrcodeOutlined style={{ marginRight: 8 }} />
        Onboarding QR Code
      </Title>

      {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 24 }} />}

      <Card
        title="Your Onboarding QR Code"
        extra={
          <Space>
            {adminQRCode && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const adminId = localStorage.getItem("admin_id");
                  if (adminId) {
                    downloadQRCode(adminId, `qr-code-${adminQRCode.admin_id || adminId}.png`);
                  } else {
                    toast.error("Admin ID not found");
                  }
                }}
              >
                Download
              </Button>
            )}
            {/* <Button icon={<ReloadOutlined />} loading={regenerating} onClick={regenerateAdminQRCode}>
              Regenerate
            </Button> */}
          </Space>
        }
        style={{ maxWidth: 600, margin: "0 auto" }}
      >
        {adminQRCode ? (
          <div style={{ textAlign: "center" }}>
            <Image src={adminQRCode.qr_code_url} alt="Onboarding QR Code" style={{ maxWidth: "300px", width: "100%", height: "auto", marginBottom: 16 }} preview={false} />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Admin: {adminQRCode.admin_name || adminQRCode.email}
              </Text>
              {adminQRCode.generated_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Generated: {new Date(adminQRCode.generated_at).toLocaleString()}
                </Text>
              )}
            </div>
            <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Scan this QR code to access the onboarding page. The QR code includes both tenant and admin information, ensuring users are onboarded to the correct tenant and admin context.
              </Text>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Text type="secondary">No QR code found. Click "Regenerate" to generate one.</Text>
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>How to Use Your QR Code</Title>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Text strong>Onboarding:</Text> When scanned, this QR code redirects users to the onboarding page with both tenant ID and admin ID pre-filled, ensuring they are onboarded to the correct
            tenant and admin context.
          </li>
          <li>
            <Text strong>Regenerate:</Text> If you need to generate a new QR code (e.g., if the old one is compromised), click the "Regenerate" button. The old QR code will be deleted and a new one
            will be created.
          </li>
          <li>
            <Text strong>Download:</Text> Click the "Download" button to save the QR code image to your device for printing or sharing.
          </li>
          <li>
            <Text strong>Sharing:</Text> You can share this QR code with potential residents. When they scan it, they will be taken directly to the onboarding form with your tenant and admin
            information already configured.
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default QRCodePage;
