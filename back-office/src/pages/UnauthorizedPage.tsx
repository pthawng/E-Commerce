import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập vào khu vực này của Atelier."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Trở về Dashboard
          </Button>
        }
      />
    </div>
  );
};
