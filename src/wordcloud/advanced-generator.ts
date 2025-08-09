import fs from 'fs-extra';
import path from 'path';

/**
 * 高级词云图配置接口
 */
export interface AdvancedWordCloudOptions {
  theme?: string;
  shape?: string;
  wordGap?: number;
  fontSize?: {
    min: number;
    max: number;
  };
  angleRange?: {
    min: number;
    max: number;
  };
  angleStep?: number;
  outputPath?: string;
  width?: number;
  height?: number;
}

/**
 * 词汇项接口
 */
interface WordItem {
  text: string;
  frequency: number;
  fontSize: number;
  color: string;
  angle: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 高级词云图生成器类
 * 
 * 功能特色：
 * - 智能词频分析和过滤
 * - 高级布局算法（螺旋布局、密度优化）
 * - 多主题颜色方案
 * - 自适应字体大小计算
 * - 智能角度分布
 * - 碰撞检测和避让
 * 
 * 技术实现：
 * - 使用对数缩放优化字体大小分布
 * - 实现螺旋布局算法避免词汇重叠
 * - 支持多种形状布局（矩形、圆形等）
 * - 智能颜色选择基于词频权重
 * - 高效的空间占用检测算法
 * 
 * @version 1.1.0
 * @author lucianaib
 */
export class AdvancedWordCloudGenerator {
  
  /**
   * 默认配置选项
   */
  private readonly defaultOptions: Required<AdvancedWordCloudOptions> = {
    theme: 'default',
    shape: 'rectangle',
    wordGap: 4,
    fontSize: { min: 12, max: 80 },
    angleRange: { min: -45, max: 45 },
    angleStep: 15,
    outputPath: './wordcloud.svg',
    width: 800,
    height: 600
  };

  /**
   * 预定义的颜色主题
   */
  private readonly colorThemes = {
    default: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#FF7675', '#74b9ff', '#55a3ff'
    ],
    warm: [
      '#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569', '#F8B500', 
      '#FF7675', '#FD79A8', '#E17055', '#FDCB6E', '#E84393'
    ],
    cool: [
      '#0984e3', '#74b9ff', '#00b894', '#00cec9', '#6c5ce7', 
      '#a29bfe', '#fd79a8', '#55a3ff', '#26de81', '#45aaf2'
    ],
    nature: [
      '#00b894', '#00cec9', '#55a3ff', '#fdcb6e', '#6c5ce7', 
      '#fd79a8', '#e17055', '#81ecec', '#74b9ff', '#a29bfe'
    ],
    business: [
      '#2d3436', '#636e72', '#74b9ff', '#0984e3', '#00b894', 
      '#fdcb6e', '#e17055', '#6c5ce7', '#fd79a8', '#55a3ff'
    ]
  };

  /**
   * 生成高级词云图
   * @param text 文本内容
   * @param options 配置选项
   * @returns 输出文件路径
   */
  async generate(text: string, options: AdvancedWordCloudOptions = {}): Promise<string> {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // 1. 高级词频分析
      const wordFrequencies = this.advancedWordFrequencyAnalysis(text);
      
      if (wordFrequencies.length === 0) {
        throw new Error('没有找到有效的词汇来生成词云图');
      }

      // 2. 准备词汇项（包含智能字体大小和颜色分配）
      const wordItems = this.prepareAdvancedWordItems(wordFrequencies, config);

      // 3. 高级布局算法
      const layoutedWords = this.advancedLayoutWords(wordItems, config);

      // 4. 生成 SVG 内容
      const svgContent = this.generateAdvancedSVG(layoutedWords, config);

      // 5. 保存文件
      const outputPath = await this.saveFile(svgContent, config.outputPath);
      
      return outputPath;
    } catch (error) {
      throw new Error(`高级词云图生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 高级词频分析
   * 包含智能过滤、词汇清理和频率优化
   */
  private advancedWordFrequencyAnalysis(text: string): Array<{ word: string; frequency: number }> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // 1. 基础分词和清理
    const words = this.tokenizeAndClean(text);
    
    // 2. 构建频率映射
    const frequencyMap = new Map<string, number>();
    words.forEach(word => {
      frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
    });

    // 3. 过滤和排序
    const filteredWords = Array.from(frequencyMap.entries())
      .filter(([word, frequency]) => this.isValidWord(word, frequency))
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    // 4. 智能截取（保留最重要的词汇）
    return this.selectTopWords(filteredWords, 120); // 增加到120个词汇
  }

  /**
   * 分词和清理
   */
  private tokenizeAndClean(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文、英文、数字
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
  }

  /**
   * 验证词汇是否有效
   */
  private isValidWord(word: string, frequency: number): boolean {
    // 过滤太短的词 - 更宽松，允许单字符的有意义词汇
    if (word.length < 1) return false;
    
    // 过滤频率太低的词
    if (frequency < 1) return false;
    
    // 更精简的停用词列表，只过滤最常见的无意义词汇
    const stopWords = new Set([
      // 英文停用词（减少）
      'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were',
      // 中文停用词（减少）
      '的', '了', '是', '在', '有', '和', '就', '不', '都', '一个', '也', '很', '到', '你', '我', '他', '她'
    ]);
    
    // 对于单字符，特殊处理
    if (word.length === 1) {
      // 保留数字
      if (/\d/.test(word)) return true;
      // 保留有意义的中文字符
      const meaningfulChars = new Set(['人', '事', '物', '时', '地', '法', '理', '情', '心', '力', '美', '好', '新', '大', '小', '高', '低', '快', '慢', '多', '少']);
      if (meaningfulChars.has(word)) return true;
      // 过滤单个英文字母（除了一些特殊情况）
      if (/[a-zA-Z]/.test(word)) return false;
    }
    
    return !stopWords.has(word.toLowerCase());
  }

  /**
   * 选择顶级词汇
   */
  private selectTopWords(
    words: Array<{ word: string; frequency: number }>, 
    maxCount: number
  ): Array<{ word: string; frequency: number }> {
    if (words.length <= maxCount) {
      return words;
    }

    // 使用智能选择算法，确保词汇多样性
    const selected: Array<{ word: string; frequency: number }> = [];
    const frequencyThreshold = words[0].frequency * 0.1; // 10% 的最高频率作为阈值

    // 首先选择高频词
    const highFreqWords = words.filter(w => w.frequency >= frequencyThreshold);
    selected.push(...highFreqWords.slice(0, Math.min(maxCount * 0.7, highFreqWords.length)));

    // 然后从剩余词汇中选择有代表性的词
    const remaining = words.filter(w => w.frequency < frequencyThreshold);
    const remainingSlots = maxCount - selected.length;
    
    if (remainingSlots > 0 && remaining.length > 0) {
      const step = Math.max(1, Math.floor(remaining.length / remainingSlots));
      for (let i = 0; i < remaining.length && selected.length < maxCount; i += step) {
        selected.push(remaining[i]);
      }
    }

    return selected.slice(0, maxCount);
  }

  /**
   * 准备高级词汇项
   */
  private prepareAdvancedWordItems(
    wordFrequencies: Array<{ word: string; frequency: number }>,
    config: Required<AdvancedWordCloudOptions>
  ): WordItem[] {
    if (wordFrequencies.length === 0) {
      return [];
    }

    const maxFreq = Math.max(...wordFrequencies.map(item => item.frequency));
    const minFreq = Math.min(...wordFrequencies.map(item => item.frequency));
    const colors = this.colorThemes[config.theme as keyof typeof this.colorThemes] || this.colorThemes.default;

    return wordFrequencies.map((item, index) => {
      const fontSize = this.calculateAdvancedFontSize(item.frequency, minFreq, maxFreq, config.fontSize);
      const color = this.selectAdvancedColor(colors, index, wordFrequencies.length, item.frequency);
      const angle = this.calculateAdvancedAngle(index, item.frequency, maxFreq, config.angleRange, config.angleStep);
      const dimensions = this.estimateTextDimensions(item.word, fontSize, angle);

      return {
        text: item.word,
        frequency: item.frequency,
        fontSize: Math.round(fontSize),
        color,
        angle,
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height
      };
    });
  }

  /**
   * 高级字体大小计算
   * 使用对数缩放和权重调整
   */
  private calculateAdvancedFontSize(
    frequency: number, 
    minFreq: number, 
    maxFreq: number, 
    fontSizeRange: { min: number; max: number }
  ): number {
    if (maxFreq === minFreq) {
      return (fontSizeRange.min + fontSizeRange.max) / 2;
    }

    // 归一化频率
    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
    
    // 使用对数缩放，让字体大小分布更合理
    const logScale = Math.log(normalizedFreq + 1) / Math.log(2);
    
    // 应用平滑曲线，增强视觉效果
    const enhancedScale = Math.pow(logScale, 0.8);
    
    return fontSizeRange.min + enhancedScale * (fontSizeRange.max - fontSizeRange.min);
  }

  /**
   * 高级颜色选择
   * 基于频率权重和视觉平衡
   */
  private selectAdvancedColor(
    colors: string[], 
    index: number, 
    frequency: number,
    maxFreq: number
  ): string {
    const frequencyRatio = frequency / maxFreq;
    
    // 高频词使用更鲜艳的颜色
    if (frequencyRatio > 0.8) {
      return colors[index % Math.min(5, colors.length)];
    } else if (frequencyRatio > 0.5) {
      return colors[index % Math.min(10, colors.length)];
    } else {
      // 低频词使用更多样的颜色
      return colors[index % colors.length];
    }
  }

  /**
   * 高级角度计算
   * 基于词汇重要性和视觉平衡
   */
  private calculateAdvancedAngle(
    index: number, 
    frequency: number, 
    maxFreq: number, 
    angleRange: { min: number; max: number }, 
    angleStep: number
  ): number {
    const angles = this.generateAngles(angleRange, angleStep);
    const frequencyRatio = frequency / maxFreq;
    
    // 高频词倾向于水平放置
    if (index < 5 || frequencyRatio > 0.7) {
      return 0;
    } else if (index < 15 || frequencyRatio > 0.4) {
      // 中频词使用小角度
      const smallAngles = angles.filter(angle => Math.abs(angle) <= 30);
      return smallAngles[Math.floor(Math.random() * smallAngles.length)] || 0;
    } else {
      // 低频词可以使用任意角度
      return angles[Math.floor(Math.random() * angles.length)];
    }
  }

  /**
   * 生成角度数组
   */
  private generateAngles(angleRange: { min: number; max: number }, angleStep: number): number[] {
    const angles: number[] = [];
    for (let angle = angleRange.min; angle <= angleRange.max; angle += angleStep) {
      angles.push(angle);
    }
    return angles.length > 0 ? angles : [0];
  }

  /**
   * 估算文字尺寸
   */
  private estimateTextDimensions(text: string, fontSize: number, angle: number): { width: number; height: number } {
    // 基础尺寸计算
    let baseWidth = 0;
    for (const char of text) {
      if (/[\u4e00-\u9fff]/.test(char)) {
        // 中文字符
        baseWidth += fontSize;
      } else {
        // 英文字符
        baseWidth += fontSize * 0.6;
      }
    }
    
    const baseHeight = fontSize * 1.2;
    
    // 如果没有旋转，直接返回基础尺寸
    if (angle === 0) {
      return { width: baseWidth, height: baseHeight };
    }
    
    // 计算旋转后的边界框
    const radians = (Math.abs(angle) * Math.PI) / 180;
    const rotatedWidth = Math.abs(baseWidth * Math.cos(radians)) + Math.abs(baseHeight * Math.sin(radians));
    const rotatedHeight = Math.abs(baseWidth * Math.sin(radians)) + Math.abs(baseHeight * Math.cos(radians));
    
    return { width: rotatedWidth, height: rotatedHeight };
  }

  /**
   * 高级布局算法
   * 使用改进的螺旋布局和密度优化
   */
  private advancedLayoutWords(wordItems: WordItem[], config: Required<AdvancedWordCloudOptions>): WordItem[] {
    const layoutedWords: WordItem[] = [];
    const occupiedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

    const centerX = config.width / 2;
    const centerY = config.height / 2;

    for (let i = 0; i < wordItems.length; i++) {
      const word = wordItems[i];
      let placed = false;

      if (i === 0) {
        // 第一个词放在中心
        word.x = centerX - word.width / 2;
        word.y = centerY - word.height / 2;
        placed = true;
      } else {
        // 使用改进的螺旋算法
        placed = this.findPositionAdvancedSpiral(word, centerX, centerY, occupiedAreas, config);
      }

      if (placed) {
        // 确保词汇在画布范围内
        word.x = Math.max(config.wordGap, Math.min(config.width - word.width - config.wordGap, word.x));
        word.y = Math.max(config.wordGap, Math.min(config.height - word.height - config.wordGap, word.y));

        // 记录占用区域
        const wordArea = {
          x: word.x - config.wordGap,
          y: word.y - config.wordGap,
          width: word.width + config.wordGap * 2,
          height: word.height + config.wordGap * 2
        };

        occupiedAreas.push(wordArea);
        layoutedWords.push(word);
      }
    }

    return layoutedWords;
  }

  /**
   * 改进的螺旋算法寻找位置
   */
  private findPositionAdvancedSpiral(
    word: WordItem,
    centerX: number,
    centerY: number,
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    config: Required<AdvancedWordCloudOptions>
  ): boolean {
    const maxRadius = Math.min(config.width, config.height) / 2;
    const radiusStep = Math.max(1, word.fontSize / 10); // 根据字体大小调整步长
    const angleStep = Math.PI / 12; // 更细的角度步长

    for (let radius = 10; radius < maxRadius; radius += radiusStep) {
      // 动态调整角度步长，内圈更密集
      const currentAngleStep = angleStep * (1 + radius / maxRadius);
      
      for (let angle = 0; angle < 2 * Math.PI; angle += currentAngleStep) {
        const x = centerX + radius * Math.cos(angle) - word.width / 2;
        const y = centerY + radius * Math.sin(angle) - word.height / 2;

        // 检查是否在画布范围内
        if (x < 0 || y < 0 || x + word.width > config.width || y + word.height > config.height) {
          continue;
        }

        word.x = x;
        word.y = y;

        // 创建词汇区域（包含间隙）
        const wordArea = {
          x: word.x - config.wordGap,
          y: word.y - config.wordGap,
          width: word.width + config.wordGap * 2,
          height: word.height + config.wordGap * 2
        };

        // 检查是否与已有词汇重叠
        const hasOverlap = occupiedAreas.some(area => 
          this.isOverlapping(wordArea, area)
        );

        if (!hasOverlap) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 检查两个区域是否重叠
   */
  private isOverlapping(
    area1: { x: number; y: number; width: number; height: number },
    area2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      area1.x + area1.width < area2.x ||
      area2.x + area2.width < area1.x ||
      area1.y + area1.height < area2.y ||
      area2.y + area2.height < area1.y
    );
  }

  /**
   * 生成高级 SVG 内容
   */
  private generateAdvancedSVG(words: WordItem[], config: Required<AdvancedWordCloudOptions>): string {
    const svgElements = words.map(word => {
      const x = word.x + word.width / 2;
      const y = word.y + word.height / 2;
      const fontWeight = word.frequency > 3 ? 'bold' : 'normal';
      
      return `<text x="${x}" y="${y}" 
                    font-family="'Microsoft YaHei', 'PingFang SC', 'SimHei', Arial, sans-serif" 
                    font-size="${word.fontSize}" 
                    fill="${word.color}" 
                    text-anchor="middle" 
                    dominant-baseline="middle"
                    font-weight="${fontWeight}"
                    transform="rotate(${word.angle} ${x} ${y})">
                ${this.escapeXml(word.text)}
              </text>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${config.width}" height="${config.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${svgElements}
</svg>`;
  }

  /**
   * 转义 XML 特殊字符
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 保存文件
   */
  private async saveFile(content: string, outputPath: string): Promise<string> {
    try {
      // 解析输出路径
      let resolvedPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      
      // 确保目录存在
      const dir = path.dirname(resolvedPath);
      await fs.ensureDir(dir);

      // 处理文件名冲突
      let finalPath = resolvedPath;
      let counter = 1;
      
      while (await fs.pathExists(finalPath)) {
        const ext = path.extname(resolvedPath);
        const name = path.basename(resolvedPath, ext);
        const dir = path.dirname(resolvedPath);
        finalPath = path.join(dir, `${name}_${counter}${ext}`);
        counter++;
      }

      // 写入文件
      await fs.writeFile(finalPath, content, 'utf-8');
      
      return finalPath;
    } catch (error) {
      throw new Error(`保存文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取支持的主题列表
   */
  getSupportedThemes(): string[] {
    return Object.keys(this.colorThemes);
  }

  /**
   * 获取默认配置
   */
  getDefaultOptions(): Required<AdvancedWordCloudOptions> {
    return { ...this.defaultOptions };
  }
}