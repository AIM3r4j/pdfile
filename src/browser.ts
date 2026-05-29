import { PuppeteerLaunchOptions, Browser, launch } from 'puppeteer';

export const DEFAULT_PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
};

export const launchBrowser = (
  puppeteerOptions?: PuppeteerLaunchOptions
): Promise<Browser> =>
  launch({ ...DEFAULT_PUPPETEER_OPTIONS, ...puppeteerOptions });

let sharedBrowser: Browser | null = null;
let sharedBrowserPromise: Promise<Browser> | null = null;

/**
 * Lazily launches a shared Puppeteer Browser. Options are only honored on the
 * first call; subsequent calls return the cached instance. For caller-owned
 * lifecycle, use the `PdfGenerator` class instead.
 */
export const createBrowser = async (
  puppeteerOptions?: PuppeteerLaunchOptions
): Promise<Browser> => {
  if (sharedBrowser) return sharedBrowser;
  if (!sharedBrowserPromise) {
    sharedBrowserPromise = launchBrowser(puppeteerOptions).then(b => {
      sharedBrowser = b;
      return b;
    });
  }
  return sharedBrowserPromise;
};

/**
 * Close the shared Puppeteer Browser created by `createBrowser` / `generatePdf`.
 * Must be called once you are done generating PDFs, otherwise the Node process
 * will not exit.
 */
export const closeBrowser = async (): Promise<void> => {
  const browser = sharedBrowser;
  sharedBrowser = null;
  sharedBrowserPromise = null;
  if (browser) await browser.close();
};
