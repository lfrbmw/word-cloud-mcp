#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { WordCloudGenerator } from './wordcloud/generator.js';
import { MultiFormatWordCloudGenerator } from './wordcloud/multi-format-generator.js';
import { TextExtractor } from './extractors/text-extractor.js';
import { ContentCleaner } from './utils/content-cleaner.js';

/**
 * 词云图制作工具 MCP 服务器
 * 
 * 功能特性：
 * - 支持多种文档格式的文字提取（PDF、Word、TXT、MD）
 * - 智能内容清理和中文分词
 * - 多种输出格式支持（SVG、PNG、JPG、WebP）
 * - 螺旋布局算法，避免文字重叠
 * - 多种主题和配置选项
 * - 高质量渲染和图像优化
 * 
 * 技术架构：
 * - 基于 Model Context Protocol (MCP) 标准
 * - 模块化设计，职责分离
 * - 异步处理，支持大文件
 * - 错误处理和异常恢复
 * - 类型安全的 TypeScript 实现
 * 
 * @version 1.2.0
 * @author lucianaib
 */
class WordCloudMCPServer {
  private readonly server: Server;
  private readonly wordCloudGenerator: WordCloudGenerator;
  private readonly multiFormatGenerator: MultiFormatWordCloudGenerator;
  private readonly textExtractor: TextExtractor;
  private readonly contentCleaner: ContentCleaner;

  constructor() {
    this.server = new Server({
      name: '@lucianaib/word-cloud-mcp',
      version: '1.2.0',
    });

    // 初始化核心组件
    this.wordCloudGenerator = new WordCloudGenerator();
    this.multiFormatGenerator = new MultiFormatWordCloudGenerator();
    this.textExtractor = new TextExtractor();
    this.contentCleaner = new ContentCleaner();

    this.setupToolHandlers();
  }

  /**
   * 设置工具处理器
   * 注册所有可用的 MCP 工具和处理逻辑
   */
  private setupToolHandlers(): void {
    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'extract_text_from_file',
            description: '从文档文件中提取文字内容，支持 PDF、Word、TXT、MD 等格式',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: '文档文件的路径'
                },
                fileType: {
                  type: 'string',
                  enum: ['pdf', 'docx', 'txt', 'md'],
                  description: '文件类型'
                }
              },
              required: ['filePath', 'fileType']
            }
          },
          {
            name: 'generate_wordcloud',
            description: '根据文字内容生成词云图',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: '用于生成词云图的文字内容'
                },
                theme: {
                  type: 'string',
                  description: '词云图主题色彩',
                  default: 'default'
                },
                shape: {
                  type: 'string',
                  description: '词云图形状',
                  default: 'rectangle'
                },
                wordGap: {
                  type: 'number',
                  description: '文字间隙',
                  default: 2
                },
                fontSize: {
                  type: 'object',
                  properties: {
                    min: { type: 'number', default: 10 },
                    max: { type: 'number', default: 100 }
                  },
                  description: '文字大小范围'
                },
                angleRange: {
                  type: 'object',
                  properties: {
                    min: { type: 'number', default: -90 },
                    max: { type: 'number', default: 90 }
                  },
                  description: '角度范围'
                },
                angleStep: {
                  type: 'number',
                  description: '角度步长',
                  default: 45
                },
                outputPath: {
                  type: 'string',
                  description: '输出文件路径（支持绝对路径和相对路径）',
                  default: './wordcloud.svg'
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
                  description: '输出格式（svg、png、jpg、jpeg、webp）',
                  default: 'svg'
                },
                backgroundColor: {
                  type: 'string',
                  description: '背景颜色（十六进制颜色代码）',
                  default: '#ffffff'
                },
                quality: {
                  type: 'number',
                  description: 'JPG/WEBP 格式的质量设置（1-100）',
                  default: 90
                }
              },
              required: ['text']
            }
          },
          {
            name: 'create_wordcloud_from_file',
            description: '从文档文件直接生成词云图（提取文字 + 生成词云图的组合操作）',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: '文档文件的路径'
                },
                fileType: {
                  type: 'string',
                  enum: ['pdf', 'docx', 'txt', 'md'],
                  description: '文件类型'
                },
                theme: {
                  type: 'string',
                  description: '词云图主题色彩',
                  default: 'default'
                },
                shape: {
                  type: 'string',
                  description: '词云图形状',
                  default: 'rectangle'
                },
                wordGap: {
                  type: 'number',
                  description: '文字间隙',
                  default: 2
                },
                fontSize: {
                  type: 'object',
                  properties: {
                    min: { type: 'number', default: 10 },
                    max: { type: 'number', default: 100 }
                  },
                  description: '文字大小范围'
                },
                angleRange: {
                  type: 'object',
                  properties: {
                    min: { type: 'number', default: -90 },
                    max: { type: 'number', default: 90 }
                  },
                  description: '角度范围'
                },
                angleStep: {
                  type: 'number',
                  description: '角度步长',
                  default: 45
                },
                outputPath: {
                  type: 'string',
                  description: '输出文件路径（支持绝对路径和相对路径）',
                  default: './wordcloud.svg'
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
                  description: '输出格式（svg、png、jpg、jpeg、webp）',
                  default: 'svg'
                },
                backgroundColor: {
                  type: 'string',
                  description: '背景颜色（十六进制颜色代码）',
                  default: '#ffffff'
                },
                quality: {
                  type: 'number',
                  description: 'JPG/WEBP 格式的质量设置（1-100）',
                  default: 90
                }
              },
              required: ['filePath', 'fileType']
            }
          }
        ] as Tool[]
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'extract_text_from_file':
            return await this.handleExtractText(args);
          
          case 'generate_wordcloud':
            return await this.handleGenerateWordCloud(args);
          
          case 'create_wordcloud_from_file':
            return await this.handleCreateWordCloudFromFile(args);
          
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * 处理文字提取请求
   * @param args 请求参数
   * @returns 处理结果
   */
  private async handleExtractText(args: any) {
    const { filePath, fileType } = args;
    
    // 参数验证
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('文件路径参数无效');
    }
    
    if (!fileType || typeof fileType !== 'string') {
      throw new Error('文件类型参数无效');
    }
    
    try {
      // 处理文件路径 - 支持相对路径
      let resolvedPath = filePath;
      if (!path.isAbsolute(filePath)) {
        resolvedPath = path.resolve(process.cwd(), filePath);
      }
      
      // 获取文件信息
      const fileInfo = await this.textExtractor.getFileInfo(resolvedPath);
      
      if (!fileInfo.exists) {
        throw new Error(`文件不存在: ${resolvedPath}`);
      }
      
      if (!fileInfo.supported) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      // 提取文字内容
      const extractedText = await this.textExtractor.extractText(resolvedPath, fileType);
      
      // 清理文本内容
      const cleanedText = this.contentCleaner.clean(extractedText);
      
      // 获取清理统计信息
      const stats = this.contentCleaner.getCleaningStats(extractedText, cleanedText);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 成功从文件提取文字内容

📁 文件信息:
- 原始路径: ${filePath}
- 解析路径: ${resolvedPath}
- 类型: ${fileType.toUpperCase()}
- 大小: ${(fileInfo.size / 1024).toFixed(2)} KB

📊 处理统计:
- 原始字符数: ${stats.originalLength}
- 清理后字符数: ${stats.cleanedLength}
- 原始词汇数: ${stats.originalWordCount}
- 有效词汇数: ${stats.cleanedWordCount}
- 词汇精简率: ${stats.reductionRate}%

📝 提取的文字内容:
${cleanedText.length > 1000 ? cleanedText.substring(0, 1000) + '...\n\n[内容已截断，完整内容已准备用于词云生成]' : cleanedText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`文字提取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理词云图生成请求
   * @param args 请求参数
   * @returns 处理结果
   */
  private async handleGenerateWordCloud(args: any) {
    const { text, format = 'svg', outputPath, ...options } = args;
    
    // 参数验证
    if (!text || typeof text !== 'string') {
      throw new Error('文本内容参数无效');
    }
    
    if (text.trim().length === 0) {
      throw new Error('文本内容不能为空');
    }
    
    try {
      // 清理文本内容
      const cleanedText = this.contentCleaner.clean(text);
      
      if (cleanedText.trim().length === 0) {
        throw new Error('文本清理后没有有效内容，请检查输入文本');
      }
      
      // 处理输出路径 - 支持相对路径和自动生成
      let finalOutputPath = outputPath;
      if (!finalOutputPath) {
        // 自动生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const extension = format === 'svg' ? 'svg' : format;
        finalOutputPath = `./wordcloud-${timestamp}.${extension}`;
      } else if (!path.isAbsolute(finalOutputPath)) {
        // 相对路径转换为绝对路径
        finalOutputPath = path.resolve(process.cwd(), finalOutputPath);
      }
      
      // 评估文本质量
      const quality = this.contentCleaner.assessTextQuality(cleanedText);
      
      // 获取词汇统计信息
      const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
      const uniqueWords = new Set(words);
      
      // 生成词云图
      let actualOutputPath: string;
      
      if (format && format !== 'svg') {
        // 使用多格式生成器
        actualOutputPath = await this.multiFormatGenerator.generate(cleanedText, { 
          format, 
          outputPath: finalOutputPath,
          ...options 
        });
      } else {
        // 使用基础 SVG 生成器
        actualOutputPath = await this.wordCloudGenerator.generate(cleanedText, {
          outputPath: finalOutputPath,
          ...options
        });
      }
      
      // 构建响应消息
      let qualityInfo = '';
      if (quality.score < 80) {
        qualityInfo = `\n⚠️ 文本质量评分: ${quality.score}/100`;
        if (quality.issues.length > 0) {
          qualityInfo += `\n问题: ${quality.issues.join(', ')}`;
        }
        if (quality.suggestions.length > 0) {
          qualityInfo += `\n建议: ${quality.suggestions.join(', ')}`;
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 词云图生成成功！

📊 文本统计:
- 总词汇数: ${words.length}
- 唯一词汇数: ${uniqueWords.size}
- 文本质量评分: ${quality.score}/100

📁 输出信息:
- 文件路径: ${actualOutputPath}
- 输出格式: ${format.toUpperCase()}
- 主题: ${options.theme || 'default'}
- 尺寸: ${options.width || 800} × ${options.height || 600}${qualityInfo}

🎨 词云图已保存，可以查看生成的文件。`
          }
        ]
      };
    } catch (error) {
      throw new Error(`词云图生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理从文件直接生成词云图的请求
   * @param args 请求参数
   * @returns 处理结果
   */
  private async handleCreateWordCloudFromFile(args: any) {
    const { filePath, fileType, format = 'svg', outputPath, ...wordCloudOptions } = args;
    
    // 参数验证
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('文件路径参数无效');
    }
    
    if (!fileType || typeof fileType !== 'string') {
      throw new Error('文件类型参数无效');
    }
    
    try {
      // 1. 处理输入文件路径 - 支持相对路径
      let resolvedInputPath = filePath;
      if (!path.isAbsolute(filePath)) {
        resolvedInputPath = path.resolve(process.cwd(), filePath);
      }
      
      // 2. 处理输出路径 - 支持相对路径和自动生成
      let finalOutputPath = outputPath;
      if (!finalOutputPath) {
        // 自动生成文件名，基于输入文件名
        const inputBaseName = path.basename(filePath, path.extname(filePath));
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const extension = format === 'svg' ? 'svg' : format;
        finalOutputPath = `./wordcloud-${inputBaseName}-${timestamp}.${extension}`;
      } else if (!path.isAbsolute(finalOutputPath)) {
        // 相对路径转换为绝对路径
        finalOutputPath = path.resolve(process.cwd(), finalOutputPath);
      }
      
      // 3. 获取文件信息
      const fileInfo = await this.textExtractor.getFileInfo(resolvedInputPath);
      
      if (!fileInfo.exists) {
        throw new Error(`文件不存在: ${resolvedInputPath}`);
      }
      
      if (!fileInfo.supported) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      // 4. 提取文字内容
      const extractedText = await this.textExtractor.extractText(resolvedInputPath, fileType);
      const cleanedText = this.contentCleaner.clean(extractedText);
      
      if (cleanedText.trim().length === 0) {
        throw new Error('文件中没有找到有效的文字内容用于生成词云图');
      }
      
      // 5. 评估文本质量和统计
      const quality = this.contentCleaner.assessTextQuality(cleanedText);
      const stats = this.contentCleaner.getCleaningStats(extractedText, cleanedText);
      const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
      const uniqueWords = new Set(words);
      
      // 6. 生成词云图
      let actualOutputPath: string;
      
      if (format !== 'svg') {
        actualOutputPath = await this.multiFormatGenerator.generate(cleanedText, { 
          format, 
          outputPath: finalOutputPath,
          ...wordCloudOptions 
        });
      } else {
        actualOutputPath = await this.wordCloudGenerator.generate(cleanedText, {
          outputPath: finalOutputPath,
          ...wordCloudOptions
        });
      }
      
      // 7. 构建响应消息
      let qualityInfo = '';
      if (quality.score < 80) {
        qualityInfo = `\n⚠️ 文本质量评分: ${quality.score}/100`;
        if (quality.issues.length > 0) {
          qualityInfo += `\n问题: ${quality.issues.join(', ')}`;
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 从文件生成词云图成功！

📁 源文件信息:
- 原始路径: ${filePath}
- 解析路径: ${resolvedInputPath}
- 文件类型: ${fileType.toUpperCase()}
- 文件大小: ${(fileInfo.size / 1024).toFixed(2)} KB

📊 文本处理统计:
- 提取字符数: ${stats.originalLength}
- 有效字符数: ${stats.cleanedLength}
- 总词汇数: ${words.length}
- 唯一词汇数: ${uniqueWords.size}
- 有效词汇数: ${stats.cleanedWordCount}
- 词汇精简率: ${stats.reductionRate}%

🎨 词云图信息:
- 输出路径: ${actualOutputPath}
- 输出格式: ${format.toUpperCase()}
- 主题: ${wordCloudOptions.theme || 'default'}
- 尺寸: ${wordCloudOptions.width || 800} × ${wordCloudOptions.height || 600}
- 文本质量评分: ${quality.score}/100${qualityInfo}

词云图已成功生成并保存！`
          }
        ]
      };
    } catch (error) {
      throw new Error(`从文件生成词云图失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 启动 MCP 服务器
   */
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      // 输出启动信息到 stderr（不影响 MCP 通信）
      console.error('🎨 词云图制作工具 MCP 服务器已启动');
      console.error('📦 版本: v1.2.0');
      console.error('🔧 支持格式: PDF, Word, TXT, Markdown');
      console.error('🎯 输出格式: SVG, PNG, JPG, WebP');
      console.error('⚡ 服务器就绪，等待请求...');
    } catch (error) {
      console.error('❌ MCP 服务器启动失败:', error);
      process.exit(1);
    }
  }
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.error('📴 收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('📴 收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
const server = new WordCloudMCPServer();
server.run().catch((error) => {
  console.error('❌ 服务器运行失败:', error);
  process.exit(1);
});