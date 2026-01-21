/**
 * 输入验证和清理工具 - 防止 XSS 攻击
 */

/**
 * 验证 URL 是否安全
 * 只允许 http:// 和 https:// 协议
 */
const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // 拒绝危险协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }
  
  // 只允许 http 和 https
  if (trimmedUrl.includes(':')) {
    return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
  }
  
  return true;
};

/**
 * 清理字符串，限制长度
 */
const sanitizeString = (str, maxLength = 500) => {
  if (!str || typeof str !== 'string') return str;
  
  // 移除危险字符
  let cleaned = str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
  
  // 限制长度
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  
  return cleaned;
};

/**
 * 验证和清理 Profile 数据
 */
const sanitizeProfileData = (data) => {
  const sanitized = { ...data };
  
  // 清理文本字段
  if (sanitized.name) sanitized.name = sanitizeString(sanitized.name, 50);
  if (sanitized.bio) sanitized.bio = sanitizeString(sanitized.bio, 200);
  if (sanitized.location) sanitized.location = sanitizeString(sanitized.location, 100);
  if (sanitized.company) sanitized.company = sanitizeString(sanitized.company, 100);
  if (sanitized.position) sanitized.position = sanitizeString(sanitized.position, 100);
  if (sanitized.github_username) sanitized.github_username = sanitizeString(sanitized.github_username, 50);
  if (sanitized.qq) sanitized.qq = sanitizeString(sanitized.qq, 20);
  if (sanitized.wechat) sanitized.wechat = sanitizeString(sanitized.wechat, 50);
  
  // 验证 URL 字段
  const urlFields = ['avatar', 'github', 'website'];
  for (const field of urlFields) {
    if (sanitized[field]) {
      if (!isSafeUrl(sanitized[field])) {
        throw new Error(`不安全的 URL (${field}): 只允许 http:// 或 https:// 协议`);
      }
      sanitized[field] = sanitizeString(sanitized[field], 500);
    }
  }
  
  // 验证邮箱
  if (sanitized.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized.email)) {
      throw new Error('无效的邮箱格式');
    }
    sanitized.email = sanitizeString(sanitized.email, 100);
  }
  
  // 清理状态
  if (sanitized.status) {
    if (sanitized.status.text) {
      sanitized.status.text = sanitizeString(sanitized.status.text, 50);
    }
    if (sanitized.status.emoji) {
      sanitized.status.emoji = sanitizeString(sanitized.status.emoji, 10);
    }
  }
  
  // 清理技能列表
  if (sanitized.skills && Array.isArray(sanitized.skills)) {
    sanitized.skills = sanitized.skills
      .map(skill => sanitizeString(skill, 50))
      .filter(skill => skill && skill.length > 0);
  }
  
  return sanitized;
};

/**
 * 验证和清理 Timeline 数据
 */
const sanitizeTimelineData = (timeline) => {
  if (!Array.isArray(timeline)) {
    throw new Error('Timeline 必须是数组');
  }
  
  return timeline.map(item => {
    if (!item.year || !item.title || !item.company || !item.description) {
      throw new Error('Timeline 项目缺少必需字段');
    }
    
    return {
      year: sanitizeString(String(item.year), 10),
      title: sanitizeString(item.title, 100),
      company: sanitizeString(item.company, 100),
      description: sanitizeString(item.description, 500)
    };
  });
};

module.exports = {
  isSafeUrl,
  sanitizeString,
  sanitizeProfileData,
  sanitizeTimelineData
};
