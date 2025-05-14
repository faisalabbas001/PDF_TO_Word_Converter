// PDF utility functions for text extraction and processing

/**
 * Processes text items from PDF.js to form paragraphs
 * @param {Array} textItems - Array of text items from PDF.js
 * @returns {Array} - Array of paragraph strings
 */
export function processTextItems(textItems) {
  const paragraphs = []
  let currentParagraph = ""
  let lastY = null
  let lastHeight = 0

  // Sort items by their vertical position to maintain reading order
  const sortedItems = textItems.sort((a, b) => {
    if (!a.transform || !b.transform) return 0
    // Compare y-coordinates (vertical position)
    const yDiff = a.transform[5] - b.transform[5]
    if (Math.abs(yDiff) > 5) return -yDiff // Negative to sort top-to-bottom
    // If y is similar, sort by x-coordinate (horizontal position)
    return a.transform[4] - b.transform[4]
  })

  // Process text items to form paragraphs
  sortedItems.forEach((item) => {
    if (!item.str.trim()) {
      // Empty string, check if we should end paragraph
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim())
        currentParagraph = ""
      }
      return
    }

    // Check if this is a new paragraph based on position
    if (lastY !== null && item.transform) {
      const yPos = item.transform[5]
      const heightDiff = Math.abs(yPos - lastY)

      // If vertical gap is significant, start a new paragraph
      if (heightDiff > lastHeight * 1.5) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim())
          currentParagraph = ""
        }
      }

      lastY = yPos
      lastHeight = item.height || 12 // Default height if not available
    } else if (item.transform) {
      lastY = item.transform[5]
      lastHeight = item.height || 12
    }

    // Add space if needed
    if (currentParagraph && !currentParagraph.endsWith(" ")) {
      currentParagraph += " "
    }
    currentParagraph += item.str
  })

  // Add the last paragraph if not empty
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim())
  }

  return paragraphs
}

/**
 * Detects if text is a heading based on font size and style
 * @param {Object} item - Text item from PDF.js
 * @param {Array} allItems - All text items for comparison
 * @returns {Number|null} - Heading level (1-6) or null if not a heading
 */
export function detectHeading(item, allItems) {
  if (!item.transform || !item.fontName) return null

  // Calculate average font size
  const fontSizes = allItems.filter((i) => i.transform && i.transform[0]).map((i) => Math.abs(i.transform[0]))

  const avgFontSize = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length
  const itemFontSize = Math.abs(item.transform[0])

  // Check if bold (usually contains 'Bold' in the font name)
  const isBold = item.fontName.toLowerCase().includes("bold")

  // Determine heading level based on font size relative to average
  if (itemFontSize > avgFontSize * 1.5 && isBold) return 1
  if (itemFontSize > avgFontSize * 1.3 && isBold) return 2
  if (itemFontSize > avgFontSize * 1.1 && isBold) return 3
  if (isBold) return 4

  return null
}
