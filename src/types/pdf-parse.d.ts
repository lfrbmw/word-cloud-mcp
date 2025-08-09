/**
 * PDF-Parse 库的 TypeScript 类型定义
 * 
 * 为 pdf-parse 库提供完整的类型支持
 * 支持 PDF 文档解析、文本提取、元数据获取等功能
 * 
 * @version 1.0.0
 * @author lucianaib
 */

declare module 'pdf-parse' {
  /**
   * PDF 解析结果数据接口
   */
  interface PDFData {
    /** 总页数 */
    numpages: number;
    /** 渲染页数 */
    numrender: number;
    /** PDF 信息对象 */
    info: PDFInfo;
    /** PDF 元数据 */
    metadata: PDFMetadata | null;
    /** 提取的文本内容 */
    text: string;
    /** PDF.js 版本 */
    version: string;
  }

  /**
   * PDF 信息接口
   */
  interface PDFInfo {
    /** PDF 版本 */
    PDFFormatVersion?: string;
    /** 是否加密 */
    IsAcroFormPresent?: boolean;
    /** 是否包含 XFA */
    IsXFAPresent?: boolean;
    /** 标题 */
    Title?: string;
    /** 作者 */
    Author?: string;
    /** 主题 */
    Subject?: string;
    /** 关键词 */
    Keywords?: string;
    /** 创建者 */
    Creator?: string;
    /** 生产者 */
    Producer?: string;
    /** 创建日期 */
    CreationDate?: Date;
    /** 修改日期 */
    ModDate?: Date;
    /** 是否标记 */
    Trapped?: string;
  }

  /**
   * PDF 元数据接口
   */
  interface PDFMetadata {
    /** 元数据字符串 */
    _metadata?: string;
    /** 解析后的元数据对象 */
    [key: string]: any;
  }

  /**
   * PDF 解析选项接口
   */
  interface PDFParseOptions {
    /** 最大页数限制，0 表示无限制 */
    max?: number;
    /** PDF.js 版本 */
    version?: string;
    /** 是否包含原始文本位置信息 */
    normalizeWhitespace?: boolean;
    /** 是否禁用字体面 */
    disableFontFace?: boolean;
    /** 是否禁用流 */
    disableStream?: boolean;
    /** 是否禁用自动获取 */
    disableAutoFetch?: boolean;
    /** 是否禁用创建对象 URL */
    disableCreateObjectURL?: boolean;
  }

  /**
   * 渲染选项接口
   */
  interface RenderOptions {
    /** 是否标准化空白字符 */
    normalizeWhitespace?: boolean;
    /** 是否禁用合并文本项 */
    disableCombineTextItems?: boolean;
  }

  /**
   * PDF 解析函数
   * @param dataBuffer PDF 文件的 Buffer 数据
   * @param options 解析选项
   * @returns Promise<PDFData> 解析结果
   */
  function pdfParse(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;

  /**
   * 默认导出 PDF 解析函数
   */
  export = pdfParse;
}

/**
 * PDF-Parse 相关的错误类型
 */
declare module 'pdf-parse/lib/pdf-parse' {
  /**
   * PDF 解析错误类
   */
  export class PDFParseError extends Error {
    constructor(message: string, cause?: Error);
  }
}