# Tổng quan - Quản lý Kho Két & Hàng tồn kho

Phân hệ **Kho Két & Hàng tồn kho** là hệ thống quản lý logistics và tài sản cốt lõi được thiết kế riêng cho **Ray Paradis** - nền tảng thương mại điện tử trang sức phân khúc cao cấp. Do đặc thù tài sản trang sức tích hợp đá quý và kim loại có giá trị cực lớn, phân hệ cung cấp cơ chế bảo mật nghiêm ngặt, kiểm toán thời gian thực và quản lý định danh chip RFID ở cấp độ chi tiết.

## Các trụ cột cốt lõi

Hệ thống được thiết kế xung quanh 5 khái niệm lớn:

1. **Phân tầng Vị trí lưu trữ:**
   Phân cấp lưu trữ chi tiết: *Chi nhánh -> Kho/Két sắt -> Phân vùng -> Két vật lý / Khay chứa*. Hỗ trợ cấu hình mức độ bảo mật và hạn mức bảo hiểm (Insurance Limit) cho từng két.
   
2. **Chế độ tồn kho kép (Dual-Inventory):**
   - **Tồn kho tính số lượng (Quantity-Based Balances):** Áp dụng cho các loại bao bì, chứng thư rời và phụ kiện.
   - **Tồn kho định danh độc bản (Serialized Asset):** Mỗi món trang sức cao cấp có một mã Serial Number và tùy chọn **RFID Tag** duy nhất để giám sát toàn bộ vòng đời.
   
3. **Luồng điều chuyển hai bước (Double-Entry Stock Transfer):**
   Quy trình luân chuyển tài sản nghiêm ngặt qua 4 bước: *Tạo yêu cầu -> Duyệt -> Đóng gói giao đi (Ship) -> Nhận hàng (Receive)*. Việc giao-nhận bắt buộc quét RFID vật lý để đối soát.

4. **Kiểm kê mù (Blind Stocktaking):**
   Cho phép nhân viên kho thực hiện quét kiểm kê thực tế mà không biết trước số liệu sổ sách, bảo đảm tính minh bạch và trung thực tối đa.
   
5. **Đảm bảo tính chính xác cho Tài chính:**
   Ghi nhận nhật ký biến động tồn kho chi tiết, tách biệt với nhật ký kiểm toán hành vi (Audit Log). Các mặt hàng chênh lệch chênh lệch khi kiểm kho được phân loại đúng nghiệp vụ vào `LOST`, `MISSING`, `FOUND`, hoặc `WRITTEN_OFF` thay vì xử lý như bán hàng (`SOLD`) làm hỏng số liệu doanh thu.

## Thuật ngữ quan trọng

- **InventoryBalance:** Số dư tồn kho (số lượng tồn thực tế, số lượng giữ hàng, số lượng hư hại) của một biến thể sản phẩm tại một kho cụ thể.
- **PhysicalItem:** Món trang sức vật lý cụ thể được định danh độc bản bằng Serial/RFID.
- **StockTransfer:** Quy trình điều chuyển trang sức giữa các chi nhánh hoặc két sắt trung tâm.
- **StocktakeSession:** Phiên kiểm kê khớp danh sách RFID thực tế với sổ sách hệ thống.

## Phân quyền & Vai trò người dùng

- **Nhân viên kho (`inventory:read`, `inventory:transfer:create`, `inventory:audit:create`):**
  Thực hiện nghiệp vụ hàng ngày, tạo phiếu điều chuyển và thực hiện kiểm đếm thực tế.
- **Quản lý Showroom (`inventory:transfer:approve`, `inventory:transfer:reject`, `inventory:audit:submit`):**
  Phê duyệt hoặc từ chối phiếu điều chuyển đi/đến chi nhánh mình quản lý và nộp báo cáo phiên kiểm kho.
- **CFO & Admin vận hành (`inventory:admin`, `inventory:audit:resolve`):**
  Thiết lập hạn mức bảo hiểm két sắt, khóa két khẩn cấp và phê duyệt xử lý chênh lệch kiểm kho.
