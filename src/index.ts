import { launch, PDFOptions, PuppeteerLaunchOptions } from 'puppeteer';
import hbs from 'handlebars';
import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

/**
 * Generate a PDF from a Handlebars template using Puppeteer.
 * @param {string} templateFilePath - The path to the Handlebars template file.
 * @param {string} pdfFilePath - The path where the generated PDF file will be saved.
 * @param {object[]} dataPerPage - An array containing data objects for each page of the PDF.
 * @param {PuppeteerLaunchOptions} [puppeteerOptions] - Optional Puppeteer launch options.
 * @param {PDFOptions} [pdfOptions] - Optional PDF generation options.
 * @returns {Promise<string>} A Promise that resolves with the path to the generated PDF file.
 * @throws {Error} Throws an error if no data is passed to inject into the PDF.
 */
export const generatePdf = async (
  templateFilePath: string,
  pdfFilePath: string,
  dataPerPage = [{}],
  puppeteerOptions?: PuppeteerLaunchOptions,
  pdfOptions?: PDFOptions
) => {
  try {
    // Throws error if no data got passed
    if (JSON.stringify(dataPerPage) === '[]')
      throw new Error('No data was passed to inject into PDF');

    const browser = await launch(puppeteerOptions);

    hbs.registerHelper('ifCond', function(
      v1: any,
      operator: any,
      v2: any,
      options: any
    ) {
      switch (operator) {
        case '==':
          return v1 == v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '===':
          return v1 === v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '!=':
          return v1 != v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '!==':
          return v1 !== v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '<':
          return v1 < v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '<=':
          return v1 <= v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '>':
          return v1 > v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '>=':
          return v1 >= v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '&&':
          return v1 && v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        case '||':
          return v1 || v2
            ? options.fn(dataPerPage)
            : options.inverse(dataPerPage);
        default:
          return options.inverse(options);
      }
    });

    hbs.registerHelper({
      eq: (v1: any, v2: any) => v1 === v2,
      ne: (v1: any, v2: any) => v1 !== v2,
      lt: (v1: number, v2: number) => v1 < v2,
      gt: (v1: number, v2: number) => v1 > v2,
      lte: (v1: number, v2: number) => v1 <= v2,
      gte: (v1: number, v2: number) => v1 >= v2,
      and() {
        return Array.prototype.every.call(arguments, Boolean);
      },
      or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
    });

    const html = await fs.readFile(templateFilePath, 'utf8');
    const pdfBuffers = [];

    // Removing path property from PDFOptions to generate buffer instead of file
    if (pdfOptions) delete pdfOptions['path'];

    for (const singlePageData of dataPerPage) {
      const page = await browser.newPage();
      const content = hbs.compile(html)(singlePageData);
      await page.setContent(content, { waitUntil: 'networkidle0' });
      pdfBuffers.push(
        await page.pdf({
          format: 'A4',
          margin: {
            left: '10mm',
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
          },
          printBackground: true,
          ...pdfOptions,
        })
      );
    }

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => {
        mergedPdf.addPage(page);
      });
    }

    const buf = await mergedPdf.save(); // Uint8Array

    await fs.writeFile(pdfFilePath, buf);

    await browser.close();

    console.log('PDF successfully created');
    console.log(pdfFilePath);

    return pdfFilePath;
  } catch (e) {
    console.log(e);
    throw new Error(`PDF generation failed: ${e.message}`);
  }
};
