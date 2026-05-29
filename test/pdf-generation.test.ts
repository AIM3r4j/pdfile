import {
  closeBrowser,
  generatePdf,
  PdfGenerator,
  HandlebarsHelpers,
} from '../src';
import * as path from 'path';
import {
  createWriteStream,
  existsSync,
  promises as fsp,
  statSync,
  unlinkSync,
} from 'fs';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);
const PDF_HEADER = Buffer.from('%PDF-');

const templateFilePath = path.join(
  process.cwd(),
  'example/templates',
  'pdf-invoice.hbs'
);
const dataFilePath = path.join(
  process.cwd(),
  'example/templates',
  'pdf-invoice.hbs.json'
);
const helpersFilePath = path.join(
  process.cwd(),
  'example/templates',
  'helpers.hbs.json'
);
const outDir = path.join(process.cwd(), 'example/pdfs');
const outPath = (name: string) => path.join(outDir, name);

const loadData = async () => {
  const raw = await fsp.readFile(dataFilePath, 'utf8');
  return JSON.parse(raw);
};

const isPdfFile = (filePath: string): boolean => {
  const stat = statSync(filePath);
  if (stat.size < 5) return false;
  // Header check — Puppeteer always writes %PDF- at offset 0.
  // We can't slice a stream synchronously here, so read it as a buffer.
  const fd = require('fs').openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(5);
    require('fs').readSync(fd, buf, 0, 5, 0);
    return buf.equals(PDF_HEADER);
  } finally {
    require('fs').closeSync(fd);
  }
};

const cleanup = (file: string) => {
  if (existsSync(file)) unlinkSync(file);
};

describe('generatePdf (singleton API)', () => {
  afterAll(async () => {
    await closeBrowser();
  });

  it('writes a valid PDF to disk when pdfFilePath is given', async () => {
    expect.assertions(3);
    const pdfFilePath = outPath('singleton-file.pdf');
    cleanup(pdfFilePath);

    const dataPerPage = [await loadData()];
    const result = await generatePdf({
      templateFilePath,
      pdfFilePath,
      helpersFilePath,
      dataPerPage,
    });

    expect(result).toBe(pdfFilePath);
    expect(existsSync(pdfFilePath)).toBe(true);
    expect(isPdfFile(pdfFilePath)).toBe(true);
  });

  it('returns a Readable that pipes to a valid PDF when useStream is true', async () => {
    expect.assertions(3);
    const pdfFilePath = outPath('singleton-stream.pdf');
    cleanup(pdfFilePath);

    const dataPerPage = [await loadData()];
    const stream = await generatePdf({
      templateFilePath,
      helpersFilePath,
      dataPerPage,
      useStream: true,
    });

    expect(stream).toBeInstanceOf(Readable);
    await pipelineAsync(stream as Readable, createWriteStream(pdfFilePath));
    expect(existsSync(pdfFilePath)).toBe(true);
    expect(isPdfFile(pdfFilePath)).toBe(true);
  });

  it('throws when neither pdfFilePath nor useStream is provided', async () => {
    expect.assertions(1);
    await expect(
      generatePdf({
        templateFilePath,
        dataPerPage: [await loadData()],
      } as any)
    ).rejects.toThrow(/pdfFilePath.*useStream/);
  });

  it('throws when both pdfFilePath and useStream are provided', async () => {
    expect.assertions(1);
    await expect(
      generatePdf({
        templateFilePath,
        pdfFilePath: outPath('conflict.pdf'),
        useStream: true,
        dataPerPage: [await loadData()],
      })
    ).rejects.toThrow(/cannot both be used/);
  });

  it('throws when dataPerPage is empty', async () => {
    expect.assertions(1);
    await expect(
      generatePdf({
        templateFilePath,
        pdfFilePath: outPath('empty.pdf'),
        dataPerPage: [],
      })
    ).rejects.toThrow(/No data/);
  });
});

describe('PdfGenerator (class API)', () => {
  let gen: PdfGenerator;

  beforeAll(() => {
    gen = new PdfGenerator();
  });

  afterAll(async () => {
    await gen.close();
  });

  it('generates a multi-page PDF with caller-owned lifecycle', async () => {
    expect.assertions(2);
    const pdfFilePath = outPath('class-multipage.pdf');
    cleanup(pdfFilePath);

    const single = await loadData();
    const result = await gen.generate({
      templateFilePath,
      pdfFilePath,
      dataPerPage: [single, single, single],
    });

    expect(result).toBe(pdfFilePath);
    expect(isPdfFile(pdfFilePath)).toBe(true);
  });

  it('accepts a plain helpers object (no JSON file, no eval)', async () => {
    expect.assertions(1);
    const pdfFilePath = outPath('class-helpers-object.pdf');
    cleanup(pdfFilePath);

    const helpers: HandlebarsHelpers = {
      eq: (a, b) => a === b,
      and: (...args) => args.slice(0, -1).every(Boolean),
      or: (...args) => args.slice(0, -1).some(Boolean),
    };

    await gen.generate({
      templateFilePath,
      pdfFilePath,
      dataPerPage: [await loadData()],
      helpers,
    });

    expect(isPdfFile(pdfFilePath)).toBe(true);
  });

  it('produces a stream that ends and yields a valid PDF', async () => {
    expect.assertions(1);
    const pdfFilePath = outPath('class-stream.pdf');
    cleanup(pdfFilePath);

    const stream = (await gen.generate({
      templateFilePath,
      dataPerPage: [await loadData()],
      useStream: true,
    })) as Readable;

    await pipelineAsync(stream, createWriteStream(pdfFilePath));
    expect(isPdfFile(pdfFilePath)).toBe(true);
  });
});
