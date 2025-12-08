import { Card, Statistic, Row, Col, Alert, Spin } from "antd";
import { ArrowUpOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { useUsers } from "@/services/queries/users.queries";
import { useOrders } from "@/services/queries/orders.queries";
import { useMe } from "@/services/queries/auth.queries";
import BackendConnection from "@/components/BackendConnection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardPage() {
  // Real API calls - với error handling tốt hơn
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    error: usersError 
  } = useUsers({ limit: 1 });
  
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useOrders({ limit: 1 });
  
  const { 
    data: currentUser, 
    isLoading: meLoading,
    error: meError 
  } = useMe();

  // Calculate stats from real data
  const stats = {
    totalOrders: ordersData?.meta?.total || 0,
    totalUsers: usersData?.meta?.total || 0,
    revenue: 0, // TODO: Calculate from orders
  };

  const isLoading = usersLoading || ordersLoading || meLoading;
  const hasError = usersError || ordersError || meError;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* PAGE TITLE */}
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {/* BACKEND CONNECTION TEST */}
        <ErrorBoundary>
          <BackendConnection />
        </ErrorBoundary>

      {/* ERROR ALERT */}
      {hasError && (
        <Alert
          message="Lỗi kết nối API"
          description={
            usersError ? String(usersError) : ordersError ? String(ordersError) : "Unknown error"
          }
          type="error"
          showIcon
          closable
        />
      )}

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <Statistic
                title="Total Orders"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <Statistic
                title="Total Users"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <Statistic
                title="Revenue"
                prefix="$"
                value={stats.revenue}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                suffix={<ArrowUpOutlined />}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* CURRENT USER INFO */}
      {currentUser && (
        <Card title="Current User">
          <p>
            <strong>Email:</strong> {currentUser.email}
          </p>
          <p>
            <strong>Full Name:</strong> {currentUser.fullName || "N/A"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span style={{ color: currentUser.isActive ? "#52c41a" : "#ff4d4f" }}>
              {currentUser.isActive ? "Active" : "Inactive"}
            </span>
          </p>
        </Card>
      )}

      {/* SYSTEM OVERVIEW */}
      <Card title="System Overview">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            {isLoading
              ? "Loading data..."
              : `Total ${stats.totalOrders} orders in the system.`}
          </li>
          <li>
            {isLoading
              ? "Loading data..."
              : `Total ${stats.totalUsers} users registered.`}
          </li>
          <li>Backend connection status: Check the connection test above.</li>
        </ul>
      </Card>
      </div>
    </ErrorBoundary>
  );
}
