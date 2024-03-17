const {
    JSDOM
} = require('jsdom')

async function crawlPage(baseURL, currenrtURL, pages) {
    
    const baseURLobj = new URL(baseURL)
    const currenrtURLobj = new URL(currenrtURL)
    if (baseURLobj.hostname !== currenrtURLobj.hostname) {
        return pages
    }

    const normalizedCurrentURL = normalizeURL(currenrtURL)
    if(pages[normalizedCurrentURL] > 0){     //this is to check if we have visited the page more than once so that we do not crawl it again
        pages[normalizedCurrentURL]++
        return pages
    }

    pages[normalizedCurrentURL] = 1

    console.log(`actively crawling: ${currenrtURL}`)
    const htmlBody = ''

    try {
        const resp = await fetch(currenrtURL)
        if (resp.status > 399) {
            console.log(`error in fetch with status code: ${resp.status} on page : ${currenrtURL}`)
            return pages
        }

        const contentType = resp.headers.get("content-type")
        if (!contentType.includes("text/html")) {
            console.log(`non html response, content type:${contentType} on page : ${currenrtURL}`)
            return pages
        }

        htmlBody = await resp.text()
        console.log(await resp.text())

    } catch (err) {
        console.log(`error in fetch: ${err.message}, on page: ${currenrtURL}`)
    }
   
    const nextURLs = getURLsFromHTML(htmlBody, baseURL)

    for(const nextURL of nextURLs){
        pages = await crawlPage(baseURL, nextURL, pages)
    }

    return pages 

}

function getURLsFromHTML(htmlBody, baseURL) {
    const urls = []
    const dom = new JSDOM(htmlBody)
    const linkElements = dom.window.document.querySelectorAll('a')
    for (const linkElement of linkElements) {
        if (linkElement.href.slice(0, 1) === '/') {
            //relative
            try {
                const urlObj = new URL(`${baseURL}${linkElement.href}`)
                urls.push(urlObj.href)
            } catch (err) {
                console.log(`error with relative url : ${err.message}`)
            }

        } else {
            //absolute
            try {
                const urlObj = new URL(linkElement.href)
                urls.push(urlObj.href)
            } catch (err) {
                console.log(`error with absolute url : ${err.message}`)
            }
        }
    }
    return urls
}

function normalizeURL(urlString) {
    const urlObject = new URL(urlString)
    const hostPath = `${urlObject.hostname}${urlObject.pathname}`
    if (hostPath.length > 0 && hostPath.slice(-1) === '/') {
        return hostPath.slice(0, -1)
    }
    return hostPath;
}

module.exports = {
    normalizeURL,
    getURLsFromHTML,
    crawlPage
}