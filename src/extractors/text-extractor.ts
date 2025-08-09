import fs from 'fs-extra';
import path from 'path';

/**
 * 文字提取器类
 * 
 * 支持从多种文档格式中提取文字内容：
 * - PDF 文档：使用 pdf-parse 库解析
 * - Word 文档：使用 mammoth 库解析 .docx 和 .doc 文件
 * - 文本文件：直接读取 .txt 文件
 * - Markdown：解析 .md 文件并清理 Markdown 语法
 * 
 * 技术特色：
 * - 智能文件类型检测
 * - 错误处理和异常恢复
 * - 支持相对路径和绝对路径
 * - Markdown 语法清理算法
 * - 文件内容验证
 * 
 * @version 1.2.0
 * @author lucianaib
 */
export class TextExtractor {
  
  /**
   * 支持的文件类型
   */
  private readonly supportedTypes = new Set(['pdf', 'docx', 'doc', 'txt', 'md', 'markdown']);

  /**
   * 文件类型到扩展名的映射
   */
  private readonly typeExtensionMap: Record<string, string[]> = {
    pdf: ['.pdf'],
    docx: ['.docx'],
    doc: ['.doc'],
    txt: ['.txt'],
    md: ['.md', '.markdown']
  };

  /**
   * 从指定文件中提取文字内容
   * @param filePath 文件路径（支持绝对路径和相对路径）
   * @param fileType 文件类型
   * @returns 提取的文字内容
   * @throws {Error} 当文件不存在或类型不支持时抛出错误
   */
  async extractText(filePath: string, fileType: string): Promise<string> {
    // 解析文件路径 - 支持相对路径
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    // 验证文件是否存在
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`文件不存在: ${resolvedPath}`);
    }

    // 验证文件类型
    const normalizedType = fileType.toLowerCase();
    if (!this.supportedTypes.has(normalizedType)) {
      throw new Error(`不支持的文件类型: ${fileType}。支持的类型: ${Array.from(this.supportedTypes).join(', ')}`);
    }

    // 验证文件大小（防止处理过大的文件）
    const stats = await fs.stat(resolvedPath);
    const maxSize = 50 * 1024 * 1024; // 50MB 限制
    if (stats.size > maxSize) {
      throw new Error(`文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB，最大支持 50MB`);
    }

    try {
      let extractedText: string;

      switch (normalizedType) {
        case 'pdf':
          extractedText = await this.extractFromPDF(resolvedPath);
          break;
        
        case 'docx':
        case 'doc':
          extractedText = await this.extractFromWord(resolvedPath);
          break;
        
        case 'txt':
          extractedText = await this.extractFromTXT(resolvedPath);
          break;
        
        case 'md':
        case 'markdown':
          extractedText = await this.extractFromMarkdown(resolvedPath);
          break;
        
        default:
          throw new Error(`未实现的文件类型处理: ${fileType}`);
      }

      // 后处理：清理和验证提取的文本
      const cleanedText = this.postProcessText(extractedText);
      
      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error('文件中没有找到有效的文字内容');
      }

      return cleanedText;
    } catch (error) {
      throw new Error(`文件解析失败 (${path.basename(resolvedPath)}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从 PDF 文件中提取文字
   * @param filePath PDF 文件路径
   * @returns 提取的文字内容
   * @throws {Error} 当 PDF 解析失败时抛出错误
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      // 动态导入 pdf-parse 以避免启动时的错误
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = await fs.readFile(filePath);
      
      // 解析 PDF 文档
      const data = await pdfParse(dataBuffer, {
        // 配置选项：提高解析质量
        max: 0, // 解析所有页面
        version: 'v1.10.100' // 指定版本以确保兼容性
      });
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF 文件中没有找到可提取的文字内容，可能是扫描版 PDF');
      }
      
      // 基础清理：移除过多的空白字符
      let cleanedText = data.text
        .replace(/\r\n/g, '\n')           // 统一换行符
        .replace(/\r/g, '\n')             // 统一换行符
        .replace(/\n{3,}/g, '\n\n')       // 合并多个空行
        .replace(/[ \t]{2,}/g, ' ')       // 合并多个空格
        .trim();
      
      return cleanedText;
    } catch (error) {
      if (error instanceof Error && error.message.includes('没有找到可提取的文字内容')) {
        throw error;
      }
      throw new Error(`PDF 文件解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从 Word 文档中提取文字
   * @param filePath Word 文档路径
   * @returns 提取的文字内容
   * @throws {Error} 当 Word 文档解析失败时抛出错误
   */
  private async extractFromWord(filePath: string): Promise<string> {
    try {
      // 动态导入 mammoth 以避免启动时的错误
      const mammoth = (await import('mammoth')).default;
      
      // 提取纯文本内容
      const result = await mammoth.extractRawText({ 
        path: filePath
        // 配置选项：优化文本提取
      });
      
      if (result.messages && result.messages.length > 0) {
        // 记录警告信息，但不中断处理
        const warnings = result.messages
          .filter(m => m.type === 'warning')
          .map(m => m.message);
        
        if (warnings.length > 0) {
          console.warn('Word 文档解析警告:', warnings.join(', '));
        }
      }
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('Word 文档中没有找到可提取的文字内容');
      }
      
      return result.value;
    } catch (error) {
      throw new Error(`Word 文档解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从 TXT 文件中提取文字
   * @param filePath TXT 文件路径
   * @returns 提取的文字内容
   * @throws {Error} 当文件读取失败时抛出错误
   */
  private async extractFromTXT(filePath: string): Promise<string> {
    try {
      // 尝试多种编码格式
      const encodings = ['utf-8', 'gbk', 'gb2312'];
      let content: string | null = null;
      let lastError: Error | null = null;

      for (const encoding of encodings) {
        try {
          content = await fs.readFile(filePath, encoding as BufferEncoding);
          break; // 成功读取，跳出循环
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue; // 尝试下一种编码
        }
      }

      if (!content) {
        throw lastError || new Error('无法使用任何支持的编码读取文件');
      }
      
      if (content.trim().length === 0) {
        throw new Error('TXT 文件为空或没有有效内容');
      }
      
      return content;
    } catch (error) {
      throw new Error(`TXT 文件读取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从 Markdown 文件中提取文字
   * @param filePath Markdown 文件路径
   * @returns 提取的文字内容（去除 Markdown 语法）
   * @throws {Error} 当文件读取失败时抛出错误
   */
  private async extractFromMarkdown(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        throw new Error('Markdown 文件为空或没有有效内容');
      }
      
      // 清理 Markdown 语法
      const cleanedContent = this.cleanMarkdownSyntax(content);
      
      if (!cleanedContent || cleanedContent.trim().length === 0) {
        throw new Error('Markdown 文件清理后没有有效的文字内容');
      }
      
      return cleanedContent;
    } catch (error) {
      if (error instanceof Error && error.message.includes('没有有效')) {
        throw error;
      }
      throw new Error(`Markdown 文件读取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 清理 Markdown 语法，提取纯文本内容
   * @param content 原始 Markdown 内容
   * @returns 清理后的纯文本内容
   */
  private cleanMarkdownSyntax(content: string): string {
    let cleanedContent = content;

    // 1. 移除 HTML 标签
    cleanedContent = cleanedContent.replace(/<[^>]*>/g, '');
    
    // 2. 移除代码块（三个反引号包围的内容）
    cleanedContent = cleanedContent.replace(/```[\s\S]*?```/g, '');
    
    // 3. 移除行内代码（单个反引号包围的内容）
    cleanedContent = cleanedContent.replace(/`([^`]+)`/g, '$1');
    
    // 4. 移除标题标记（# ## ### 等）
    cleanedContent = cleanedContent.replace(/^#{1,6}\s+/gm, '');
    
    // 5. 移除粗体和斜体标记
    cleanedContent = cleanedContent.replace(/\*\*(.*?)\*\*/g, '$1'); // **粗体**
    cleanedContent = cleanedContent.replace(/\*(.*?)\*/g, '$1');     // *斜体*
    cleanedContent = cleanedContent.replace(/__(.*?)__/g, '$1');     // __粗体__
    cleanedContent = cleanedContent.replace(/_(.*?)_/g, '$1');       // _斜体_
    
    // 6. 移除删除线
    cleanedContent = cleanedContent.replace(/~~(.*?)~~/g, '$1');
    
    // 7. 移除链接，保留链接文字
    cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // 8. 移除图片标记
    cleanedContent = cleanedContent.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
    
    // 9. 移除引用标记（> 开头的行）
    cleanedContent = cleanedContent.replace(/^>\s*/gm, '');
    
    // 10. 移除无序列表标记（- * + 开头的行）
    cleanedContent = cleanedContent.replace(/^[\s]*[-*+]\s+/gm, '');
    
    // 11. 移除有序列表标记（数字. 开头的行）
    cleanedContent = cleanedContent.replace(/^[\s]*\d+\.\s+/gm, '');
    
    // 12. 移除水平分割线
    cleanedContent = cleanedContent.replace(/^[-*_]{3,}$/gm, '');
    
    // 13. 移除表格语法
    cleanedContent = cleanedContent.replace(/\|.*\|/g, '');
    cleanedContent = cleanedContent.replace(/^[\s]*:?-+:?[\s]*$/gm, '');
    
    // 14. 移除脚注引用
    cleanedContent = cleanedContent.replace(/\[\^[^\]]+\]/g, '');
    
    // 15. 移除任务列表标记
    cleanedContent = cleanedContent.replace(/^[\s]*- \[[x ]\]\s+/gmi, '');
    
    // 16. 清理多余的空行和空白字符
    cleanedContent = cleanedContent.replace(/\n\s*\n/g, '\n\n'); // 多个空行合并为两个
    cleanedContent = cleanedContent.replace(/[ \t]+/g, ' ');     // 多个空格合并为一个
    cleanedContent = cleanedContent.trim();                      // 去除首尾空白
    
    return cleanedContent;
  }

  /**
   * 后处理文本内容
   * @param text 原始文本
   * @returns 处理后的文本
   */
  private postProcessText(text: string): string {
    if (!text) return '';

    let processedText = text;

    // 1. 统一换行符
    processedText = processedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. 清理控制字符（保留换行符和制表符）
    processedText = processedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 3. 合并多个空格为单个空格
    processedText = processedText.replace(/[ \t]+/g, ' ');

    // 4. 合并多个换行符（最多保留两个连续换行符）
    processedText = processedText.replace(/\n{3,}/g, '\n\n');

    // 5. 清理行首行尾空格
    processedText = processedText
      .split('\n')
      .map(line => line.trim())
      .join('\n');

    // 6. 去除首尾空白
    processedText = processedText.trim();

    return processedText;
  }

  /**
   * 自动检测文件类型
   * @param filePath 文件路径
   * @returns 检测到的文件类型
   * @throws {Error} 当文件扩展名不支持时抛出错误
   */
  detectFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const typeMap: Record<string, string> = {
      '.pdf': 'pdf',
      '.docx': 'docx',
      '.doc': 'doc',
      '.txt': 'txt',
      '.md': 'md',
      '.markdown': 'md'
    };
    
    const detectedType = typeMap[ext];
    if (!detectedType) {
      throw new Error(`不支持的文件扩展名: ${ext}。支持的扩展名: ${Object.keys(typeMap).join(', ')}`);
    }
    
    return detectedType;
  }

  /**
   * 获取支持的文件类型列表
   * @returns 支持的文件类型数组
   */
  getSupportedTypes(): string[] {
    return Array.from(this.supportedTypes);
  }

  /**
   * 获取支持的文件扩展名列表
   * @returns 支持的文件扩展名数组
   */
  getSupportedExtensions(): string[] {
    const extensions: string[] = [];
    Object.values(this.typeExtensionMap).forEach(exts => {
      extensions.push(...exts);
    });
    return extensions;
  }

  /**
   * 验证文件是否为支持的类型
   * @param filePath 文件路径
   * @returns 是否支持该文件类型
   */
  isSupportedFile(filePath: string): boolean {
    try {
      this.detectFileType(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件信息
   * @param filePath 文件路径
   * @returns 文件信息对象
   */
  async getFileInfo(filePath: string): Promise<{
    path: string;
    size: number;
    type: string;
    supported: boolean;
    exists: boolean;
  }> {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const exists = await fs.pathExists(resolvedPath);
    
    let size = 0;
    let type = '';
    let supported = false;

    if (exists) {
      const stats = await fs.stat(resolvedPath);
      size = stats.size;
      
      try {
        type = this.detectFileType(resolvedPath);
        supported = true;
      } catch {
        supported = false;
      }
    }

    return {
      path: resolvedPath,
      size,
      type,
      supported,
      exists
    };
  }
}