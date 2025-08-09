# @lucianaib/word-cloud-mcp

一个专注于从文档内容制作词云图的 MCP (Model Context Protocol) 工具，支持 PDF、Word、TXT、MD 等多种格式的智能文字提取。

## 功能特性

### 🔍 智能文字提取
- **PDF 文档**：支持从 PDF 文件中提取文字内容
- **Word 文档**：支持 .docx 和 .doc 格式的文档解析
- **文本文件**：支持 .txt 纯文本文件
- **Markdown**：支持 .md 和 .markdown 文件，自动清理 Markdown 语法

### 🧹 内容净化
- 自动去除无意义的停用词（如"我"、"我们"、"的"、"了"等）
- 清理标点符号和特殊字符
- 智能分词处理，支持中英文混合文本
- 可自定义停用词列表

### 🎨 词云图生成
- **多种输出格式**：SVG、PNG、JPG、WebP 等多种格式支持
- **多种主题**：default、warm、cool、nature、business
- **灵活配置**：字体大小、文字间隙、角度范围、背景色等
- **智能布局**：避免文字重叠，优化视觉效果
- **高质量输出**：支持高分辨率和质量调节

## 安装

### 全局安装（推荐）
```bash
npm install -g @lucianaib/word-cloud-mcp
```

### 本地安装
```bash
npm install @lucianaib/word-cloud-mcp
```

### 从源码安装
```bash
git clone https://github.com/lfrbmw/word-cloud-mcp.git
cd word-cloud-mcp
npm install
npm run build
```

## 使用方法

### 作为 MCP 服务器使用

1. 在你的 MCP 客户端配置中添加此服务器：

**方式一：使用 npx（推荐，适用于全局安装）**
```json
{
  "mcpServers": {
    "word-cloud": {
      "command": "npx",
      "args": ["@lucianaib/word-cloud-mcp"]
    }
  }
}
```

**方式二：使用 node 直接运行（适用于本地开发）**
```json
{
  "mcpServers": {
    "word-cloud": {
      "command": "node",
      "args": ["path/to/word-cloud-mcp/dist/index.js"],
      "cwd": "path/to/word-cloud-mcp"
    }
  }
}
```

**方式三：使用绝对路径（Windows 示例）**
```json
{
  "mcpServers": {
    "word-cloud": {
      "command": "node",
      "args": ["D:/word-cloud-mcp/dist/index.js"],
      "cwd": "D:/word-cloud-mcp"
    }
  }
}
```

**方式四：使用相对路径（macOS/Linux 示例）**
```json
{
  "mcpServers": {
    "word-cloud": {
      "command": "node",
      "args": ["./word-cloud-mcp/dist/index.js"],
      "cwd": "./word-cloud-mcp"
    }
  }
}
```

2. 重启你的 MCP 客户端（如 CodeBuddy、Cursor 等）

### 可用工具

#### 1. extract_text_from_file
从文档文件中提取文字内容

**参数：**
- `filePath` (string): 文档文件的路径
- `fileType` (string): 文件类型 ('pdf' | 'docx' | 'txt' | 'md')

**示例：**
```json
{
  "filePath": "./documents/sample.pdf",
  "fileType": "pdf"
}
```

#### 2. generate_wordcloud
根据文字内容生成词云图

**参数：**
- `text` (string): 用于生成词云图的文字内容
- `theme` (string, 可选): 主题色彩 (default: 'default')
- `shape` (string, 可选): 词云图形状 (default: 'rectangle')
- `wordGap` (number, 可选): 文字间隙 (default: 2)
- `fontSize` (object, 可选): 文字大小范围 (default: {min: 10, max: 100})
- `angleRange` (object, 可选): 角度范围 (default: {min: -90, max: 90})
- `angleStep` (number, 可选): 角度步长 (default: 45)
- `outputPath` (string, 可选): 输出文件路径 (default: './wordcloud.svg')
- `format` (string, 可选): 输出格式 ('svg' | 'png' | 'jpg' | 'jpeg' | 'webp', default: 'svg')
- `backgroundColor` (string, 可选): 背景颜色 (default: '#ffffff')
- `quality` (number, 可选): JPG/WebP 格式的质量设置 (1-100, default: 90)

**示例：**
```json
{
  "text": "这是一段用于生成词云图的示例文字内容",
  "theme": "warm",
  "format": "png",
  "fontSize": {"min": 15, "max": 80},
  "backgroundColor": "#f8f9fa",
  "outputPath": "./my-wordcloud.png"
}
```

#### 3. create_wordcloud_from_file
从文档文件直接生成词云图（组合操作）

**参数：**
- `filePath` (string): 文档文件的路径
- `fileType` (string): 文件类型
- 其他参数同 `generate_wordcloud`

**示例：**
```json
{
  "filePath": "./documents/article.md",
  "fileType": "md",
  "theme": "nature",
  "outputPath": "./article-wordcloud.svg"
}
```

## 主题样式

### default
经典彩色主题，适合大多数场景

### warm
暖色调主题，营造温馨氛围

### cool
冷色调主题，现代简约风格

### nature
自然色彩主题，清新自然

### business
商务色彩主题，专业正式

## 支持的文件格式

### 输入文件格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| PDF | .pdf | 支持文字型 PDF，不支持扫描版 |
| Word | .docx, .doc | Microsoft Word 文档 |
| 文本 | .txt | 纯文本文件 |
| Markdown | .md, .markdown | Markdown 格式文档 |

### 输出格式

| 格式 | 扩展名 | 特点 | 适用场景 |
|------|--------|------|----------|
| **SVG** | .svg | 矢量图形，无损缩放，文件小 | 网页展示、印刷品、需要缩放的场景 |
| **PNG** | .png | 支持透明背景，无损压缩 | 网页、演示文稿、需要透明背景 |
| **JPG** | .jpg/.jpeg | 有损压缩，文件小，不支持透明 | 照片处理、社交媒体分享 |
| **WebP** | .webp | 现代格式，压缩率高，质量好 | 现代网页、移动应用 |

## 开发

### 本地开发

```bash
# 克隆项目
git clone https://github.com/lfrbmw/word-cloud-mcp.git
cd word-cloud-mcp

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

### 项目结构

```
src/
├── index.ts                 # MCP 服务器主入口
├── extractors/
│   └── text-extractor.ts    # 文字提取器
├── utils/
│   └── content-cleaner.ts   # 内容清理器
└── wordcloud/
    └── generator.ts         # 词云图生成器
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.1.0
- 🎨 **新增多格式输出支持**：支持 SVG、PNG、JPG、WebP 等多种输出格式
- 🎯 **增强配置选项**：新增背景色、质量设置、尺寸控制等参数
- 📊 **优化文件大小**：不同格式的智能压缩和优化
- 🚀 **提升生成质量**：改进的渲染算法，支持高分辨率输出
- 📖 **完善文档**：添加多格式使用指南和最佳实践

### v1.0.0
- 初始版本发布
- 支持 PDF、Word、TXT、MD 文件的文字提取
- 实现词云图生成功能
- 提供多种主题和配置选项
