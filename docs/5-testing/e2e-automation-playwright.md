# E2E Automation Với Playwright

> Page tham khảo cho slide `Portal Feature Artifact Workflow`.

## E2E Là Gì?

E2E test mô phỏng hành vi người dùng thật trên browser.

Ví dụ:

- mở trang
- login hoặc dùng session
- fill form
- click submit
- chờ API/mock response
- kiểm tra toast/table/dialog/URL

Unit test kiểm tra logic nhỏ. E2E kiểm tra flow tích hợp.

## Vì Sao Cần E2E?

Vấn đề hiện tại:

- Release phụ thuộc nhiều vào regression thủ công.
- Test khoanh vùng theo cảm tính dễ thiếu case.
- QA có thể phải test muộn sau release.
- Lỗi tích hợp thường chỉ lộ khi chạy flow thật.

E2E biến flow quan trọng thành safety net tự động.

## Lợi Ích Cho QA

- Giảm retest regression lặp lại.
- Flow chính chạy lại được mỗi release.
- CI/CD có thể chạy toàn project.
- Khi fail có trace/screenshot/report để debug.
- QA tập trung thiết kế case mới và case biên tốt hơn.

Không thay QA. E2E giúp QA đỡ bị kéo vào regression muộn.

## Vì Sao Playwright?

Playwright phù hợp portal hiện tại vì:

- chạy Chromium, Firefox, WebKit
- locator và auto-wait tốt
- hỗ trợ API mocking
- chạy tốt trong CI/CD
- có trace viewer, screenshot, video, HTML report
- tích hợp tốt với `@axe-core/playwright`

Tham khảo:

- [Playwright docs](https://playwright.dev/docs/intro)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Playwright trace viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)

## Khó Khăn

E2E không miễn phí.

Cần discipline:

- `data-testid` ổn định
- test data rõ
- mock/API state kiểm soát được
- tránh assert quá chi tiết vào UI không quan trọng
- không dùng E2E cho mọi edge nhỏ

Logic nhỏ nên để `/unit`.

## Test Pyramid Cho Base

```text
Vitest unit
  → logic nhỏ, nhiều edge cases, chạy nhanh

Playwright E2E
  → flow nghiệp vụ chính, regression release

axe + semantic UI helpers
  → a11y, layout, overflow, broken images, design token
```

## Semantic UI Assertions

Base đã có các helper để bắt lỗi UI phổ biến:

- no console errors
- no horizontal scroll
- no broken images
- no text overflow
- overlap/grid/table layout
- axe accessibility
- shadcn design token

Chi tiết: [Semantic UI Assertions](./e2e-assertions.md).

## Câu Chốt

E2E không phải để thay QA.

E2E là safety net để QA và team bớt retest thủ công, giảm rủi ro release, và có thêm thời gian thiết kế case chất lượng hơn.
