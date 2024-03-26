import { generatePdf } from '../src';
import * as path from 'path';
import * as fs from 'fs';

describe('PDF generation test', () => {
  it("should return the generated pdf file's path", async () => {
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
    const singlePageData = await fs.readFileSync(
      singlePageDataFilePath,
      'utf-8'
    );
    const dataPerPage = [JSON.parse(singlePageData)];

    const generatedFilePath = await generatePdf(
      templateFilePath,
      pdfFilePath,
      dataPerPage,
      {
        headless: true,
        args: ['--no-sandbox'],
      }
    );
    expect(typeof generatedFilePath).toEqual('string');
  });
});
