var express = require('express');
var app = express();


var http = require('http').Server(app);

http.listen(3005, function() {
    console.log('listening on *:3005');
});



const fs = require('fs')
const path = require('path')
const utils = require('util')
const puppeteer = require('puppeteer')
const hb = require('handlebars')
app.get('/', function(request, response) {


    const readFile = utils.promisify(fs.readFile)
    async function getTemplateHtml() {
        console.log("Loading template file in memory")
        try {
            const invoicePath = path.resolve("./orderhtml.html");
            return await readFile(invoicePath, 'utf8');
        } catch (err) {
            return Promise.reject("Could not load html template");
        }
    }
    async function generatePdf() {
        let data = {};
        getTemplateHtml().then(async(res) => {
            // Now we have the html code of our template in res object
            // you can check by logging it on console
            // console.log(res)
            console.log("Compiing the template with handlebars")
            const template = hb.compile(res, { strict: true });
            // we have compile our code with handlebars
            const result = template(data);
            // We can use this to add dyamic data to our handlebas template at run time from database or API as per need. you can read the official doc to learn more https://handlebarsjs.com/
            const html = result;
            // we are using headless mode
            const browser = await puppeteer.launch({ headless: true, });
            const page = await browser.newPage()
                // We set the page content as the generated html by handlebars
            await page.setContent(html)
                // We use pdf function to generate the pdf in the same folder as this file.
            await page.pdf({ path: 'orderhtml.pdf', format: 'A4' })
            await browser.close();
            console.log("PDF Generated")
            var file = fs.createReadStream('./orderhtml.pdf');
            var stat = fs.statSync('./orderhtml.pdf');
            response.setHeader('Content-Length', stat.size);
            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
            file.pipe(response);
        }).catch(err => {
            console.error(err)
        });
    }
    generatePdf();
})
module.exports = app;