const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')
async function robot() {

    console.log('> [image-robot] Starting...')
    const content = state.load()
    await fetchImagesOfAllSentences(content)
    state.save(content)

    // const imageArray = await fetchGoogleAndReturnImagesLinks('Michael Jackson')
    // console.dir(imageArray, { depth: null })
    // process.exit(0)

    async function fetchImagesOfAllSentences(content) {

        for(const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)

            sentence.googleSearchQuery = query
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {

        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            searchType: 'image',
            q: query,
            num: 2
        })

        const imageUrl = response.data.items.map((item) => {
            return item.link
        })
        return imageUrl
    }
}

module.exports = robot