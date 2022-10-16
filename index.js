import doc from '!docs!./docRoot'

document.body.innerHTML = `<code>${JSON.stringify(doc, null, 2)}</code>`