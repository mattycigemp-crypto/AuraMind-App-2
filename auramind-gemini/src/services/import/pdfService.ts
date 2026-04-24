import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
// Note: In Vite, we often need to explicitly point to the worker file
// For a simple implementation, we might try using the CDN or a local copy
// This is a common pattern for client-side PDF.js in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new Error('Failed to extract text from PDF');
    }
};
