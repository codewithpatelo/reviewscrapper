// Cargamos librerías...
const https = require('https');
const cheerio = require('cheerio');
const moment = require('moment');
const natural = require('natural');
const lorca = require('lorca-nlp');
const fs = require('file-system');
const chalk = require('chalk');
const EventEmitter = require('events');

const { log } = console;

const baseUrl = 'https://www.trustpilot.com/review/';
// Aca va la url de la página a revisar más query parameters.
const param = '<URL>=es&stars=1&page=';
// Ex.: const param = 'anuncios.ebay.es?languages=es&stars=1&page=';

const url = baseUrl + param;
let $ = '';

const urls = [];

// Aca indicar cuantas páginas de reviews se va a extraer...
const pn = n;
// Ex.: const pn = 7;

for (let i = 1; i < pn; i++) {
  urls.push(url + i);
}

console.log(urls);

const reviewsEs = [];
let words = [];
const fulltext = [];
let word = {};
let responses = [];
let doc = '';
let completed_requests = 0;

// Listado de stopwords para eliminar...
const stopWords = [' al ', ' no ', ' si ', ' su ', 'qué', 'más', ' uno ', ' como ', ' con ', 'La ', 'El ', 'Lo ', ' son ', 'Los ', 'No ', ' las ', ' sus ', 'Su ', ' con ', 'Te ', 'Para ', ' yo ', ' el ', ' se ', ' por ', ' vos ', ' un ', ' de ', ' tu ', ' para ', ' el ', ' lo ', ' los ', ' ella ', ' de ', ' es ', ' una ', ' fue ', ' tiene ', ' la ', ' y ', ' del ', ' los ', ' que ', ' a ', ' en ', ' el '];

class Review {
  constructor(name, text, words, time) {
    this.name = name;
    this.text = text;
    this.keywords = words;
    if (time === undefined) {
      this.time = moment().format();
    } else {
      this.time = time;
    }
  }
}

class Word {
  constructor(word, size) {
    this.word = word;
    this.size = size;
  }
}

function titleCase(str) {
  const splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}

function removeDups(args) {
  let unique = {};
  args.forEach(function(i) {
    if(!unique[i]) {
      unique[i] = true;
    }
  });
  return Object.keys(unique);
}


const extraccion = new EventEmitter();

extraccion.on('completo', ($) => {
    
  log(chalk.blue(`Processing...`));
  
  // Por cada review extraemos el nombre y el texto...
  $('article').each((x, item) => {
            let name = $('aside > a > div.consumer-information__details > div.consumer-information__name', item).text();
            let text = $('div.review-content__body > p', item).text();
            name = titleCase(name);
            name = name.replace(/\s/g, '');
            text = text.replace('\n', '');
            doc = text;
            doc = String(doc).toLowerCase();

            for (k = 0; k < stopWords.length; k++) {
              doc = doc.replace(new RegExp(stopWords[k], 'g'), ' ');
            }

            doc = lorca(doc);

            const countData = doc.concordance().sort(5).get();

            for (let j = 0; j < Object.keys(countData).length; j += 1) {
              word = new Word(String(Object.keys(countData)[j], Object.values(countData)[j]));
              words.push(word);
            }

            fulltext.push(text);

            log(chalk.green(x+'New review created'));

            const review = new Review(name, text);
            reviewsEs.push(review);
            words = [];
          }); // END ARTICLE
          
          reviewsEs2 = JSON.stringify(reviewsEs);
          fs.writeFileSync('reviewsEs.json', reviewsEs2);
          console.log(reviewsEs.length);
});

urls.forEach(function(url) {
    console.log(url);
  https.get(url, function(res) {
    res.on('data', (data) => {
      let body = '';
      body += data;
      
      responses.push(String(body));
      
      $ = cheerio.load(String(body));
         
      extraccion.emit('completo', $);

    });

    res.on('end', function(){
      if (completed_requests++ == urls.length - 1) {
          

       
      }      
    });
  });
})




