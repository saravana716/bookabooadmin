import * as pdfjsLib from 'pdfjs-dist';

// Set pdfjs worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Smart Book Chapter & Page Extractor.
 * Extracts ALL pages, groups empty image cover pages gracefully, and preserves full chapter text.
 * 
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<Array<{id: string, title: string, pageNum: number, content: string[]}>>}
 */
export async function extractChaptersFromPDF(arrayBuffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const rawPages = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent({ normalizeWhitespace: true });
      
      const items = textContent.items.filter(item => typeof item.str === 'string' && item.str.trim().length > 0);
      
      // Sort items by Y position descending (top to bottom), then X position ascending (left to right)
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 4) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      // Group sorted items into lines
      const lines = [];
      let currentLine = '';
      let currentY = null;

      for (const item of items) {
        if (currentY === null || Math.abs(item.transform[5] - currentY) > 4) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
          currentY = item.transform[5];
        } else {
          if (!currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
            currentLine += ' ';
          }
          currentLine += item.str;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // Group lines into paragraphs
      const paragraphs = [];
      let paraBuffer = [];

      for (const line of lines) {
        paraBuffer.push(line);
        // End paragraph on sentence punctuation or short lines
        if (line.endsWith('.') || line.endsWith('?') || line.endsWith('!') || line.endsWith(':') || line.length < 30) {
          const fullPara = paraBuffer.join(' ').replace(/\s+/g, ' ').trim();
          if (fullPara) {
            paragraphs.push(fullPara);
          }
          paraBuffer = [];
        }
      }

      if (paraBuffer.length > 0) {
        const fullPara = paraBuffer.join(' ').replace(/\s+/g, ' ').trim();
        if (fullPara) {
          paragraphs.push(fullPara);
        }
      }

      rawPages.push({
        pageNum,
        lines,
        paragraphs
      });
    }

    // Now format clean non-empty pages list for the reader
    const formattedPages = [];
    let coverAccumulator = [];

    for (let i = 0; i < rawPages.length; i++) {
      const p = rawPages[i];

      // If page has text, add it
      if (p.paragraphs.length > 0) {
        let pageTitle = `Page ${p.pageNum}`;
        if (p.lines.length > 0) {
          const firstLine = p.lines[0].replace(/^[0-9.]+\s*/, '').trim();
          if (firstLine.length >= 3 && firstLine.length <= 70) {
            pageTitle = p.lines[0];
          }
        }

        formattedPages.push({
          id: `page_${p.pageNum}`,
          pageNum: p.pageNum,
          title: pageTitle,
          content: p.paragraphs
        });
      } else {
        // Page has no raw text (image/cover page in PDF like pages 1, 2, 3)
        // Store as a clean Cover / Artwork page instead of raw placeholder tag
        formattedPages.push({
          id: `page_${p.pageNum}`,
          pageNum: p.pageNum,
          title: `Book Cover / Artwork (Page ${p.pageNum})`,
          content: [`[Book Cover & Title Artwork - Page ${p.pageNum}]`]
        });
      }
    }

    return formattedPages;
  } catch (error) {
    console.error('Failed to extract PDF text:', error);
    throw error;
  }
}
