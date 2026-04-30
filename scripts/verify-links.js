const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data", "apis.json");
const reportPath = path.join(root, "data", "link-report.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const concurrency = Number(process.argv[2] || 18);

let cursor = 0;
let completed = 0;
const results = new Array(payload.entries.length);

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function run() {
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  payload.entries = payload.entries.map((entry, index) => ({
    ...entry,
    LinkStatus: results[index].status,
    LinkStatusCode: results[index].statusCode,
    FinalLink: results[index].finalUrl || entry.Link,
    LinkCheckedAt: new Date().toISOString()
  }));

  const summary = payload.entries.reduce(
    (acc, entry) => {
      acc[entry.LinkStatus] = (acc[entry.LinkStatus] || 0) + 1;
      return acc;
    },
    {}
  );

  const report = {
    checkedAt: new Date().toISOString(),
    total: payload.entries.length,
    summary,
    needsReview: payload.entries
      .filter((entry) => entry.LinkStatus === "bad")
      .map((entry) => ({
        API: entry.API,
        Category: entry.Category,
        Link: entry.Link,
        FinalLink: entry.FinalLink,
        statusCode: entry.LinkStatusCode
      }))
  };

  fs.writeFileSync(dataPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Checked ${payload.entries.length} links`);
  console.log(summary);
}

async function worker() {
  while (cursor < payload.entries.length) {
    const index = cursor++;
    const entry = payload.entries[index];
    results[index] = await checkLink(entry.Link);
    completed++;

    if (completed % 50 === 0 || completed === payload.entries.length) {
      console.log(`${completed}/${payload.entries.length}`);
    }
  }
}

async function checkLink(url) {
  try {
    const result = await request(url, "HEAD", 0);
    if (isAcceptable(result.statusCode)) return classify(url, result);
    if ([403, 405, 429].includes(result.statusCode)) {
      const getResult = await request(url, "GET", 0);
      return classify(url, getResult);
    }

    return classify(url, result);
  } catch (headError) {
    try {
      const getResult = await request(url, "GET", 0);
      return classify(url, getResult);
    } catch (getError) {
      return {
        status: "bad",
        statusCode: 0,
        finalUrl: url,
        error: getError.message
      };
    }
  }
}

function classify(originalUrl, result) {
  if (isAcceptable(result.statusCode)) {
    return {
      status: isGithubUrl(result.finalUrl || originalUrl) ? "github" : "ok",
      statusCode: result.statusCode,
      finalUrl: result.finalUrl || originalUrl
    };
  }

  if ([401, 403, 429].includes(result.statusCode)) {
    return {
      status: "limited",
      statusCode: result.statusCode,
      finalUrl: result.finalUrl || originalUrl
    };
  }

  return {
    status: "bad",
    statusCode: result.statusCode,
    finalUrl: result.finalUrl || originalUrl
  };
}

function isAcceptable(statusCode) {
  return statusCode >= 200 && statusCode < 400;
}

function isGithubUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "github.com" || host.endsWith(".github.io");
  } catch {
    return false;
  }
}

function request(url, method, redirects) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      reject(new Error("Invalid URL"));
      return;
    }

    const client = parsed.protocol === "http:" ? http : https;
    const req = client.request(
      parsed,
      {
        method,
        timeout: 9000,
        headers: {
          "User-Agent": "Free-API-Keys-Link-Checker/1.0",
          Accept: "text/html,application/json;q=0.9,*/*;q=0.8"
        }
      },
      (res) => {
        const location = res.headers.location;
        res.resume();

        if ([301, 302, 303, 307, 308].includes(res.statusCode) && location && redirects < 5) {
          const nextUrl = new URL(location, parsed).toString();
          resolve(request(nextUrl, method, redirects + 1));
          return;
        }

        resolve({
          statusCode: res.statusCode,
          finalUrl: parsed.toString()
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}
