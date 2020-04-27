const puppeteer = require("puppeteer");
const fs = require("fs");
const url = "https://youtube.com/feed/history";
const getCategoryFromVideo = require("get-youtube-video-category/lib");

(async () => {
  const cookies = JSON.parse(fs.readFileSync("cookie.json", "utf8"));
  const browser = await puppeteer.launch({});

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );

  await page.setCookie(...cookies);
  await page.goto(url);

  const delay = 2600;
  let preCount = 0;
  let postCount = 0;
  let count = 0;

  do {
    count++;
    preCount = await getCount(page);
    await scrollDown(page);
    await page.waitFor(delay);
    postCount = await getCount(page);
  } while (count > 1);
  await page.waitFor(delay);

  const data = await getLinks(page);
  for (d of data) {
    const category = await getCategoryFromVideo(d.href).catch(err => {
      return ""
    });
    console.log(category)
    d.category = category
  }
  fs.writeFileSync("categories.json", JSON.stringify(data));
  await browser.close();
})();

async function getCount(page) {
  return await page.$$eval("#thumbnail", (a) => a.length);
}

async function getLinks(page) {
  return await page.$$eval("#video-title", (nodes) =>
    nodes.map(({ href, title }) => ({ href, title }))
  );
}

async function scrollDown(page) {
  await page.$eval("ytd-item-section-renderer:last-child", (e) => {
    e.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
  });
}
