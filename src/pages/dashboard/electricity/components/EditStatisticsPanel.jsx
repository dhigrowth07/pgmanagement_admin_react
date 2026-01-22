import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Button } from 'antd';
import { ReloadOutlined, FileTextOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEditStatistics,
  selectEditStatistics,
  selectElectricityStatus
} from '../../../../redux/electricity/electricitySlice';

const EditStatisticsPanel = () => {
  const dispatch = useDispatch();
  const statistics = useSelector(selectEditStatistics);
  const status = useSelector(selectElectricityStatus);

  useEffect(() => {
    dispatch(fetchEditStatistics());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchEditStatistics());
  };

  const getActionIcon = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'create': return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'update': return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'delete': return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'finalize': return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      case 'unfinalize': return <CloseCircleOutlined style={{ color: '#fa8c16' }} />;
      default: return <FileTextOutlined />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold m-0">Edit Statistics</h3>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={status === 'loading'}
          size="small"
        >
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Edits"
              value={statistics?.total_edits || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        {statistics?.by_action?.map((actionStat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card size="small">
              <Statistic
                title={
                  <div className="flex items-center gap-2">
                    {getActionIcon(actionStat.action_type)}
                    <span className="capitalize">{actionStat.action_type}</span>
                  </div>
                }
                value={actionStat.count}
                valueStyle={{
                  color: actionStat.action_type?.toLowerCase() === 'create' ? '#52c41a' :
                         actionStat.action_type?.toLowerCase() === 'update' ? '#1890ff' :
                         actionStat.action_type?.toLowerCase() === 'delete' ? '#ff4d4f' :
                         actionStat.action_type?.toLowerCase() === 'finalize' ? '#722ed1' :
                         '#fa8c16'
                }}
              />
              {actionStat.last_edit && (
                <div className="text-xs text-gray-500 mt-1">
                  Last: {new Date(actionStat.last_edit).toLocaleDateString()}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {(!statistics || statistics.by_action?.length === 0) && status !== 'loading' && (
        <Card size="small">
          <div className="text-center py-8 text-gray-500">
            No edit statistics available
          </div>
        </Card>
      )}
    </div>
  );
};

export default EditStatisticsPanel;
