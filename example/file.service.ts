import { generatePdf } from 'pdfile';
import * as path from 'path';
import * as fs from 'fs/promises';

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
const singlePageData = await fs.readFile(singlePageDataFilePath, 'utf8');
const dataPerPage = [JSON.parse(singlePageData)];

const generatedFilePath = await generatePdf(
    templateFilePath,
    pdfFilePath,
    dataPerPage,
);
console.log(generatedFilePath);