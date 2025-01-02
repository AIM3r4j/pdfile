import { LaunchOptions, Browser, launch } from 'puppeteer';

let browser: Browser | null;
export const createBrowser = async (puppeteerOptions?: LaunchOptions) => {
  if (!browser) {
    browser = await launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      ...puppeteerOptions,
    });
  }
  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
};
