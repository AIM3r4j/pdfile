import { generatePdf, closeBrowser } from 'pdfile';
import * as path from 'path';
import * as fs from 'fs/promises';

const generateInvoices = async () => {
    try {
        // Paths to the template, output PDF, data and optionally handlebar helpers
        const templateFilePath = path.join(
            process.cwd(),
            'templates',
            'pdf-invoice.hbs'
        );
        const pdfFilePath = path.join(process.cwd(), 'pdfs', 'pdf-invoice.pdf');
        const singlePageDataFilePath = path.join(
            process.cwd(),
            'templates',
            'pdf-invoice.hbs.json'
        );

        // Read the data for the template
        const singlePageData = await fs.readFile(singlePageDataFilePath, 'utf8');
        const dataPerPage = [JSON.parse(singlePageData)];

        // This one is optional and you only need to pass this to the function when you need to add your custom helper functions
        const helpersFilePath = path.join(
            process.cwd(),
            'templates',
            'helpers.hbs.json'
        );

        // Generate the PDF
        const generatedFilePath = await generatePdf({
            templateFilePath,
            pdfFilePath,
            helpersFilePath, // Optional
            dataPerPage,
        });

        console.log('Generated PDF at:', generatedFilePath);

    } catch (error) {
        console.error('Error generating PDF:', error.message);
    } finally {
        // Always close the browser instance by calling this function after all PDF generations are complete
        await closeBrowser();
        console.log('Browser closed.');
    }
};

// Execute the invoice generation
generateInvoices();
