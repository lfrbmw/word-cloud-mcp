/**
 * 词云图制作工具的核心类型定义
 * 
 * 包含所有模块共享的接口、类型和常量定义
 * 确保类型安全和代码一致性
 * 
 * @version 1.2.0
 * @author lucianaib
 */

/**
 * 支持的文件类型枚举
 */
export enum SupportedFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  TXT = 'txt',
  MD = 'md',
  MARKDOWN = 'markdown'
}

/**
 * 支持的输出格式枚举
 */
export enum SupportedOutputFormat {
  SVG = 'svg',
  PNG = 'png',
  JPG = 'jpg',
  JPEG = 'jpeg',
  WEBP = 'webp'
}

/**
 * 词云图主题枚举
 */
export enum WordCloudTheme {
  DEFAULT = 'default',
  COLORFUL = 'colorful',
  WARM = 'warm',
  COOL = 'cool',
  NATURE = 'nature',
  BUSINESS = 'business'
}

/**
 * 词云图形状枚举
 */
export enum WordCloudShape {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  ELLIPSE = 'ellipse'
}

/**
 * 基础配置接口
 */
export interface BaseConfig {
  /** 输出文件路径 */
  outputPath?: string;
  /** 画布宽度 */
  width?: number;
  /** 画布高度 */
  height?: number;
}

/**
 * 字体大小范围接口
 */
export interface FontSizeRange {
  /** 最小字体大小 */
  min: number;
  /** 最大字体大小 */
  max: number;
}

/**
 * 角度范围接口
 */
export interface AngleRange {
  /** 最小角度 */
  min: number;
  /** 最大角度 */
  max: number;
}

/**
 * 词云图配置接口
 */
export interface WordCloudConfig extends BaseConfig {
  /** 主题 */
  theme?: WordCloudTheme | string;
  /** 形状 */
  shape?: WordCloudShape | string;
  /** 词汇间隙 */
  wordGap?: number;
  /** 字体大小范围 */
  fontSize?: FontSizeRange;
  /** 角度范围 */
  angleRange?: AngleRange;
  /** 角度步长 */
  angleStep?: number;
}

/**
 * 多格式词云图配置接口
 */
export interface MultiFormatWordCloudConfig extends WordCloudConfig {
  /** 输出格式 */
  format?: SupportedOutputFormat | string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 图片质量（1-100） */
  quality?: number;
}

/**
 * 词汇项接口
 */
export interface WordItem {
  /** 词汇文本 */
  text: string;
  /** 出现频率 */
  frequency: number;
  /** 字体大小 */
  fontSize: number;
  /** 颜色 */
  color: string;
  /** 旋转角度 */
  angle: number;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 词频统计结果接口
 */
export interface WordFrequency {
  /** 词汇 */
  word: string;
  /** 频率 */
  frequency: number;
}

/**
 * 文本尺寸接口
 */
export interface TextDimensions {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 矩形区域接口
 */
export interface Rectangle {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  /** 文件路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  type: string;
  /** 是否支持 */
  supported: boolean;
  /** 是否存在 */
  exists: boolean;
}

/**
 * 文本清理统计接口
 */
export interface CleaningStats {
  /** 原始字符数 */
  originalLength: number;
  /** 清理后字符数 */
  cleanedLength: number;
  /** 原始词汇数 */
  originalWordCount: number;
  /** 清理后词汇数 */
  cleanedWordCount: number;
  /** 词汇减少率（百分比） */
  reductionRate: number;
  /** 字符压缩率（百分比） */
  compressionRatio: number;
}

/**
 * 文本质量评估结果接口
 */
export interface TextQualityAssessment {
  /** 质量评分（0-100） */
  score: number;
  /** 发现的问题 */
  issues: string[];
  /** 改进建议 */
  suggestions: string[];
}

/**
 * 高级清理选项接口
 */
export interface AdvancedCleaningOptions {
  /** 是否移除数字 */
  removeNumbers?: boolean;
  /** 是否移除短词 */
  removeShortWords?: boolean;
  /** 最小词汇长度 */
  minWordLength?: number;
  /** 最大词汇长度 */
  maxWordLength?: number;
  /** 自定义停用词 */
  customStopWords?: string[];
  /** 是否保持大小写 */
  preserveCase?: boolean;
}

/**
 * 配置验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息列表 */
  errors: string[];
}

/**
 * MCP 工具响应接口
 */
export interface MCPToolResponse {
  /** 响应内容 */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  /** 是否为错误响应 */
  isError?: boolean;
}

/**
 * 颜色主题定义类型
 */
export type ColorTheme = {
  [key in WordCloudTheme]: string[];
};

/**
 * 文件类型映射类型
 */
export type FileTypeMap = {
  [key: string]: SupportedFileType;
};

/**
 * 错误类型枚举
 */
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  SAVE_ERROR = 'SAVE_ERROR'
}

/**
 * 自定义错误类
 */
export class WordCloudError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'WordCloudError';
  }
}

/**
 * 常量定义
 */
export const CONSTANTS = {
  /** 默认配置 */
  DEFAULT_CONFIG: {
    WIDTH: 800,
    HEIGHT: 600,
    WORD_GAP: 2,
    FONT_SIZE_MIN: 14,
    FONT_SIZE_MAX: 120,
    ANGLE_MIN: -90,
    ANGLE_MAX: 90,
    ANGLE_STEP: 15,
    THEME: WordCloudTheme.DEFAULT,
    SHAPE: WordCloudShape.RECTANGLE,
    FORMAT: SupportedOutputFormat.SVG,
    BACKGROUND_COLOR: '#ffffff',
    QUALITY: 90
  },
  
  /** 文件限制 */
  FILE_LIMITS: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_WORDS: 100,
    MIN_TEXT_LENGTH: 10
  },
  
  /** 支持的编码格式 */
  SUPPORTED_ENCODINGS: ['utf-8', 'gbk', 'gb2312'] as const,
  
  /** 黄金角度（弧度） */
  GOLDEN_ANGLE: Math.PI * (3 - Math.sqrt(5)),
  
  /** 螺旋布局参数 */
  SPIRAL_PARAMS: {
    MAX_ATTEMPTS: 5000,
    RADIUS_STEP: 1,
    ANGLE_STEP: Math.PI / 12
  }
} as const;

/**
 * 工具函数类型定义
 */
export type TokenizeFunction = (text: string) => string[];
export type FilterFunction = (word: string) => boolean;
export type ColorSelector = (colors: string[], index: number, total: number) => string;
export type LayoutFunction = (items: WordItem[], config: WordCloudConfig) => WordItem[];