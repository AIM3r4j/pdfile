# PDFile

PDFile is a JavaScript/Node.js PDF generator utilizing Handlebars HTML design and Puppeteer, capable of producing single or multiple-page PDFs.

## Installation

```sh
npm i pdfile
```

(Optional) Might want to install the chromium browser beforehand for puppeteer to properly work

```sh
npx puppeteer browsers install chrome
```

## Usage

### Initialization

Import the function

```javascript
import { generatePdf } from 'pdfile';
```

Call the function to generate the PDF

```javascript
const generatedPdfFilePath = await generatePdf(
  [templateFilePath],
  [pdfFilePath],
  [dataPerPage],
  [puppeteerOptions],
  [pdfOptions]
);
```

Parameters:

- `templateFilePath` <[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type 'String')> It's required. Handlebars HTML file path.
- `pdfFilePath` <[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type 'String')> It's required. The path where the generated PDF file will be saved.
- `dataPerPage` <[Array Of Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array 'Array Of Objects')> It's required. Suggested Value:

```json
[
  {
    "invoiceNumber": 12345,
    "invoiceDate": "20 May, 2024",
    "currentPage": 1,
    "totalPages": 2
  },
  {
    "invoiceNumber": 678910,
    "invoiceDate": "21 May, 2024",
    "currentPage": 2,
    "totalPages": 2
  }
]
```

- `puppeteerOptions` <[PuppeteerLaunchOptions](https://pptr.dev/api/puppeteer.puppeteerlaunchoptions 'PuppeteerLaunchOptions')> It's optional.
- `pdfOptions` <[PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions 'PDFOptions')> It's optional.
  Default value:

```json
{
  "format": "A4",
  "margin": {
    "left": "10mm",
    "top": "10mm",
    "right": "10mm",
    "bottom": "10mm"
  },
  "printBackground": true
}
```

For more values, [check this link out](https://pptr.dev/api/puppeteer.pdfoptions)

### Working Example

You can copy the 'example' folder to quickly use the library

Result: pdf-invoice.pdf

![plot](./images/1.png)

### More details

---

| JavaScript      | HTMLBars OP1           | HTMLBars OP2                  |
| --------------- | ---------------------- | ----------------------------- |
| `if (a === b)`  | `{{#if (eq a b)}}`     | `{{#ifCond var1 '===' var2}}` |
| `if (a !== b)`  | `{{#if (not-eq a b)}}` | `{{#ifCond var1 '!==' var2}}` |
| `if (a && b)`   | `{{#if (and a b)}}`    | `{{#ifCond var1 '&&' var2}}`  |
| `if (a > b)`    | `{{#if (gt a b)}}`     | `{{#ifCond var1 '>' var2}}`   |
| `if (a >= b)`   | `{{#if (gte a b)}}`    | `{{#ifCond var1 '>=' var2}}`  |
| `if (a < b)`    | `{{#if (lt a b)}}`     | `{{#ifCond var1 '<' var2}}`   |
| `if (a <= b)`   | `{{#if (lte a b)}}`    | `{{#ifCond var1 '<=' var2}}`  |
| `if (a && b)`   | `{{#if (and a b)}}`    | `{{#ifCond var1 '&&' var2}}`  |
| `if (a \|\| b)` | `{{#if (or a b)}}`     | `{{#ifCond var1 \|\| var2}}`  |

## License

[MIT](LICENSE)
