export function 获取名称缩写(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length > 1 && words.every((word) => /^[a-z]/i.test(word))) {
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  }
  return (Array.from(name.trim())[0] || '链').toUpperCase()
}

export function 创建字符图标(character: string) {
  const text = character.replace(/[&<>"']/g, (value) => `&#${value.charCodeAt(0)};`)
  const fontSize = Array.from(character).length > 1 ? 26 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64" data-character="${encodeURIComponent(character)}"><rect width="64" height="64" rx="14" fill="#f0f2f5"/><text x="32" y="34" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" fill="#777">${text}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function 读取字符图标(url: string) {
  if (!url.startsWith('data:image/svg+xml,')) return ''
  try {
    const svg = decodeURIComponent(url.slice('data:image/svg+xml,'.length))
    const match = svg.match(/data-character="([^"]*)"/)
    return match ? decodeURIComponent(match[1]!) : ''
  } catch {
    return ''
  }
}

export function 获取网站图标(url: string) {
  try {
    const website = new URL(url)
    return ['https:', 'http:'].includes(website.protocol)
      ? new URL('/favicon.ico', website.origin).href
      : ''
  } catch {
    return ''
  }
}
