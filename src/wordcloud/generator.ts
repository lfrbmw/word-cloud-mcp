import fs from 'fs-extra';
import path from 'path';

/**
 * 词云图配置接口
 */
export interface WordCloudOptions {
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
 * 词云图生成器类
 * 
 * 核心功能：
 * - 智能词频分析和字体大小计算
 * - 螺旋布局算法，避免文字重叠
 * - 多种颜色主题支持
 * - 高质量 SVG 输出
 * - 支持中英文混合文本
 * 
 * 算法特色：
 * - 使用黄金角度螺旋布局，分布更自然
 * - 对数缩放字体大小，层次更明显
 * - 智能碰撞检测，确保文字不重叠
 * - 自适应角度分配，高频词水平显示
 * 
 * @version 1.2.0
 * @author lucianaib
 */
export class WordCloudGenerator {
  
  /**
   * 默认配置选项
   * 参考pyecharts WordCloud的word_size_range=[6, 66]，使用更合理的字体范围
   */
  private readonly defaultOptions: Required<WordCloudOptions> = {
    theme: 'default',
    shape: 'rectangle',
    wordGap: 3,
    fontSize: { min: 16, max: 66 }, // 参考pyecharts的字体范围，避免过大过小
    angleRange: { min: -45, max: 45 }, // 减少角度范围，让布局更整齐
    angleStep: 15,
    outputPath: './wordcloud.svg',
    width: 800,
    height: 600
  };

  /**
   * 预定义的颜色主题
   * 每个主题都经过精心调配，确保视觉效果和可读性
   */
  private readonly colorThemes = {
    // 默认主题：鲜艳丰富的颜色组合
    default: [
      '#FF4444', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', 
      '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5',
      '#009688', '#FFC107', '#673AB7', '#FF5722', '#8BC34A',
      '#CDDC39', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
    ],
    
    // 彩色主题：更加鲜艳的颜色
    colorful: [
      '#FF1744', '#2979FF', '#00E676', '#FF6D00', '#D500F9',
      '#00E5FF', '#6D4C41', '#455A64', '#C51162', '#3D5AFE',
      '#1DE9B6', '#FFD600', '#651FFF', '#FF3D00', '#76FF03',
      '#C6FF00', '#FF4081', '#40C4FF', '#69F0AE', '#B2FF59'
    ],
    
    // 暖色调主题：温馨的红橙黄色系
    warm: [
      '#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569', '#F8B500', 
      '#FF7675', '#FD79A8', '#E17055', '#FDCB6E', '#E84393'
    ],
    
    // 冷色调主题：清爽的蓝绿色系
    cool: [
      '#0984e3', '#74b9ff', '#00b894', '#00cec9', '#6c5ce7', 
      '#a29bfe', '#fd79a8', '#55a3ff', '#26de81', '#45aaf2'
    ],
    
    // 自然主题：大自然的绿色系
    nature: [
      '#00b894', '#00cec9', '#55a3ff', '#fdcb6e', '#6c5ce7', 
      '#fd79a8', '#e17055', '#81ecec', '#74b9ff', '#a29bfe'
    ],
    
    // 商务主题：专业的深色系
    business: [
      '#2d3436', '#636e72', '#74b9ff', '#0984e3', '#00b894', 
      '#fdcb6e', '#e17055', '#6c5ce7', '#fd79a8', '#55a3ff'
    ]
  };

  /**
   * 生成词云图
   * @param text 文本内容
   * @param options 配置选项
   * @returns 输出文件路径
   * @throws {Error} 当生成失败时抛出错误
   */
  async generate(text: string, options: WordCloudOptions = {}): Promise<string> {
    const config = { ...this.defaultOptions, ...options };
    
    // 确保输出路径是 SVG 格式
    if (!config.outputPath.endsWith('.svg')) {
      const ext = path.extname(config.outputPath);
      config.outputPath = config.outputPath.replace(ext, '.svg');
    }
    
    try {
      // 1. 分析词频
      const wordFrequencies = this.analyzeWordFrequency(text);
      
      if (wordFrequencies.length === 0) {
        throw new Error('没有找到有效的词汇来生成词云图');
      }

      // 2. 准备词汇项
      const wordItems = this.prepareWordItems(wordFrequencies, config);

      // 3. 智能布局词汇
      const layoutedWords = this.smartLayoutWords(wordItems, config);

      // 4. 生成 SVG
      const svgContent = this.generateSVG(layoutedWords, config);

      // 5. 保存文件
      const outputPath = await this.saveFile(svgContent, config.outputPath);

      return outputPath;
    } catch (error) {
      throw new Error(`词云图生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 分析词频
   * 统计文本中每个词汇的出现频率，并按频率排序
   * @param text 文本内容
   * @returns 词频统计结果，按频率降序排列
   */
  private analyzeWordFrequency(text: string): Array<{ word: string; frequency: number }> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const frequencyMap = new Map<string, number>();

    // 统计词频
    words.forEach(word => {
      const cleanWord = word.trim();
      if (cleanWord.length > 0) {
        frequencyMap.set(cleanWord, (frequencyMap.get(cleanWord) || 0) + 1);
      }
    });

    // 转换为数组并排序
    const result = Array.from(frequencyMap.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 120); // 增加到120个词汇，提供更丰富的内容

    return result;
  }

  /**
   * 准备词汇项
   * 为每个词汇计算字体大小、颜色、角度等属性
   * @param wordFrequencies 词频统计
   * @param config 配置
   * @returns 词汇项数组
   */
  private prepareWordItems(
    wordFrequencies: Array<{ word: string; frequency: number }>,
    config: Required<WordCloudOptions>
  ): WordItem[] {
    if (wordFrequencies.length === 0) {
      return [];
    }

    const maxFreq = Math.max(...wordFrequencies.map(item => item.frequency));
    const minFreq = Math.min(...wordFrequencies.map(item => item.frequency));
    const colors = this.colorThemes[config.theme as keyof typeof this.colorThemes] || this.colorThemes.default;

    return wordFrequencies.map((item, index) => {
      // 计算字体大小（使用对数缩放，让层次更明显）
      const fontSize = this.calculateFontSize(item.frequency, minFreq, maxFreq, config.fontSize);

      // 选择颜色（高频词使用更鲜艳的颜色）
      const color = this.selectColorInternal(colors, index, item.frequency, maxFreq);

      // 计算角度（高频词倾向于水平显示）
      const angle = this.calculateAngle(index, config.angleRange, config.angleStep);

      // 估算文字尺寸
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
   * 计算字体大小
   * 使用更平衡的缩放算法，参考pyecharts WordCloud的字体范围
   * @param frequency 词频
   * @param minFreq 最小频率
   * @param maxFreq 最大频率
   * @param fontSizeRange 字体大小范围
   * @returns 计算出的字体大小
   */
  private calculateFontSize(
    frequency: number, 
    minFreq: number, 
    maxFreq: number, 
    fontSizeRange: { min: number; max: number }
  ): number {
    if (maxFreq === minFreq) {
      return (fontSizeRange.min + fontSizeRange.max) / 2;
    }

    // 归一化频率到 [0, 1] 范围
    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
    
    // 使用更温和的缩放算法，避免字体大小差异过于极端
    // 参考pyecharts的word_size_range=[6, 66]，保持合理的字体大小比例
    const scaledFreq = Math.pow(normalizedFreq, 0.5); // 使用0.5次方，比平方根更温和
    
    // 计算字体大小，确保分布更均匀
    const sizeRange = fontSizeRange.max - fontSizeRange.min;
    const calculatedSize = fontSizeRange.min + scaledFreq * sizeRange;
    
    // 限制最大字体大小，避免过于突出
    const maxAllowedSize = fontSizeRange.min + sizeRange * 0.8; // 最大不超过80%范围
    
    return Math.min(calculatedSize, maxAllowedSize);
  }

  /**
   * 选择颜色（内部使用）
   * 根据词频和位置智能选择颜色
   * @param colors 颜色数组
   * @param index 词汇索引
   * @param frequency 词频
   * @param maxFreq 最大词频
   * @returns 选择的颜色
   */
  private selectColorInternal(
    colors: string[], 
    index: number, 
    frequency: number, 
    maxFreq: number
  ): string {
    // 高频词使用更鲜艳的颜色（数组前部的颜色）
    const frequencyRatio = frequency / maxFreq;
    
    if (frequencyRatio > 0.8) {
      // 最高频词使用最鲜艳的颜色
      return colors[index % Math.min(5, colors.length)];
    } else if (frequencyRatio > 0.5) {
      // 中高频词使用中等鲜艳度的颜色
      return colors[index % Math.min(10, colors.length)];
    } else {
      // 低频词使用全部颜色范围
      return colors[index % colors.length];
    }
  }

  /**
   * 计算角度
   * 高频词倾向于水平显示，低频词可以有更多角度变化
   * @param index 词汇索引
   * @param angleRange 角度范围
   * @param angleStep 角度步长
   * @returns 计算出的角度
   */
  private calculateAngle(
    index: number, 
    angleRange: { min: number; max: number }, 
    angleStep: number
  ): number {
    const angles = this.generateAngles(angleRange, angleStep);
    
    if (index < 5) {
      // 前5个高频词保持水平
      return 0;
    } else if (index < 15) {
      // 中频词使用较小角度
      const smallAngles = angles.filter(angle => Math.abs(angle) <= 30);
      return smallAngles[Math.floor(Math.random() * smallAngles.length)] || 0;
    } else {
      // 低频词可以使用任意角度
      return angles[Math.floor(Math.random() * angles.length)];
    }
  }

  /**
   * 生成角度数组
   * @param angleRange 角度范围
   * @param angleStep 角度步长
   * @returns 角度数组
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
   * 根据文字内容、字体大小和角度估算占用空间
   * @param text 文字内容
   * @param fontSize 字体大小
   * @param angle 旋转角度
   * @returns 估算的宽度和高度
   */
  private estimateTextDimensions(text: string, fontSize: number, angle: number): { width: number; height: number } {
    // 基础尺寸计算
    let baseWidth = 0;
    for (const char of text) {
      if (/[\u4e00-\u9fff]/.test(char)) {
        // 中文字符，通常是正方形
        baseWidth += fontSize;
      } else {
        // 英文字符，宽度约为字体大小的0.6倍
        baseWidth += fontSize * 0.6;
      }
    }
    
    const baseHeight = fontSize * 1.2; // 行高通常是字体大小的1.2倍
    
    // 考虑旋转角度的影响
    if (angle === 0) {
      return { width: baseWidth, height: baseHeight };
    }
    
    const radians = (Math.abs(angle) * Math.PI) / 180;
    const rotatedWidth = Math.abs(baseWidth * Math.cos(radians)) + Math.abs(baseHeight * Math.sin(radians));
    const rotatedHeight = Math.abs(baseWidth * Math.sin(radians)) + Math.abs(baseHeight * Math.cos(radians));
    
    return { width: rotatedWidth, height: rotatedHeight };
  }

  /**
   * 智能布局词汇
   * 使用更规整的布局算法，参考经典词云的分布模式
   * @param wordItems 词汇项
   * @param config 配置
   * @returns 布局后的词汇项
   */
  private smartLayoutWords(wordItems: WordItem[], config: Required<WordCloudOptions>): WordItem[] {
    const layoutedWords: WordItem[] = [];
    const occupiedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

    const centerX = config.width / 2;
    const centerY = config.height / 2;

    // 按字体大小分组，优先放置大字体
    const sortedWords = [...wordItems].sort((a, b) => b.fontSize - a.fontSize);

    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      let placed = false;

      if (i === 0) {
        // 第一个词（最大字体）放在中心
        word.x = centerX - word.width / 2;
        word.y = centerY - word.height / 2;
        placed = true;
      } else {
        // 使用更规整的螺旋算法
        placed = this.findPositionOrderedSpiral(word, centerX, centerY, occupiedAreas, config);
      }

      if (placed) {
        // 确保在画布范围内
        word.x = Math.max(config.wordGap, Math.min(config.width - word.width - config.wordGap, word.x));
        word.y = Math.max(config.wordGap, Math.min(config.height - word.height - config.wordGap, word.y));

        // 记录占用区域，使用适中的间距
        const gap = Math.max(config.wordGap, word.fontSize / 10);
        const wordArea = {
          x: word.x - gap,
          y: word.y - gap,
          width: word.width + gap * 2,
          height: word.height + gap * 2
        };

        occupiedAreas.push(wordArea);
        layoutedWords.push(word);
      }
    }

    return layoutedWords;
  }

  /**
   * 有序螺旋布局算法
   * 使用更规整的螺旋模式，减少随机性
   * @param word 词汇项
   * @param centerX 中心X坐标
   * @param centerY 中心Y坐标
   * @param occupiedAreas 已占用区域
   * @param config 配置
   * @returns 是否成功放置
   */
  private findPositionOrderedSpiral(
    word: WordItem,
    centerX: number,
    centerY: number,
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    config: Required<WordCloudOptions>
  ): boolean {
    const maxRadius = Math.min(config.width, config.height) / 2 - Math.max(word.width, word.height);
    
    // 使用固定的步长，让分布更规整
    const radiusStep = Math.max(2, word.fontSize / 8);
    
    // 起始半径根据字体大小调整，但更保守
    const startRadius = Math.max(word.fontSize / 2, 20);

    for (let radius = startRadius; radius < maxRadius; radius += radiusStep) {
      // 使用固定的角度数量，让分布更规整
      const numAngles = Math.max(8, Math.floor(radius / 8));
      
      for (let i = 0; i < numAngles; i++) {
        // 使用均匀分布的角度，减少随机性
        const angle = (i * 2 * Math.PI) / numAngles;
        
        // 轻微的椭圆变形，但不要太明显
        const ellipseRatioX = 1 + Math.sin(angle) * 0.1;
        const ellipseRatioY = 1 + Math.cos(angle) * 0.1;
        
        const x = centerX + radius * Math.cos(angle) * ellipseRatioX - word.width / 2;
        const y = centerY + radius * Math.sin(angle) * ellipseRatioY - word.height / 2;

        // 检查是否在画布范围内
        const margin = 10;
        if (x < margin || y < margin || 
            x + word.width > config.width - margin || 
            y + word.height > config.height - margin) {
          continue;
        }

        word.x = x;
        word.y = y;

        // 使用适中的间距
        const gap = Math.max(config.wordGap, word.fontSize / 12);
        const wordArea = {
          x: word.x - gap,
          y: word.y - gap,
          width: word.width + gap * 2,
          height: word.height + gap * 2
        };

        // 检查是否与已放置的词汇重叠
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
   * @param area1 区域1
   * @param area2 区域2
   * @returns 是否重叠
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
   * 生成 SVG 内容
   * 创建高质量的 SVG 词云图
   * @param words 词汇项数组
   * @param config 配置
   * @returns SVG 字符串
   */
  private generateSVG(words: WordItem[], config: Required<WordCloudOptions>): string {
    const svgElements = words.map(word => {
      const x = word.x + word.width / 2;
      const y = word.y + word.height / 2;
      
      // 根据频率决定字体粗细
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
     xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${config.width} ${config.height}">
  <defs>
    <style>
      <![CDATA[
        text {
          font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', Arial, sans-serif;
          user-select: none;
        }
        svg {
          background-color: white;
        }
      ]]>
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
  ${svgElements}
</svg>`;
  }

  /**
   * 转义 XML 特殊字符
   * @param text 文本
   * @returns 转义后的文本
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
   * 支持自动生成唯一文件名，避免覆盖
   * @param content 文件内容
   * @param outputPath 输出路径
   * @returns 实际保存的文件路径
   * @throws {Error} 当保存失败时抛出错误
   */
  private async saveFile(content: string, outputPath: string): Promise<string> {
    try {
      // 处理路径，支持绝对路径和相对路径
      let resolvedPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      
      // 确保输出目录存在
      const dir = path.dirname(resolvedPath);
      await fs.ensureDir(dir);

      // 生成唯一的文件名（如果文件已存在）
      let finalPath = resolvedPath;
      let counter = 1;
      
      while (await fs.pathExists(finalPath)) {
        const ext = path.extname(resolvedPath);
        const name = path.basename(resolvedPath, ext);
        const dir = path.dirname(resolvedPath);
        finalPath = path.join(dir, `${name}_${counter}${ext}`);
        counter++;
      }

      // 保存文件
      await fs.writeFile(finalPath, content, 'utf-8');

      return finalPath;
    } catch (error) {
      throw new Error(`保存文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取支持的主题列表
   * @returns 主题名称数组
   */
  getSupportedThemes(): string[] {
    return Object.keys(this.colorThemes);
  }

  /**
   * 获取主题颜色
   * @param theme 主题名称
   * @returns 颜色数组
   */
  getThemeColors(theme: string): string[] {
    return this.colorThemes[theme as keyof typeof this.colorThemes] || this.colorThemes.default;
  }



  /**
   * 验证配置选项
   * @param options 配置选项
   * @returns 验证结果
   */
  validateOptions(options: WordCloudOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.width && (options.width < 100 || options.width > 5000)) {
      errors.push('宽度必须在 100-5000 像素之间');
    }

    if (options.height && (options.height < 100 || options.height > 5000)) {
      errors.push('高度必须在 100-5000 像素之间');
    }

    if (options.fontSize) {
      if (options.fontSize.min < 8 || options.fontSize.min > 200) {
        errors.push('最小字体大小必须在 8-200 像素之间');
      }
      if (options.fontSize.max < 8 || options.fontSize.max > 200) {
        errors.push('最大字体大小必须在 8-200 像素之间');
      }
      if (options.fontSize.min >= options.fontSize.max) {
        errors.push('最小字体大小必须小于最大字体大小');
      }
    }

    if (options.theme && !this.getSupportedThemes().includes(options.theme)) {
      errors.push(`不支持的主题: ${options.theme}。支持的主题: ${this.getSupportedThemes().join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
