import { PDFOptions, PuppeteerLaunchOptions, Browser, Page } from 'puppeteer';
import hbs from 'handlebars';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createBrowser as createSharedBrowser, launchBrowser } from './browser';
import {
  HandlebarsHelpers,
  parseHelpersJson,
  registerHandlebarsHelpers,
} from './handlebars-helpers';

const pipelineAsync = promisify(pipeline);

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  margin: { left: '10mm', top: '10mm', right: '10mm', bottom: '10mm' },
  printBackground: true,
};

export interface GeneratePdfOptions {
  /** Path to the Handlebars template file. */
  templateFilePath: string;
  /** One object per page. Each entry renders the template once; results are concatenated. */
  dataPerPage: Array<object>;
  /** Where to write the PDF. Required unless `useStream` is true. */
  pdfFilePath?: string;
  /** Return a Readable stream of the PDF instead of writing to disk. */
  useStream?: boolean;
  /** Plain object of `{ name: fn }` Handlebars helpers. Preferred over `helpersFilePath`. */
  helpers?: HandlebarsHelpers;
  /**
   * Path to a JSON file of helpers whose values are stringified function bodies.
   * @deprecated Use `helpers` instead — this path runs `new Function` on file contents.
   */
  helpersFilePath?: string;
  /** Puppeteer launch options (only used by the singleton `generatePdf` on first call). */
  puppeteerOptions?: PuppeteerLaunchOptions;
  /** Puppeteer PDF options. Merged on top of A4 / 10mm margin defaults. */
  pdfOptions?: PDFOptions;
}

const readFileAsString = async (path: string): Promise<string> => {
  const stream = createReadStream(path, { encoding: 'utf8' });
  let data = '';
  for await (const chunk of stream) data += chunk;
  return data;
};

const renderTemplate = async (
  templateFilePath: string,
  dataPerPage: Array<object>
): Promise<string> => {
  const source = await readFileAsString(templateFilePath);
  const template = hbs.compile(source);
  return dataPerPage.map(d => template(d)).join('');
};

const resolveHelpers = async (
  helpers?: HandlebarsHelpers,
  helpersFilePath?: string
): Promise<HandlebarsHelpers | undefined> => {
  if (helpers) return helpers;
  if (helpersFilePath) {
    const raw = await readFileAsString(helpersFilePath);
    return parseHelpersJson(raw);
  }
  return undefined;
};

const validateOptions = ({
  pdfFilePath,
  useStream,
  dataPerPage,
}: GeneratePdfOptions): void => {
  if (!pdfFilePath && !useStream) {
    throw new Error(
      '"pdfFilePath" must be specified unless "useStream" is set to true.'
    );
  }
  if (pdfFilePath && useStream) {
    throw new Error(
      'Conflicting parameters: "pdfFilePath" and "useStream" cannot both be used simultaneously.'
    );
  }
  if (!Array.isArray(dataPerPage) || dataPerPage.length === 0) {
    throw new Error('No data was passed to inject into PDF');
  }
};

const renderPageOnBrowser = async (
  browser: Browser,
  html: string
): Promise<Page> => {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  return page;
};

/**
 * Core PDF generation that takes a pre-launched browser. Lets callers manage
 * the browser lifecycle directly via `PdfGenerator`.
 */
const generateOnBrowser = async (
  browser: Browser,
  options: GeneratePdfOptions
): Promise<string | NodeJS.ReadableStream> => {
  validateOptions(options);

  const userHelpers = await resolveHelpers(
    options.helpers,
    options.helpersFilePath
  );
  registerHandlebarsHelpers(userHelpers);

  const html = await renderTemplate(
    options.templateFilePath,
    options.dataPerPage
  );

  const pdfConfig: PDFOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options.pdfOptions,
  };

  let page: Page | undefined;
  try {
    page = await renderPageOnBrowser(browser, html);

    if (options.useStream) {
      const stream = await page.createPDFStream(pdfConfig);
      const pageRef = page;
      page = undefined; // ownership transferred to the stream consumer
      const closePage = () => {
        pageRef.close().catch(() => undefined);
      };
      stream.once('end', closePage);
      stream.once('close', closePage);
      stream.once('error', closePage);
      return stream;
    }

    if (!options.pdfFilePath) {
      throw new Error('PDF file path must be provided.');
    }

    const pdfStream = await page.createPDFStream(pdfConfig);
    await pipelineAsync(pdfStream, createWriteStream(options.pdfFilePath));
    return options.pdfFilePath;
  } finally {
    if (page) await page.close();
  }
};

/**
 * A caller-owned PDF generator. Holds its own Puppeteer Browser instance —
 * isolated from the module singleton used by `generatePdf` / `closeBrowser`.
 *
 * @example
 *   const gen = new PdfGenerator();
 *   try {
 *     await gen.generate({ templateFilePath, dataPerPage, pdfFilePath });
 *   } finally {
 *     await gen.close();
 *   }
 */
export class PdfGenerator {
  private browserPromise: Promise<Browser> | null = null;
  private readonly launchOptions: PuppeteerLaunchOptions | undefined;

  constructor(launchOptions?: PuppeteerLaunchOptions) {
    this.launchOptions = launchOptions;
  }

  /** Force the browser to launch now instead of on first `generate()`. */
  async warmup(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = launchBrowser(this.launchOptions);
    }
    return this.browserPromise;
  }

  async generate(
    options: GeneratePdfOptions
  ): Promise<string | NodeJS.ReadableStream> {
    const browser = await this.warmup();
    return generateOnBrowser(browser, options);
  }

  async close(): Promise<void> {
    const promise = this.browserPromise;
    this.browserPromise = null;
    if (promise) {
      const browser = await promise;
      await browser.close();
    }
  }
}

/**
 * Generate a PDF using the shared module-level browser singleton.
 * Call `closeBrowser()` when you're done. For long-running servers or test
 * suites, prefer the `PdfGenerator` class.
 */
export const generatePdf = async (
  options: GeneratePdfOptions
): Promise<string | NodeJS.ReadableStream> => {
  const browser = await createSharedBrowser(options.puppeteerOptions);
  return generateOnBrowser(browser, options);
};
