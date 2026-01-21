/**
 * 前端输入验证工具
 * 用于防止 XSS 攻击
 */

/**
 * 验证 URL 是否安全
 * 只允许 http:// 和 https:// 协议
 */
export const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return true
  
  const trimmedUrl = url.trim().toLowerCase()
  
  // 拒绝危险协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:']
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false
    }
  }
  
  // 只允许 http 和 https（或相对路径）
  if (trimmedUrl.includes(':')) {
    return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
  }
  
  return true
}

/**
 * 验证 Profile 数据
 */
export const validateProfileData = (data) => {
  const errors = []
  
  // 验证 URL 字段
  const urlFields = [
    { key: 'avatar', label: '头像链接' },
    { key: 'github', label: 'GitHub 链接' },
    { key: 'website', label: '个人网站' }
  ]
  
  for (const field of urlFields) {
    if (data[field.key] && !isSafeUrl(data[field.key])) {
      errors.push(`${field.label}不安全：只允许 http:// 或 https:// 开头的链接`)
    }
  }
  
  // 验证邮箱
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('邮箱格式不正确')
    }
  }
  
  // 验证必填字段
  if (!data.name || data.name.trim().length === 0) {
    errors.push('姓名不能为空')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
