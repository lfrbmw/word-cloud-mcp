/**
 * NodeJieba 中文分词库的 TypeScript 类型定义
 * 
 * 为 Node.js 版本的 jieba 分词库提供完整的类型支持
 * 支持精确分词、全模式分词、搜索引擎模式、关键词提取等功能
 * 
 * @version 1.0.0
 * @author lucianaib
 */

declare module 'nodejieba' {
  /**
   * 关键词提取结果接口
   */
  interface ExtractResult {
    /** 关键词文本 */
    word: string;
    /** 权重值 */
    weight: number;
  }

  /**
   * 词性标注结果接口
   */
  interface TagResult {
    /** 词汇文本 */
    word: string;
    /** 词性标签 */
    tag: string;
  }

  /**
   * TF-IDF 提取选项接口
   */
  interface TFIDFOptions {
    /** 返回的关键词数量 */
    topK?: number;
    /** 允许的词性列表 */
    allowPOS?: string[];
  }

  /**
   * TextRank 提取选项接口
   */
  interface TextRankOptions {
    /** 返回的关键词数量 */
    topK?: number;
    /** 窗口大小 */
    span?: number;
    /** 允许的词性列表 */
    allowPOS?: string[];
  }

  /**
   * 基于 TF-IDF 算法的关键词提取
   * @param text 待分析文本
   * @param topK 返回的关键词数量，默认为 20
   * @returns 关键词提取结果数组
   */
  export function extract(text: string, topK?: number): ExtractResult[];

  /**
   * 精确分词
   * @param text 待分词文本
   * @param cutAll 是否全模式分词，默认为 false
   * @returns 分词结果数组
   */
  export function cut(text: string, cutAll?: boolean): string[];

  /**
   * 基于 HMM 模型的分词
   * @param text 待分词文本
   * @returns 分词结果数组
   */
  export function cutHMM(text: string): string[];

  /**
   * 全模式分词
   * @param text 待分词文本
   * @returns 分词结果数组
   */
  export function cutAll(text: string): string[];

  /**
   * 搜索引擎模式分词
   * @param text 待分词文本
   * @param hmm 是否启用 HMM 模型，默认为 true
   * @returns 分词结果数组
   */
  export function cutForSearch(text: string, hmm?: boolean): string[];

  /**
   * 词性标注
   * @param text 待标注文本
   * @returns 词性标注结果数组
   */
  export function tag(text: string): TagResult[];

  /**
   * 基于 TextRank 算法的关键词提取
   * @param text 待分析文本
   * @param options 提取选项
   * @returns 关键词提取结果数组
   */
  export function textRankExtract(text: string, options?: TextRankOptions): ExtractResult[];

  /**
   * 基于 TF-IDF 算法的关键词提取（高级版本）
   * @param text 待分析文本
   * @param options 提取选项
   * @returns 关键词提取结果数组
   */
  export function tfidfExtract(text: string, options?: TFIDFOptions): ExtractResult[];

  /**
   * 向词典中添加自定义词汇
   * @param word 词汇
   * @param freq 词频，可选
   * @param tag 词性标签，可选
   */
  export function insertWord(word: string, freq?: number, tag?: string): void;

  /**
   * 加载词典
   */
  export function load(): void;

  /**
   * 删除自定义词汇
   * @param word 要删除的词汇
   */
  export function deleteWord(word: string): void;

  /**
   * 获取词汇的词频
   * @param word 词汇
   * @returns 词频值
   */
  export function getWordFreq(word: string): number;

  /**
   * 获取词汇的词性标签
   * @param word 词汇
   * @returns 词性标签
   */
  export function getWordTag(word: string): string;
}