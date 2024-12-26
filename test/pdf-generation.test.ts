import { generatePdf } from '../src';
import * as path from 'path';
import * as fs from 'fs';

describe('PDF generation test', () => {
  it("should return the generated pdf file's path", async () => {
    const templateFilePath = path.join(
      process.cwd(),
      'example/templates',
      'pdf-invoice.hbs'
    );
    const pdfFilePath = path.join(process.cwd(), 'example/pdfs', 'pdf-invoice.pdf');
    const singlePageDataFilePath = path.join(
      process.cwd(),
      'example/templates',
      'pdf-invoice.hbs.json'
    );
    const singlePageData = await new Promise<any>((resolve, reject) => {
      const stream = fs.createReadStream(singlePageDataFilePath, { encoding: 'utf8' });
      let data = '';
      stream.on('data', chunk => (data += chunk));
      stream.on('end', () => resolve(data));
      stream.on('error', err => reject(err));
    });
    const dataPerPage = [JSON.parse(singlePageData)];

    const generatedFilePath = await generatePdf(
      templateFilePath,
      pdfFilePath,
      dataPerPage,
    );
    expect(typeof generatedFilePath).toEqual('string');
  });
});
