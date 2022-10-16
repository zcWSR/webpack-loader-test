const path = require('path')
const fs = require('fs')
const lodash = require('lodash')
const {parse} = require('@babel/parser')
const traverse = require('@babel/traverse').default;

/** @type {import('webpack').LoaderDefinition<{child: boolean}>} */
const loader = async function(code) {
  this._module.type = 'json'
  const isChild = this.getOptions().child !== undefined
  const callback = this.async()
  const result = {value: {}}
  const depsPromise = []
  const that = this
  function addDeps(source) {
    return new Promise((resolve, reject) => {
      that.loadModule(`!./loaders/docLoader.js?child!${path.resolve(that.context, source)}`, (err, stringResult) => {
        console.log('recursive result', stringResult)
        console.log(typeof stringResult)
        if (err) {
          reject(err)
        } else {
          lodash.merge(result, stringResult)
          resolve()
        }
      })
    })
  }

  const ast = parse(code, {
    filename: path.basename(that.resourcePath),
    allowReturnOutsideFunction: true,
    strictMode: false,
    sourceType: 'module',
    plugins: ['classProperties', 'exportDefaultFrom', 'exportNamespaceFrom', 'dynamicImport', 'classPrivateProperties', 'classPrivateMethods']
  })

  function ExportNamedDeclaration(path) {
    if (path.node.source) {
      if (result) {
        for (let specifier of path.node.specifiers) {
          result[specifier.exported.name] = true
        }
        depsPromise.push(addDeps(path.node.source.value))
      }
    } else if (path.node.specifiers?.length > 0) {
      for (let specifier of path.node.specifiers) {
        const binding = path.scope.getBinding(specifier.local.name);
        if (binding) {
          result.value[specifier.exported.name] = binding.value || 'someValue'
        }
      }
    }
  }
  traverse(ast, {
    ExportNamedDeclaration,
    ExportAllDeclaration(path) {
      depsPromise.push(addDeps(path.node.source.value))
    },
    ExportDefaultDeclaration(path) {
      ExportNamedDeclaration(path)
    }
  })
  Promise.all(depsPromise).then(() => {
    const serializedResult = JSON.stringify(result, null, 2)
    if (isChild) {
      callback(null, serializedResult)
    } else {
      callback(null, `module.exports.default = ${serializedResult}`)
    }
  }).catch(err => callback(err))
}

module.exports = loader
