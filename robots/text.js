const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonApiKey,
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

const state = require('./state.js')

async function robot() {

    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordsOfAllSentences(content)

    state.save(content)

    async function fetchContentFromWikipedia(content) {

        var input = {
            "articleName": content.searchTerm,
            "lang": "pt"
        }

        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlghorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
        const wikipediaResponse = await wikipediaAlghorithm.pipe(input)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOrignal = wikipediaContent.content
    }

    function sanitizeContent(content) {

        const withoutBlankAndMarkdownLines = removeBlankLInesAndMarkdown(content.sourceContentOrignal)
        const withoutDatesInParentheses  = removeDatesInParentheses(withoutBlankAndMarkdownLines)
        content.sourceContentSanitized = withoutDatesInParentheses
    }

    function removeBlankLInesAndMarkdown(text) {

        const allLines = text.split('\n')
        const withoutBlankLines = allLines.filter((line) => {
            if(line.trim().length === 0 || line.trim().startsWith('=')) {
                return false
            }
            return true
        })
        return withoutBlankLines.join(' ')
    }

    function removeDatesInParentheses(text) {
        return text.replace(/(\s\(.*?\))|<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '')
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence, 
                keywords: [],
                images: [] 
            })
        })
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(content) {

        for (const sentence of content.sentences) {
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
          nlu.analyze({
            text: sentence,
            features: {
              keywords: {}
            }
          }, (error, response) => {
            if (error) {
              reject(error)
              return
            }
    
            const keywords = response.keywords.map((keyword) => {
              return keyword.text
            })
    
            resolve(keywords)
          })
        })
      }
}

module.exports = robot