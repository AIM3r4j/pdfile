import { closeBrowser, generatePdf } from '../src';
import * as path from 'path';
import { createWriteStream, existsSync } from 'fs';

import { Readable } from 'stream';
import { readFile } from 'fs/promises';

describe('PDF generation test', () => {
  it("should return the generated pdf file's path", async () => {
    try {
      const templateFilePath = path.join(
        process.cwd(),
        'example/templates',
        'pdf-invoice.hbs'
      );
      const pdfFilePath = path.join(
        process.cwd(),
        'example/pdfs',
        'pdf-invoice.pdf'
      );
      const singlePageDataFilePath = path.join(
        process.cwd(),
        'example/templates',
        'pdf-invoice.hbs.json'
      );
      const singlePageData = await readFile(singlePageDataFilePath, 'utf8');
      const dataPerPage = [JSON.parse(singlePageData)];

      const helpersFilePath = path.join(
        process.cwd(),
        'example/templates',
        'helpers.hbs.json'
      );

      const generatedFilePath = await generatePdf({
        templateFilePath,
        pdfFilePath,
        helpersFilePath,
        dataPerPage,
      });
      console.log(`PDF successfully generated at: ${generatedFilePath}`);
      expect(existsSync(pdfFilePath)).toEqual(true);
      expect(typeof generatedFilePath).toEqual('string');
    } catch (error) {
      console.error(`Error generating PDF:`, error);
    } finally {
      await closeBrowser();
    }
  });

  it('should return the generated pdf file as a readable stream', async () => {
    try {
      const templateFilePath = path.join(
        process.cwd(),
        'example/templates',
        'pdf-invoice.hbs'
      );
      const pdfFilePath = path.join(
        process.cwd(),
        'example/pdfs',
        'pdf-invoice.pdf'
      );
      const singlePageDataFilePath = path.join(
        process.cwd(),
        'example/templates',
        'pdf-invoice.hbs.json'
      );
      const singlePageData = await readFile(singlePageDataFilePath, 'utf8');
      const dataPerPage = [JSON.parse(singlePageData)];

      const helpersFilePath = path.join(
        process.cwd(),
        'example/templates',
        'helpers.hbs.json'
      );

      const writeStream = createWriteStream(pdfFilePath);
      const pdfStream = await generatePdf({
        templateFilePath,
        helpersFilePath,
        dataPerPage,
        useStream: true,
      });
      if (pdfStream instanceof Readable) {
        pdfStream.pipe(writeStream);

        writeStream.on('finish', () => {
          console.log(`PDF successfully written at: ${pdfFilePath}`);
        });

        writeStream.on('error', error => {
          console.error(`Error writing PDF:`, error);
        });
      }
      expect(existsSync(pdfFilePath)).toEqual(true);
    } catch (error) {
      console.error(`Error generating PDF:`, error);
    } finally {
      await closeBrowser();
    }
  });
});
