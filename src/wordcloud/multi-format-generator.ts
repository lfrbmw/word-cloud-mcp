import fs from 'fs-extra';
import path from 'path';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';

/**
 * 多格式词云图配置接口
 */
export interface MultiFormatWordCloudOptions {
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
  format?: 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
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
 * 多格式词云图生成器类
 * 
 * 功能特色：
 * - 支持多种输出格式：SVG、PNG、JPG、WebP
 * - 高质量位图渲染，支持抗锯齿
 * - 智能压缩和质量控制
 * - 背景色自定义支持
 * - 与基础生成器兼容的布局算法
 * 
 * 技术实现：
 * - 使用 Canvas API 进行位图渲染
 * - 使用 Sharp 库进行格式转换和优化
 * - 支持高分辨率输出
 * - 智能字体渲染和抗锯齿
 * 
 * @version 1.2.0
 * @author lucianaib
 */
export class MultiFormatWordCloudGenerator {
  
  /**
   * 默认配置选项
   */
  private readonly defaultOptions: Required<MultiFormatWordCloudOptions> = {
    theme: 'default',
    shape: 'rectangle',
    wordGap: 4,
    fontSize: { min: 12, max: 80 },
    angleRange: { min: -45, max: 45 },
    angleStep: 15,
    outputPath: './wordcloud.png',
    format: 'png',
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    quality: 90
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
   * 支持的输出格式
   */
  private readonly supportedFormats = new Set(['svg', 'png', 'jpg', 'jpeg', 'webp']);

  /**
   * 生成多格式词云图
   * @param text 文本内容
   * @param options 配置选项
   * @returns 输出文件路径
   */
  async generate(text: string, options: MultiFormatWordCloudOptions = {}): Promise<string> {
    const config = { ...this.defaultOptions, ...options };
    
    // 验证配置
    this.validateConfig(config);
    
    // 根据格式调整输出路径
    config.outputPath = this.adjustOutputPath(config.outputPath, config.format);
    
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

      // 4. 根据格式生成图片
      let outputPath: string;
      
      if (config.format === 'svg') {
        const svgContent = this.generateSVG(layoutedWords, config);
        outputPath = await this.saveTextFile(svgContent, config.outputPath);
      } else {
        outputPath = await this.generateBitmap(layoutedWords, config);
      }

      return outputPath;
    } catch (error) {
      throw new Error(`多格式词云图生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证配置选项
   */
  private validateConfig(config: Required<MultiFormatWordCloudOptions>): void {
    if (!this.supportedFormats.has(config.format)) {
      throw new Error(`不支持的输出格式: ${config.format}`);
    }

    if (config.width < 100 || config.width > 5000) {
      throw new Error('宽度必须在 100-5000 像素之间');
    }

    if (config.height < 100 || config.height > 5000) {
      throw new Error('高度必须在 100-5000 像素之间');
    }

    if (config.quality < 1 || config.quality > 100) {
      throw new Error('质量参数必须在 1-100 之间');
    }

    if (!config.backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error('背景颜色必须是有效的十六进制颜色代码');
    }
  }

  /**
   * 调整输出路径
   */
  private adjustOutputPath(outputPath: string, format: string): string {
    const ext = path.extname(outputPath);
    const expectedExt = `.${format}`;
    
    if (ext !== expectedExt) {
      return outputPath.replace(ext, expectedExt);
    }
    
    return outputPath;
  }

  /**
   * 分析词频
   */
  private analyzeWordFrequency(text: string): Array<{ word: string; frequency: number }> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const frequencyMap = new Map<string, number>();

    words.forEach(word => {
      const cleanWord = word.trim();
      if (cleanWord.length > 0) {
        frequencyMap.set(cleanWord, (frequencyMap.get(cleanWord) || 0) + 1);
      }
    });

    return Array.from(frequencyMap.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // 增加词汇数量到100个
  }

  /**
   * 准备词汇项
   */
  private prepareWordItems(
    wordFrequencies: Array<{ word: string; frequency: number }>,
    config: Required<MultiFormatWordCloudOptions>
  ): WordItem[] {
    if (wordFrequencies.length === 0) {
      return [];
    }

    const maxFreq = Math.max(...wordFrequencies.map(item => item.frequency));
    const minFreq = Math.min(...wordFrequencies.map(item => item.frequency));
    const colors = this.colorThemes[config.theme as keyof typeof this.colorThemes] || this.colorThemes.default;

    return wordFrequencies.map((item, index) => {
      const fontSize = this.calculateFontSize(item.frequency, minFreq, maxFreq, config.fontSize);
      const color = this.selectColor(colors, index, wordFrequencies.length, item.frequency);
      const angle = this.calculateAngle(index, config.angleRange, config.angleStep);
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

    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
    const logScale = Math.log(normalizedFreq + 1) / Math.log(2);
    const enhancedScale = Math.pow(logScale, 0.8);
    
    return fontSizeRange.min + enhancedScale * (fontSizeRange.max - fontSizeRange.min);
  }

  /**
   * 选择颜色
   */
  private selectColor(
    colors: string[], 
    index: number, 
    frequency: number,
    maxFreq: number
  ): string {
    const frequencyRatio = frequency / maxFreq;
    
    if (frequencyRatio > 0.8) {
      return colors[index % Math.min(5, colors.length)];
    } else if (frequencyRatio > 0.5) {
      return colors[index % Math.min(10, colors.length)];
    } else {
      return colors[index % colors.length];
    }
  }

  /**
   * 计算角度
   */
  private calculateAngle(
    index: number, 
    angleRange: { min: number; max: number }, 
    angleStep: number
  ): number {
    const angles = this.generateAngles(angleRange, angleStep);
    
    if (index < 5) {
      return 0;
    } else if (index < 15) {
      const smallAngles = angles.filter(angle => Math.abs(angle) <= 30);
      return smallAngles[Math.floor(Math.random() * smallAngles.length)] || 0;
    } else {
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
    let baseWidth = 0;
    for (const char of text) {
      if (/[\u4e00-\u9fff]/.test(char)) {
        baseWidth += fontSize;
      } else {
        baseWidth += fontSize * 0.6;
      }
    }
    
    const baseHeight = fontSize * 1.2;
    
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
   */
  private smartLayoutWords(wordItems: WordItem[], config: Required<MultiFormatWordCloudOptions>): WordItem[] {
    const layoutedWords: WordItem[] = [];
    const occupiedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

    const centerX = config.width / 2;
    const centerY = config.height / 2;

    for (let i = 0; i < wordItems.length; i++) {
      const word = wordItems[i];
      let placed = false;

      if (i === 0) {
        word.x = centerX - word.width / 2;
        word.y = centerY - word.height / 2;
        placed = true;
      } else {
        placed = this.findPositionSpiral(word, centerX, centerY, occupiedAreas, config);
      }

      if (placed) {
        word.x = Math.max(config.wordGap, Math.min(config.width - word.width - config.wordGap, word.x));
        word.y = Math.max(config.wordGap, Math.min(config.height - word.height - config.wordGap, word.y));

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
   * 螺旋算法寻找位置
   */
  private findPositionSpiral(
    word: WordItem,
    centerX: number,
    centerY: number,
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    config: Required<MultiFormatWordCloudOptions>
  ): boolean {
    const maxRadius = Math.min(config.width, config.height) / 2;
    const radiusStep = 2;
    const angleStep = Math.PI / 8;

    for (let radius = 10; radius < maxRadius; radius += radiusStep) {
      for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
        const x = centerX + radius * Math.cos(angle) - word.width / 2;
        const y = centerY + radius * Math.sin(angle) - word.height / 2;

        if (x < 0 || y < 0 || x + word.width > config.width || y + word.height > config.height) {
          continue;
        }

        word.x = x;
        word.y = y;

        const wordArea = {
          x: word.x - config.wordGap,
          y: word.y - config.wordGap,
          width: word.width + config.wordGap * 2,
          height: word.height + config.wordGap * 2
        };

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
   * 生成位图格式词云图
   */
  private async generateBitmap(words: WordItem[], config: Required<MultiFormatWordCloudOptions>): Promise<string> {
    try {
      const scale = 2;
      const canvas = createCanvas(config.width * scale, config.height * scale);
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.scale(scale, scale);

      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, config.width, config.height);

      this.drawWords(ctx, words);

      const outputPath = await this.convertAndSave(canvas, config);
      return outputPath;
    } catch (error) {
      throw new Error(`位图生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 在 Canvas 上绘制词汇
   */
  private drawWords(ctx: CanvasRenderingContext2D, words: WordItem[]): void {
    words.forEach(word => {
      ctx.save();
      
      const fontWeight = word.frequency > 3 ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${word.fontSize}px "Microsoft YaHei", "PingFang SC", "SimHei", Arial, sans-serif`;
      ctx.fillStyle = word.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const x = word.x + word.width / 2;
      const y = word.y + word.height / 2;

      if (word.angle !== 0) {
        ctx.translate(x, y);
        ctx.rotate((word.angle * Math.PI) / 180);
        ctx.fillText(word.text, 0, 0);
      } else {
        ctx.fillText(word.text, x, y);
      }

      ctx.restore();
    });
  }

  /**
   * 转换并保存为指定格式
   */
  private async convertAndSave(canvas: any, config: Required<MultiFormatWordCloudOptions>): Promise<string> {
    let buffer: Buffer;
    
    if (config.format === 'png') {
      buffer = canvas.toBuffer('image/png');
    } else {
      const pngBuffer = canvas.toBuffer('image/png');
      let sharpInstance = sharp(pngBuffer);
      
      if (config.format === 'jpg' || config.format === 'jpeg') {
        buffer = await sharpInstance
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer();
      } else if (config.format === 'webp') {
        buffer = await sharpInstance
          .webp({ quality: config.quality })
          .toBuffer();
      } else {
        throw new Error(`不支持的格式: ${config.format}`);
      }
    }

    return await this.saveBinaryFile(buffer, config.outputPath);
  }

  /**
   * 生成 SVG 内容
   */
  private generateSVG(words: WordItem[], config: Required<MultiFormatWordCloudOptions>): string {
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
  <rect width="100%" height="100%" fill="${config.backgroundColor}"/>
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
   * 保存文本文件
   */
  private async saveTextFile(content: string, outputPath: string): Promise<string> {
    return this.saveFile(outputPath, async (finalPath) => {
      await fs.writeFile(finalPath, content, 'utf-8');
    });
  }

  /**
   * 保存二进制文件
   */
  private async saveBinaryFile(buffer: Buffer, outputPath: string): Promise<string> {
    return this.saveFile(outputPath, async (finalPath) => {
      await fs.writeFile(finalPath, buffer);
    });
  }

  /**
   * 通用文件保存方法
   */
  private async saveFile(outputPath: string, saveFunction: (path: string) => Promise<void>): Promise<string> {
    try {
      let resolvedPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      
      const dir = path.dirname(resolvedPath);
      await fs.ensureDir(dir);

      let finalPath = resolvedPath;
      let counter = 1;
      
      while (await fs.pathExists(finalPath)) {
        const ext = path.extname(resolvedPath);
        const name = path.basename(resolvedPath, ext);
        const dir = path.dirname(resolvedPath);
        finalPath = path.join(dir, `${name}_${counter}${ext}`);
        counter++;
      }

      await saveFunction(finalPath);
      return finalPath;
    } catch (error) {
      throw new Error(`保存文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取支持的输出格式
   */
  getSupportedFormats(): string[] {
    return Array.from(this.supportedFormats);
  }

  /**
   * 获取支持的主题列表
   */
  getSupportedThemes(): string[] {
    return Object.keys(this.colorThemes);
  }
}