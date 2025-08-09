/**
 * 内容清理器类
 * 
 * 用于清理和预处理文本内容，主要功能包括：
 * - 去除中英文停用词
 * - 清理标点符号和特殊字符
 * - 智能分词处理（支持中英文混合文本）
 * - 过滤无意义的短词和数字
 * - 自定义停用词管理
 * 
 * 技术特色：
 * - 基于语言学的停用词库
 * - 智能中英文混合分词算法
 * - 有意义单字符识别
 * - 自适应词汇过滤
 * - 统计信息分析
 * 
 * @version 1.3.0
 * @author lucianaib
 */
export class ContentCleaner {
  
  /**
   * 中文停用词集合
   * 包含常见的中文虚词、助词、代词等无实际意义的词汇
   */
  private readonly chineseStopWords = new Set([
    // 代词
    '我', '我们', '你', '你们', '他', '他们', '她', '她们', '它', '它们',
    '自己', '大家', '咱们', '人家', '别人', '某人', '谁', '什么人',
    
    // 指示词
    '这', '那', '这个', '那个', '这些', '那些', '这里', '那里',
    '这样', '那样', '如此', '这么', '那么', '这儿', '那儿',
    
    // 动词
    '是', '不是', '有', '没有', '在', '不在', '做', '干', '搞',
    '弄', '整', '来', '去', '走', '跑', '看', '听', '说', '讲',
    '想', '要', '给', '让', '叫', '使', '被', '把', '将',
    
    // 助词
    '了', '的', '地', '得', '着', '过', '起来', '下去', '上来',
    '出来', '进去', '回来', '过来', '过去', '起', '下', '上',
    
    // 连词
    '和', '与', '或', '但是', '然而', '因为', '所以', '如果', '虽然',
    '尽管', '不过', '而且', '并且', '以及', '还有', '另外', '此外',
    '然后', '接着', '于是', '因此', '所以', '故而', '从而',
    
    // 量词和数词
    '一个', '一些', '很多', '许多', '所有', '每个', '任何', '没什么',
    '几个', '好多', '不少', '大量', '少量', '多少', '几', '多',
    
    // 疑问词
    '什么', '怎么', '为什么', '哪里', '哪个', '哪些', '何时', '何地',
    '如何', '怎样', '怎么样', '为何', '何故', '何以',
    
    // 情态词
    '可以', '能够', '应该', '必须', '需要', '想要', '希望', '觉得',
    '认为', '知道', '明白', '理解', '发现', '注意', '记得', '忘记',
    
    // 方位词
    '上', '下', '左', '右', '前', '后', '里', '外', '中', '间',
    '内', '旁', '边', '侧', '东', '西', '南', '北', '中间', '附近',
    
    // 时间词
    '年', '月', '日', '时', '分', '秒', '今天', '昨天', '明天',
    '现在', '以前', '以后', '刚才', '马上', '立即', '已经', '还',
    '刚', '正在', '曾经', '将来', '过去', '目前', '当前', '此时',
    
    // 程度词
    '很', '非常', '特别', '十分', '相当', '比较', '更', '最',
    '极', '超', '太', '挺', '蛮', '颇', '稍', '略', '有点',
    
    // 语气词
    '就', '才', '只', '都', '也', '又', '再', '还是', '或者',
    '要么', '不然', '否则', '不过', '只是', '仅仅', '单单',
    
    // 例举词
    '比如', '例如', '等等', '之类', '什么的', '等', '及', '以及',
    '诸如', '好比', '譬如', '如同', '像', '似', '仿佛', '犹如',
    
    // 语气助词
    '啊', '呢', '吧', '啦', '呀', '哦', '哈', '嗯', '哎', '唉',
    '嘿', '喂', '嗨', '哇', '呜', '嘻', '哼', '哟', '呵', '嗬'
  ]);

  /**
   * 英文停用词集合
   * 包含常见的英文虚词、介词、连词等
   */
  private readonly englishStopWords = new Set([
    // 代词
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    
    // 疑问词
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    
    // 指示词
    'this', 'that', 'these', 'those', 'here', 'there',
    
    // be动词
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    
    // 助动词
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
    'must', 'ought', 'need', 'dare',
    
    // 冠词
    'a', 'an', 'the',
    
    // 连词
    'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'if', 'unless',
    'because', 'since', 'as', 'while', 'when', 'where', 'after', 'before',
    'until', 'although', 'though', 'whereas', 'however', 'therefore',
    
    // 介词
    'of', 'at', 'by', 'for', 'with', 'without', 'through', 'during',
    'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'into', 'onto', 'upon', 'about',
    'against', 'across', 'along', 'among', 'around', 'behind', 'beside',
    'between', 'beyond', 'inside', 'outside', 'toward', 'towards',
    'within', 'throughout', 'underneath',
    
    // 副词
    'again', 'further', 'then', 'once', 'very', 'too', 'quite',
    'rather', 'really', 'just', 'only', 'also', 'even', 'still',
    'already', 'yet', 'never', 'always', 'often', 'sometimes',
    'usually', 'frequently', 'rarely', 'seldom', 'hardly', 'scarcely',
    
    // 限定词
    'all', 'any', 'both', 'each', 'every', 'few', 'many', 'much',
    'more', 'most', 'other', 'another', 'some', 'such', 'no', 'none',
    'neither', 'either', 'several', 'enough', 'little', 'less', 'least',
    
    // 否定词
    'not', 'no', 'nor', 'never', 'nothing', 'nobody', 'nowhere',
    'neither', 'none', 'hardly', 'scarcely', 'barely',
    
    // 其他常见词
    'own', 'same', 'so', 'than', 'now', 'well', 'way', 'get', 'got',
    'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went',
    'see', 'saw', 'know', 'knew', 'think', 'thought', 'say', 'said',
    'tell', 'told', 'give', 'gave', 'find', 'found', 'use', 'used'
  ]);

  /**
   * 有意义的中文单字符集合
   * 这些单字符即使独立出现也有实际意义
   */
  private readonly meaningfulChineseChars = new Set([
    // 人物相关
    '人', '民', '众', '群', '团', '队', '军', '警', '医', '师',
    '工', '农', '商', '学', '兵', '官', '员', '长', '主', '王',
    
    // 事物相关
    '事', '物', '品', '货', '料', '具', '器', '机', '车', '船',
    '房', '屋', '楼', '店', '厂', '场', '园', '院', '馆', '站',
    
    // 抽象概念
    '理', '法', '道', '德', '义', '礼', '智', '信', '仁', '勇',
    '美', '善', '真', '假', '对', '错', '好', '坏', '新', '旧',
    
    // 情感相关
    '爱', '恨', '喜', '怒', '哀', '乐', '悲', '欢', '愁', '忧',
    '惊', '恐', '怕', '急', '慌', '紧', '松', '轻', '重', '深',
    
    // 生命相关
    '生', '死', '老', '病', '伤', '痛', '康', '健', '强', '弱',
    '高', '矮', '胖', '瘦', '美', '丑', '聪', '笨', '勤', '懒',
    
    // 自然相关
    '天', '地', '山', '水', '风', '雨', '雪', '云', '雷', '电',
    '日', '月', '星', '光', '暗', '明', '亮', '黑', '白', '红',
    
    // 植物动物
    '花', '草', '树', '木', '林', '森', '叶', '果', '种', '根',
    '鸟', '鱼', '虫', '兽', '猫', '狗', '牛', '马', '羊', '猪',
    
    // 学习工作
    '书', '笔', '纸', '字', '词', '句', '文', '章', '学', '教',
    '读', '写', '算', '画', '唱', '跳', '玩', '游', '戏', '乐',
    
    // 经济相关
    '钱', '币', '元', '角', '分', '价', '值', '贵', '贱', '富',
    '穷', '买', '卖', '商', '贸', '易', '换', '借', '还', '欠',
    
    // 时空相关
    '时', '刻', '秒', '分', '时', '日', '周', '月', '年', '代',
    '古', '今', '昔', '夕', '朝', '暮', '早', '晚', '快', '慢',
    
    // 数量相关
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '百', '千', '万', '亿', '零', '半', '双', '对', '副', '套'
  ]);

  /**
   * 清理文本内容（保留词频版本）
   * @param text 原始文本
   * @returns 清理后的文本，保留重复词汇以维持词频
   */
  clean(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // 1. 基础清理：移除多余的空白字符和换行符
    let cleanedText = text
      .replace(/\s+/g, ' ')  // 多个空白字符合并为一个空格
      .trim();               // 去除首尾空白

    // 2. 移除特殊字符，保留中文、英文、数字和基本标点
    cleanedText = cleanedText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s。？！，、；：""''（）【】《》\-]/g, ' ');

    // 3. 分词处理
    const words = this.tokenize(cleanedText);

    // 4. 过滤停用词和无意义词汇
    const filteredWords = words.filter(word => this.shouldKeepWord(word));

    // 5. 保留重复词汇以维持词频统计（不去重）
    // 这样词云生成器可以正确统计词频并调整字体大小

    // 6. 重新组合文本
    return filteredWords.join(' ');
  }

  /**
   * 智能分词处理
   * 支持中英文混合文本的分词
   * @param text 文本内容
   * @returns 分词结果数组
   */
  private tokenize(text: string): string[] {
    const words: string[] = [];
    
    // 使用正则表达式匹配不同类型的词汇
    const patterns = [
      /[\u4e00-\u9fa5]{2,}/g,     // 中文词汇（2个字符以上）
      /[\u4e00-\u9fa5]/g,         // 单个中文字符
      /[a-zA-Z]{2,}/g,            // 英文单词（2个字母以上）
      /\d+/g,                     // 数字序列
      /[a-zA-Z]+\d+|\d+[a-zA-Z]+/g // 字母数字混合
    ];
    
    // 提取所有匹配的词汇
    const allMatches: Array<{text: string, index: number, type: string}> = [];
    
    patterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        allMatches.push({
          text: match[0],
          index: match.index,
          type: ['chinese_word', 'chinese_char', 'english', 'number', 'mixed'][patternIndex]
        });
      }
    });
    
    // 按位置排序，保持原文顺序
    allMatches.sort((a, b) => a.index - b.index);
    
    // 去重处理：如果一个位置有多个匹配，优先选择更长的词汇
    const filteredMatches: Array<{text: string, index: number, type: string}> = [];
    for (let i = 0; i < allMatches.length; i++) {
      const current = allMatches[i];
      let shouldAdd = true;
      
      // 检查是否与已有匹配重叠
      for (const existing of filteredMatches) {
        const currentEnd = current.index + current.text.length;
        const existingEnd = existing.index + existing.text.length;
        
        // 如果有重叠
        if (!(currentEnd <= existing.index || current.index >= existingEnd)) {
          // 如果当前匹配更长，替换已有的
          if (current.text.length > existing.text.length) {
            const existingIndex = filteredMatches.indexOf(existing);
            filteredMatches.splice(existingIndex, 1);
          } else {
            shouldAdd = false;
          }
          break;
        }
      }
      
      if (shouldAdd) {
        filteredMatches.push(current);
      }
    }
    
    // 处理每个匹配的词汇
    filteredMatches.forEach(match => {
      const token = match.text;
      
      if (match.type === 'chinese_word' || match.type === 'chinese_char') {
        words.push(token);
      } else if (match.type === 'english') {
        words.push(token.toLowerCase());
      } else if (match.type === 'number') {
        words.push(token);
      } else if (match.type === 'mixed') {
        words.push(token.toLowerCase());
      }
    });
    
    return words;
  }

  /**
   * 判断是否应该保留该词汇
   * @param word 词汇
   * @returns 是否保留
   */
  private shouldKeepWord(word: string): boolean {
    if (!word || word.length === 0) {
      return false;
    }

    // 对于单字符的处理更宽松
    if (word.length === 1) {
      // 保留有意义的中文字符
      if (this.meaningfulChineseChars.has(word)) {
        return true;
      }
      // 保留数字
      if (/\d/.test(word)) {
        return true;
      }
      // 英文单字母一般无意义，但保留一些特殊情况
      if (/[a-zA-Z]/.test(word)) {
        return ['a', 'i'].includes(word.toLowerCase()); // 保留一些有意义的单字母
      }
      return false;
    }

    // 更宽松的停用词过滤 - 只过滤最常见的停用词
    const commonStopWords = new Set([
      // 中文常见停用词（减少数量）
      '的', '了', '是', '在', '有', '和', '就', '不', '都', '一个', '也', '很', '到', '要', '你', '我', '他', '她', '它',
      // 英文常见停用词（减少数量）
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'
    ]);
    
    const lowerWord = word.toLowerCase();
    if (commonStopWords.has(word) || commonStopWords.has(lowerWord)) {
      return false;
    }

    // 更宽松的数字处理
    if (/^\d+$/.test(word)) {
      const num = parseInt(word);
      // 保留更多有意义的数字
      if (num >= 2 && num <= 9999) { // 保留2-9999的数字
        return true;
      }
      return false;
    }

    // 保留包含数字的混合词汇
    if (/\d/.test(word) && /[a-zA-Z\u4e00-\u9fa5]/.test(word)) {
      return true;
    }

    // 过滤过长的词汇（可能是错误分词）
    if (word.length > 15) { // 放宽长度限制
      return false;
    }

    // 保留长度为2或以上的词汇
    return word.length >= 2;
  }

  /**
   * 去除重复词汇，保持原有顺序
   * @param words 词汇数组
   * @returns 去重后的词汇数组
   */
  private removeDuplicates(words: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    
    for (const word of words) {
      if (!seen.has(word)) {
        seen.add(word);
        result.push(word);
      }
    }
    
    return result;
  }

  /**
   * 清理文本内容（去重版本）
   * 用于需要去重的场景
   * @param text 原始文本
   * @returns 清理并去重后的文本
   */
  cleanWithDeduplication(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // 1. 基础清理：移除多余的空白字符和换行符
    let cleanedText = text
      .replace(/\s+/g, ' ')  // 多个空白字符合并为一个空格
      .trim();               // 去除首尾空白

    // 2. 移除特殊字符，保留中文、英文、数字和基本标点
    cleanedText = cleanedText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s。？！，、；：""''（）【】《》\-]/g, ' ');

    // 3. 分词处理
    const words = this.tokenize(cleanedText);

    // 4. 过滤停用词和无意义词汇
    const filteredWords = words.filter(word => this.shouldKeepWord(word));

    // 5. 去重（保持顺序）
    const uniqueWords = this.removeDuplicates(filteredWords);

    // 6. 重新组合文本
    return uniqueWords.join(' ');
  }

  /**
   * 高级文本清理
   * 包含更多的清理选项和自定义规则
   * @param text 原始文本
   * @param options 清理选项
   * @returns 清理后的文本
   */
  advancedClean(text: string, options: {
    removeNumbers?: boolean;
    removeShortWords?: boolean;
    minWordLength?: number;
    maxWordLength?: number;
    customStopWords?: string[];
    preserveCase?: boolean;
  } = {}): string {
    const {
      removeNumbers = false,
      removeShortWords = true,
      minWordLength = 2,
      maxWordLength = 20,
      customStopWords = [],
      preserveCase = false
    } = options;

    if (!text || typeof text !== 'string') {
      return '';
    }

    // 基础清理
    let cleanedText = this.clean(text);
    
    // 分词
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    // 应用高级过滤规则
    const filteredWords = words.filter(word => {
      // 移除数字
      if (removeNumbers && /^\d+$/.test(word)) {
        return false;
      }
      
      // 移除短词
      if (removeShortWords && word.length < minWordLength) {
        return false;
      }
      
      // 移除长词
      if (word.length > maxWordLength) {
        return false;
      }
      
      // 自定义停用词
      const checkWord = preserveCase ? word : word.toLowerCase();
      if (customStopWords.includes(checkWord)) {
        return false;
      }
      
      return true;
    });

    return filteredWords.join(' ');
  }

  /**
   * 添加自定义停用词
   * @param words 要添加的停用词数组
   */
  addStopWords(words: string[]): void {
    words.forEach(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length > 0) {
        if (/[\u4e00-\u9fa5]/.test(trimmedWord)) {
          this.chineseStopWords.add(trimmedWord);
        } else {
          this.englishStopWords.add(trimmedWord.toLowerCase());
        }
      }
    });
  }

  /**
   * 移除自定义停用词
   * @param words 要移除的停用词数组
   */
  removeStopWords(words: string[]): void {
    words.forEach(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length > 0) {
        if (/[\u4e00-\u9fa5]/.test(trimmedWord)) {
          this.chineseStopWords.delete(trimmedWord);
        } else {
          this.englishStopWords.delete(trimmedWord.toLowerCase());
        }
      }
    });
  }

  /**
   * 获取当前中文停用词列表
   * @returns 中文停用词数组
   */
  getChineseStopWords(): string[] {
    return Array.from(this.chineseStopWords);
  }

  /**
   * 获取当前英文停用词列表
   * @returns 英文停用词数组
   */
  getEnglishStopWords(): string[] {
    return Array.from(this.englishStopWords);
  }

  /**
   * 获取有意义的中文单字符列表
   * @returns 有意义的中文单字符数组
   */
  getMeaningfulChineseChars(): string[] {
    return Array.from(this.meaningfulChineseChars);
  }

  /**
   * 获取清理统计信息
   * @param originalText 原始文本
   * @param cleanedText 清理后文本
   * @returns 统计信息对象
   */
  getCleaningStats(originalText: string, cleanedText: string): {
    originalLength: number;
    cleanedLength: number;
    originalWordCount: number;
    cleanedWordCount: number;
    reductionRate: number;
    compressionRatio: number;
  } {
    const originalWords = originalText.split(/\s+/).filter(w => w.length > 0);
    const cleanedWords = cleanedText.split(/\s+/).filter(w => w.length > 0);
    
    const reductionRate = originalWords.length > 0 
      ? Math.round((1 - cleanedWords.length / originalWords.length) * 100) 
      : 0;
    
    const compressionRatio = originalText.length > 0
      ? Math.round((1 - cleanedText.length / originalText.length) * 100)
      : 0;
    
    return {
      originalLength: originalText.length,
      cleanedLength: cleanedText.length,
      originalWordCount: originalWords.length,
      cleanedWordCount: cleanedWords.length,
      reductionRate,
      compressionRatio
    };
  }

  /**
   * 验证文本质量
   * @param text 文本内容
   * @returns 质量评估结果
   */
  assessTextQuality(text: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        issues: ['文本为空'],
        suggestions: ['请提供有效的文本内容']
      };
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words);

    // 检查文本长度
    if (text.length < 50) {
      issues.push('文本过短');
      suggestions.push('建议提供更多文本内容以获得更好的词云效果');
      score -= 20;
    }

    // 检查词汇多样性
    const diversityRatio = uniqueWords.size / words.length;
    if (diversityRatio < 0.3) {
      issues.push('词汇重复度过高');
      suggestions.push('文本中存在大量重复词汇，可能影响词云视觉效果');
      score -= 15;
    }

    // 检查有效词汇比例
    const meaningfulWords = words.filter(word => this.shouldKeepWord(word));
    const meaningfulRatio = meaningfulWords.length / words.length;
    if (meaningfulRatio < 0.5) {
      issues.push('有效词汇比例较低');
      suggestions.push('文本中包含过多停用词或无意义词汇');
      score -= 10;
    }

    // 检查语言混合情况
    const chineseWords = words.filter(word => /[\u4e00-\u9fa5]/.test(word));
    const englishWords = words.filter(word => /[a-zA-Z]/.test(word));
    
    if (chineseWords.length > 0 && englishWords.length > 0) {
      const ratio = Math.min(chineseWords.length, englishWords.length) / Math.max(chineseWords.length, englishWords.length);
      if (ratio > 0.3) {
        suggestions.push('检测到中英文混合文本，建议选择合适的主题和布局');
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}
