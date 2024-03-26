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

### Quick use

file.service.ts

```javascript
import { generatePdf } from 'pdfile';
import * as path from 'path';
import * as fs from 'fs';

fileService() {
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
      dataPerPage
    );
}


```

path/templates/pdf-invoice.hbs

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice</title>

    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ"
      crossorigin="anonymous"
    />

    <link rel="stylesheet" type="text/css" href="styles.css" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>

  <body>
    <section id="invoice">
      <div class="container">
        <div class="text-center border-top border-bottom my-3 py-3">
          <h2 class="fw-bold">Invoice</h2>
          <p class="m-0">Invoice No: {{ invoiceNumber }}</p>
          <p class="m-0">Invoice Date: {{ invoiceDate }}</p>
        </div>

        <div class="row d-md-flex justify-content-between">
          <div class="col">
            <p class="text-primary">Invoice To</p>
            <h4>{{ client.name }}</h4>
            <ul class="list-unstyled">
              <li>{{ client.company }}</li>
              <li>{{ client.email }}</li>
              <li>{{ client.address }}</li>
            </ul>
          </div>
          <div class="col">
            <p class="text-primary">Invoice From</p>
            <h4>{{ company.name }}</h4>
            <ul class="list-unstyled">
              <li>{{ company.company }}</li>
              <li>{{ company.email }}</li>
              <li>{{ company.address }}</li>
            </ul>
          </div>
        </div>

        <table class="table border my-2">
          <thead>
            <tr class="bg-primary-subtle">
              <th scope="col">No.</th>
              <th scope="col">Description</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <th scope="row">{{ @index }}</th>
              <td>{{ description }}</td>
              <td>{{ price }}</td>
              <td>{{ quantity }}</td>
              <td>{{ total }}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="d-md-flex justify-content-between my-2">
          <div>
            <h5 class="fw-bold my-3">Contact Us</h5>
            <ul class="list-unstyled">
              <li>
                <iconify-icon
                  class="social-icon text-primary fs-5 me-2"
                  icon="mdi:location"
                  style="vertical-align:text-bottom"
                ></iconify-icon>
                {{ contact.address }}
              </li>
              <li>
                <iconify-icon
                  class="social-icon text-primary fs-5 me-2"
                  icon="solar:phone-bold"
                  style="vertical-align:text-bottom"
                ></iconify-icon>
                {{ contact.phone }}
              </li>
              <li>
                <iconify-icon
                  class="social-icon text-primary fs-5 me-2"
                  icon="ic:baseline-email"
                  style="vertical-align:text-bottom"
                ></iconify-icon>
                {{ contact.email }}
              </li>
            </ul>
          </div>
          <div>
            <h5 class="fw-bold my-3">Payment Info</h5>
            <ul class="list-unstyled">
              <li>
                <span class="fw-semibold">Account No: </span> {{
                payment.accountNo }}
              </li>
              <li>
                <span class="fw-semibold">Account Name: </span> {{
                payment.accountName }}
              </li>
              <li>
                <span class="fw-semibold">Branch Name: </span> {{
                payment.branchName }}
              </li>
            </ul>
          </div>
        </div>

        <div class="text-center my-5">
          <p class="text-muted">
            <span class="fw-semibold">NOTICE: </span> {{ notice }}
          </p>
        </div>

        <div id="footer-bottom">
          <div class="container border-top">
            <div class="row mt-3">
              <div class="col-md-6 copyright">
                <p>
                  © {{ copyrightYear }} Invoice.
                  <a
                    href="#"
                    target="_blank"
                    class="text-decoration-none text-black-50"
                    >Terms & Conditions</a
                  >
                </p>
              </div>
              <div class="col-md-6 text-md-end">
                <p>
                  Free HTML Template by:
                  <a
                    href="https://templatesjungle.com/"
                    target="_blank"
                    class="text-decoration-none text-black-50"
                  >
                    TemplatesJungle</a
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ENjdO4Dr2bkBIFxQpeoTz1HIcje39Wm4jDKdf19U8gI4ddQ3GYNS7NTKfAdVQSZe"
      crossorigin="anonymous"
    ></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
  </body>
</html>
```

path/templates/pdf-invoice.hbs.json

```json
{
  "invoiceNumber": 12345,
  "invoiceDate": "20 May, 2024",
  "client": {
    "name": "Roger Y. Will",
    "company": "XYZ Company",
    "email": "info@xyzcompany.com",
    "address": "123 Main Street"
  },
  "company": {
    "name": "William Peter",
    "company": "ABC Company",
    "email": "info@abccompany.com",
    "address": "456 Main Street"
  },
  "items": [
    {
      "description": "Brand Designing",
      "price": "$350.00",
      "quantity": 2,
      "total": "$700.00"
    },
    {
      "description": "Website Development",
      "price": "$250.00",
      "quantity": 1,
      "total": "$250.00"
    },
    {
      "description": "Blog Writing",
      "price": "$100.00",
      "quantity": 4,
      "total": "$400.00"
    },
    {
      "description": "Logo Designing",
      "price": "$350.00",
      "quantity": 2,
      "total": "$700.00"
    }
  ],
  "contact": {
    "address": "30 E Lake St, Chicago, USA",
    "phone": "(510) 710-3464",
    "email": "info@worldcourse.com"
  },
  "payment": {
    "accountNo": "102 3345 56938",
    "accountName": "William Peter",
    "branchName": "XYZ"
  },
  "notice": "A finance charge of 1.5% will be made on unpaid balances after 30 days.",
  "copyrightYear": 2024
}
```

Result:

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
