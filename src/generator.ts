import { PDFOptions, LaunchOptions } from 'puppeteer';
import hbs from 'handlebars';
import { createReadStream, createWriteStream } from 'fs';
import { createBrowser } from './browser';
import { registerHandlebarsHelpers } from './handlebars-helpers';
import { Readable } from 'stream';

export interface GeneratePdfOptions {
    templateFilePath: string;
    dataPerPage: Array<object>;
    pdfFilePath?: string;
    useStream?: boolean;
    helpersFilePath?: string;
    puppeteerOptions?: LaunchOptions;
    pdfOptions?: PDFOptions;
}
/**
 * Generate a PDF from a Handlebars template using Puppeteer.
 * @param {string} templateFilePath - The path to the Handlebars template file.
 * @param {object[]} dataPerPage - An array containing data objects for each page of the PDF.
 * @param {string} pdfFilePath - [Optional] The path where the generated PDF file will be saved. Required, if useStream is not passed or set to false.
 * @param {boolean} useStream - [Optional] Setting this to true will return a readable stream of the pdf instead of writing to the disk on the path "pdfFilePath".
 * @param {string} [helpersFilePath] - [Optional] The path to a Handlebars helpers file containing custom Handlebars helpers.
 * @param {LaunchOptions} [puppeteerOptions] - [Optional] Puppeteer launch options.
 * @param {PDFOptions} [pdfOptions] - [Optional] PDF generation options.
 * @returns {Promise<string>} A Promise that resolves with the path to the generated PDF file or a readable stream of the pdf if "useStream is set to true".
 * @throws {Error} Throws an error if no data is passed to inject into the PDF.
 */
export const generatePdf = async ({
    templateFilePath,
    dataPerPage,
    pdfFilePath = undefined,
    useStream = false,
    helpersFilePath,
    puppeteerOptions,
    pdfOptions,
}: GeneratePdfOptions): Promise<string | NodeJS.ReadableStream> => {
    let page = undefined;
    try {
        // Throws error if both pdfFilePath and useStream values are not passed
        // or useStream is passed as false but pdfFilePath was not provided
        if (!pdfFilePath && !useStream)
            throw new Error(
                '"pdfFilePath" must be specified unless "useStream" is set to true.'
            );

        if (pdfFilePath && useStream)
            throw new Error(
                'Conflicting parameters: "pdfFilePath" and "useStream" cannot both be used simultaneously.'
            );

        // Throws error if no data got passed
        if (JSON.stringify(dataPerPage) === '[]')
            throw new Error('No data was passed to inject into PDF');

        const browser = await createBrowser(puppeteerOptions);

        if (helpersFilePath) {
            const helpersStream = createReadStream(helpersFilePath, {
                encoding: 'utf8',
            });
            let helperData = '';
            for await (const chunk of helpersStream) {
                helperData += chunk;
            }
            helpersStream.close();
            registerHandlebarsHelpers(dataPerPage, helperData);
        } else {
            registerHandlebarsHelpers(dataPerPage);
        }

        const htmlStream = createReadStream(templateFilePath, { encoding: 'utf8' });
        let htmlData = '';
        for await (const chunk of htmlStream) {
            htmlData += chunk;
        }
        htmlStream.close();

        const template = hbs.compile(htmlData);

        let pdfConfig: PDFOptions = {
            format: 'A4',
            margin: {
                left: '10mm',
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
            },
            printBackground: true,
            ...pdfOptions,
        };

        page = await browser.newPage();
        const content = dataPerPage
            .map(singlePageData => template(singlePageData))
            .join('');
        await page.setContent(content, { waitUntil: 'networkidle0' });
        await page.evaluateHandle('document.fonts.ready');
        if (useStream) {
            const pdfBuffer = await page.pdf(pdfConfig);
            return Readable.from(pdfBuffer);
        } else {
            if (!pdfFilePath) {
                throw new Error('PDF file path must be provided.');
            }
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    left: '10mm',
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                },
                printBackground: true,
                ...pdfOptions,
            });
            await new Promise<void>((resolve, reject) => {
                const stream = createWriteStream(pdfFilePath);
                stream.write(pdfBuffer);
                stream.end();
                stream.on('finish', () => resolve());
                stream.on('error', err => reject(err));
            });
            return pdfFilePath;
        }
    } catch (error) {
        console.log(error);
        if (error instanceof Error)
            throw new Error(`PDF generation failed: ${error.message}`);

        throw new Error('An unknown error occurred during PDF generation.');
    } finally {
        if (page) await page.close();
    }
};
