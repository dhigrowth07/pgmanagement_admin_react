import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Typography, Row, Col, Space } from 'antd';
import { BellPlus } from 'lucide-react';
import {
    fetchAllAlerts, sendAlert, selectAllAlerts, selectAlertsStatus
} from '../../../redux/alerts/alertsSlice';
import {
    fetchAllCustomers, selectAllCustomers
} from '../../../redux/customer/customerSlice';
import AlertsTable from './AlertsTable';
import SendAlertModal from './SendAlertModal';

const { Title } = Typography;

const AlertsPage = () => {
    const dispatch = useDispatch();
    const alerts = useSelector(selectAllAlerts);
    const customers = useSelector(selectAllCustomers);
    const status = useSelector(selectAlertsStatus);

    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        dispatch(fetchAllAlerts());
        if (customers.length === 0) {
            dispatch(fetchAllCustomers());
        }
    }, [dispatch, customers.length]);

    const handleSendAlert = (values) => {
        dispatch(sendAlert(values));
        setIsModalVisible(false);
    };

    return (
        <Card bordered={false}>
            <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                    <Title level={4} className="pt-0 md:text-left text-center">Recent Alerts & Notifications</Title>
                </Col>
                <Col xs={24} sm={12} className="md:text-right text-center">
                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<BellPlus size={16} />}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Send New Alert
                        </Button>
                    </Space>
                </Col>
            </Row>

            <AlertsTable alerts={alerts} loading={status === 'loading'} />

            <SendAlertModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleSendAlert}
                loading={status === 'loading'}
                customers={customers}
                submissionSuccess={status === 'success'}
            />
        </Card>
    );
};

export default AlertsPage;
