import React, { useEffect } from "react";
import { Form, Input, InputNumber, TimePicker, Button, Card, Row, Col, Alert, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchAttendanceConfig, 
  saveAttendanceConfig, 
  selectAttendanceConfig, 
  selectAttendanceStatus 
} from "../../../redux/attendance/attendanceSlice";
import dayjs from "dayjs";
import { Save, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import MapPicker from "../../../components/shared/MapPicker";

const AttendanceConfig = () => {
  const dispatch = useDispatch();
  const config = useSelector(selectAttendanceConfig);
  const status = useSelector(selectAttendanceStatus);
  const loading = status === "loading";
  const [gettingLocation, setGettingLocation] = React.useState(false);
  const [mapPosition, setMapPosition] = React.useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAttendanceConfig());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        ...config,
        attendance_window_start: config.attendance_window_start ? dayjs(config.attendance_window_start, "HH:mm:ss") : null,
        attendance_window_end: config.attendance_window_end ? dayjs(config.attendance_window_end, "HH:mm:ss") : null,
        missed_marking_time: config.missed_marking_time ? dayjs(config.missed_marking_time, "HH:mm:ss") : null,
      });

      if (config.pg_latitude && config.pg_longitude) {
        setMapPosition({
          lat: parseFloat(config.pg_latitude),
          lng: parseFloat(config.pg_longitude)
        });
      }
    }
  }, [config, form]);

  const onFinish = (values) => {
    const payload = {
      ...values,
      attendance_window_start: values.attendance_window_start.format("HH:mm:ss"),
      attendance_window_end: values.attendance_window_end.format("HH:mm:ss"),
      missed_marking_time: values.missed_marking_time.format("HH:mm:ss"),
    };
    dispatch(saveAttendanceConfig(payload));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);

    console.log("navigator.geolocation", navigator.geolocation);

    const onSuccess = (position) => {
      // Check for poor accuracy (> 200m)
      if (position.coords.accuracy > 200) {
        toast.error(`Location accuracy is too low (${Math.round(position.coords.accuracy)}m). Please move outdoors or enable GPS.`);
        setGettingLocation(false);
        return;
      }

      form.setFieldsValue({
        pg_latitude: Number(position.coords.latitude.toFixed(8)),
        pg_longitude: Number(position.coords.longitude.toFixed(8)),
      });
      setMapPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      console.log("position.coords", position.coords);
      toast.success(`Location fetched successfully (Accuracy: ${Math.round(position.coords.accuracy)}m)`);
      setGettingLocation(false);
    };

    const onErrorHighAccuracy = (error) => {
      console.warn("High accuracy location failed, trying low accuracy...", error);
      
      // Fallback to low accuracy which is faster and more reliable indoors (wifi/cell based)
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (finalError) => {
           console.error("Error getting location:", finalError);
           let errorMsg = "Unable to retrieve your location";
           if (finalError.code === 1) errorMsg = "Location permission denied";
           else if (finalError.code === 2) errorMsg = "Location unavailable";
           else if (finalError.code === 3) errorMsg = "Location request timed out. Please try again.";
           
           toast.error(errorMsg);
           setGettingLocation(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 0
        }
      );
    };

    // First attempt: High Accuracy
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onErrorHighAccuracy,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };



  const handleMapLocationChange = (latlng) => {
    const { lat, lng } = latlng;
    setMapPosition({ lat, lng });
    form.setFieldsValue({
      pg_latitude: Number(lat.toFixed(8)),
      pg_longitude: Number(lng.toFixed(8)),
    });
  };

  if (loading && !config) {
    return <div className="flex justify-center p-8"><Spin size="large" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Alert
        message="Important Configuration"
        description="These settings control how and when users can mark their attendance. Ensure the coordinates are accurate."
        type="info"
        showIcon
        className="mb-6"
        style={{marginBottom: "1rem"}}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          allowed_radius_meters: 200,
        }}
      >
        <Card 
          title="PG Location Settings" 
          className="mb-6 shadow-sm"
          style={{marginBottom: "1rem"}}
          extra={
            <Button 
              type="default" 
              onClick={handleGetCurrentLocation}
              loading={gettingLocation}
              icon={<MapPin size={16} />}
              className="flex items-center gap-1 text-blue-600 border-blue-600 hover:text-blue-700 hover:border-blue-700"
            >
              Get Live Location
            </Button>
          }
        >
          <div className="mb-6 border rounded-lg overflow-hidden">
             <MapPicker initialPosition={mapPosition} onLocationChange={handleMapLocationChange} />
             <div className="p-2 bg-gray-50 text-xs text-center text-gray-500">
               Click anywhere on the map to pin-point exact location
             </div>
          </div>

          <Row gutter={16}>
             <Col span={24}>
              <Form.Item
                name="pg_address"
                label="Approximate Address (From Map)"
                help="This is auto-filled from the map selection."
              >
                <Input readOnly className="bg-gray-50 text-gray-600" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="pg_latitude"
                label="PG Latitude"
                rules={[
                  { required: true, message: "Please enter latitude" },
                  {
                    validator: (_, value) => {
                      if (value === null || value === undefined || value === '') {
                        return Promise.reject(new Error('Please enter latitude'));
                      }
                      const num = Number(value);
                      if (isNaN(num)) {
                        return Promise.reject(new Error('Latitude must be a valid number'));
                      }
                      if (num < -90 || num > 90) {
                        return Promise.reject(new Error('Latitude must be between -90 and 90'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                help="Example: 12.9716"
              >
                <InputNumber style={{ width: "100%" }} step="0.000001" precision={8} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="pg_longitude"
                label="PG Longitude"
                rules={[
                  { required: true, message: "Please enter longitude" },
                  {
                    validator: (_, value) => {
                      if (value === null || value === undefined || value === '') {
                        return Promise.reject(new Error('Please enter longitude'));
                      }
                      const num = Number(value);
                      if (isNaN(num)) {
                        return Promise.reject(new Error('Longitude must be a valid number'));
                      }
                      if (num < -180 || num > 180) {
                        return Promise.reject(new Error('Longitude must be between -180 and 180'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                help="Example: 77.5946"
              >
                <InputNumber style={{ width: "100%" }} step="0.000001" precision={8} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="allowed_radius_meters"
                label="Allowed Radius (Meters)"
                rules={[{ required: true, message: "Please enter radius" }]}
                help="Users must be within this distance to mark attendance."
              >
                <InputNumber style={{ width: "100%" }} min={10} max={1000} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Time Window Settings" className="mb-6 shadow-sm">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="attendance_window_start"
                label="Window Start Time"
                rules={[{ required: true, message: "Start time is required" }]}
              >
                <TimePicker format="h:mm:ss a" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="attendance_window_end"
                label="Window End Time"
                rules={[{ required: true, message: "End time is required" }]}
              >
                <TimePicker format="h:mm:ss a" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="missed_marking_time"
                label="Auto-Mark Missed Time"
                rules={[{ required: true, message: "Missed marking time is required" }]}
                help="Time when system marks 'MISSED' for users."
              >
                <TimePicker format="h:mm:ss a" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className="flex justify-end"             style={{marginTop: "1rem"}}
>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<Save size={16} />} 
            loading={loading}
            size="large"
          >
            Save Configuration
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AttendanceConfig;
