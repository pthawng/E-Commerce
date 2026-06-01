# Pull Request Checklist — Ray Paradis

> Copy checklist này vào phần mô tả của mỗi Pull Request. Reviewer sẽ không approve nếu checklist chưa hoàn thành.

---

## Template PR Description

```markdown
## Mô tả thay đổi

[Mô tả ngắn gọn PR này làm gì và tại sao]

## Loại thay đổi

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix hoặc feature làm thay đổi behavior hiện tại)
- [ ] Documentation update
- [ ] Refactoring (không thay đổi behavior)

## Checklist

### Code Quality
- [ ] Code đã được self-review trước khi tạo PR
- [ ] Không có `console.log` hoặc debug code trong production code
- [ ] Không có `any` type không có lý do
- [ ] Tất cả function public của Service có return type explicit
- [ ] Comment giải thích "tại sao" cho logic phức tạp (không phải "cái gì")

### Tests
- [ ] Unit tests đã được thêm/cập nhật cho logic mới
- [ ] Tất cả tests pass (`npm run test`)
- [ ] Nếu có integration test: chạy `npm run test:integration`
- [ ] Edge cases đã được test (empty data, concurrent requests, invalid input)

### Database (chỉ khi có thay đổi schema)
- [ ] File migration được include trong PR
- [ ] Tên migration rõ ràng theo convention
- [ ] Check constraints đã được thêm nếu cần
- [ ] Migration test trên local bằng `prisma migrate reset`
- [ ] Backward compatible hoặc đã có migration plan cho data cũ

### API (chỉ khi thay đổi/thêm endpoint)
- [ ] `@ApiProperty()` decorators đầy đủ trên DTO
- [ ] `@ApiTags()` và `@ApiOperation()` trên controller
- [ ] Swagger UI đã kiểm tra: endpoint hiển thị đúng
- [ ] HTTP method và status code đúng convention
- [ ] Error responses được document

### Security
- [ ] Không có secret/key hardcoded trong code
- [ ] Endpoint mới đã được bảo vệ bởi Auth Guard hoặc explicit `@Public()`
- [ ] Permission slug đúng được áp dụng `@RequirePermissions()`
- [ ] Input validation đầy đủ (DTO + Prisma constraints)
- [ ] SQL injection không thể xảy ra (Prisma parameterized queries)

### Performance
- [ ] Database queries có `select` chỉ lấy field cần thiết
- [ ] N+1 query không được tạo ra (dùng `include` hoặc `select` nested)
- [ ] Nếu query chạy nhiều: đã kiểm tra index có phù hợp

### Documentation
- [ ] Nếu thêm module mới: đã tạo docs theo template
- [ ] Nếu thay đổi behavior lớn: đã cập nhật docs liên quan
- [ ] ADR đã được tạo nếu đây là quyết định kiến trúc quan trọng

## Screenshots / Demo

[Thêm screenshot hoặc Loom video nếu có thay đổi UI hoặc behavior phức tạp]

## Linked Issues

Closes #[issue-number]
```

---

## Checklist cho Reviewer

Khi review PR, kiểm tra:

### Functional
- [ ] Logic business đúng theo yêu cầu
- [ ] Các error cases được handle đúng
- [ ] Không có regression (feature cũ vẫn hoạt động)

### Code Quality
- [ ] Tên variable/function rõ ràng, không cần comment để hiểu
- [ ] Không có code trùng lặp (DRY)
- [ ] Độ phức tạp hợp lý — function không quá 50 lines
- [ ] Module boundaries không bị vi phạm

### Security
- [ ] Không có sensitive data trong logs
- [ ] Permission check đúng và đủ
- [ ] Input validation chặt chẽ

### Database
- [ ] Migration an toàn, không drop data vô tình
- [ ] Query performance chấp nhận được

---

## SLA Review

| PR Size | Review SLA |
|---------|-----------|
| Small (< 200 lines) | 4 giờ làm việc |
| Medium (200-500 lines) | 1 ngày làm việc |
| Large (> 500 lines) | 2 ngày làm việc |

> **Quy tắc**: PR được approve bởi ít nhất 1 reviewer trước khi merge. PR liên quan đến security, payment, hoặc inventory cần 2 reviewers.
