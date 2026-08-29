# Common flat design foundation

- **Testcase:** `#`
- **Screen:** `#`

Nền tảng visual chung: phẳng, rõ phân cấp, tránh hiệu ứng 3D và giữ cảm giác shadcn/admin hiện đại.

## status

draft

## owner

portal-team

## principles

```yaml
- Ưu tiên border, background nhạt, spacing và typography để tạo hierarchy.
- Không dùng gradient cho button/card/alert trong admin portal.
- Không dùng shadow nặng; shadow nhẹ chỉ dùng cho overlay nổi như
  dropdown/dialog nếu cần.
- Không lạm dụng modal/alert; dùng inline state gần ngữ cảnh.
- Không thiết kế modal chồng modal; flow phức tạp phải chuyển thành
  page/step/inline section hoặc đóng modal hiện tại trước.
- Màu semantic phải có ý nghĩa: success, danger, warning, info, muted.
```

## surfaces

```yaml
pageBackground: neutral/muted nhẹ
card:
  style: border + bg-card/bg-white
  shadow: none hoặc very subtle
  radius: md
table:
  style: border hoặc background separation nhẹ
dialog:
  style: phẳng, border, overlay tối nhẹ
```

## buttons

```yaml
complete:
  background: "#48b0f7"
  text: "#ffffff"
outlinePrimary:
  border: "#4EAAFF"
  text: "#4EAAFF"
  background: "#FFFFFF"
outlineSecondary:
  border: "#C2C2C2"
  text: "#C2C2C2"
  background: "#FFFFFF"
destructive:
  purpose: chỉ dùng cho delete/error/destructive
```


## Design intent

**Inherits:** `admin-crud`

**Shell:** #shell: DataPage

**Patterns:**

- #pattern: CRUD

### Zones

| ID | Nhãn | Vị trí | Container | Ghi chú |
| --- | --- | --- | --- | --- |
| main | Nội dung chính |  |  |  |

## Legacy evidence
