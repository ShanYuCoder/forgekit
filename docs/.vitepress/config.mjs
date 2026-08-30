import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: "Forgekit Docs",
    description: "Unified Local MCP Toolkit (Graph, DNA, Docs, Test, Codegen)",
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Platform', link: '/platform/' }
      ],
      sidebar: [
        {
          text: 'Guide & Khái niệm',
          items: [
            { text: 'Getting Started', link: '/1-guide/getting-started' },
            { text: 'Toolkits Overview', link: '/1-guide/toolkits' },
            { text: 'Cấu trúc Hệ thống Docs', link: '/1-guide/system-doc-structure' },
            { text: 'AI Workflow', link: '/1-guide/ai-workflow' }
          ]
        },
        {
          text: 'Lifecycle (Vòng Đời)',
          items: [
            { text: 'Tổng Quan Pipeline', link: '/2-lifecycle/overview' },
            { text: 'Luồng Phát Triển (Dev)', link: '/2-lifecycle/development-flows' },
            { text: 'Luồng Backend AI', link: '/2-lifecycle/backend-workflow' },
            { text: 'Bảo Trì & Tech Debt', link: '/2-lifecycle/quality-maintenance' }
          ]
        },
        {
          text: 'Artifacts',
          items: [
            { text: 'Cấu Trúc Layout', link: '/3-artifacts/layout' },
            { text: 'Bundle & IR', link: '/3-artifacts/bundle-and-ir' },
            { text: 'Quy trình Grill', link: '/3-artifacts/grill-process' },
            { text: 'Tags & Markers', link: '/3-artifacts/tags-and-markers' }
          ]
        },
        {
          text: 'Contracts & Tiêu Chuẩn',
          items: [
            { text: 'Portal ↔ FastAPI', link: '/4-contracts/portal-to-fastapi' },
            { text: 'Field Registry', link: '/4-contracts/field-registry' }
          ]
        },
        {
          text: 'Kiểm Thử (Testing)',
          items: [
            { text: 'Quy Ước E2E TestIDs', link: '/5-testing/e2e-testids' },
            { text: 'E2E Semantic Assertions', link: '/5-testing/e2e-assertions' }
          ]
        },
        {
          text: 'Tra Cứu Nhanh',
          items: [
            { text: 'CLI & Commands', link: '/6-reference/cli-and-commands' },
            { text: 'Prompt Templates', link: '/6-reference/prompt-templates' },
            { text: 'Repo Split Map', link: '/6-reference/repo-split-map' }
          ]
        },
        {
          text: 'Kiến Trúc (Architecture)',
          items: [
            { text: 'Portal Architecture', link: '/7-architecture/portal-architecture' },
            { text: 'Page Lifecycle', link: '/7-architecture/page-lifecycle' }
          ]
        }
      ]
    },
    mermaid: {
      // Mermaid configuration
    },
    vite: {
      optimizeDeps: {
        include: [
          'mermaid',
          'fastdom'
        ]
      }
    }
  })
);
