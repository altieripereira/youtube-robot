const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

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

        content.senteces = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.senteces.push({
                text: sentence, 
                keyWords: [],
                images: [] 
            })
        })
    }
}

module.exports = robot