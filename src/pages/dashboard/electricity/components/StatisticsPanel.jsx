import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const StatCard = ({ title, value, precision = 0, prefix }) => (
  <Card size="small"><Statistic title={title} value={value} precision={precision} prefix={prefix} /></Card>
);

const StatisticsPanel = ({ statistics = {}, loading }) => {
  const s = statistics || {};
  return (
    <>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} md={6}>
          <StatCard title="Total Bills" value={Number(s.total_bills || 0)} />
        </Col>
       
       
        <Col xs={12} sm={6} md={6}>
          <StatCard title="Shares" value={Number(s.total_shares || 0)} />
        </Col>
        <Col xs={12} sm={6} md={6}>
          <StatCard title="Paid Shares" value={Number(s.paid_shares || 0)} />
        </Col>
        <Col xs={12} sm={6} md={6}>
          <StatCard title="Unpaid Shares" value={Number(s.unpaid_shares || 0)} />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
       
        <Col xs={12} sm={6} md={6}>
          <StatCard title="Total Amount" value={Number(s.total_amount || 0)} precision={2} prefix="₹" />
        </Col>
        <Col xs={12} sm={8} md={8}>
          <StatCard title="Paid Amount" value={Number(s.total_paid_amount || 0)} precision={2} prefix="₹" />
        </Col>
        <Col xs={12} sm={8} md={8}>
          <StatCard title="Unpaid Amount" value={Number(s.total_unpaid_amount || 0)} precision={2} prefix="₹" />
        </Col>
      </Row>
    </>
  );
};

export default StatisticsPanel;


