export const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`
export const clip = (text: string, width: number) => (text.length > width ? `${text.slice(0, width - 1)}~` : text)
