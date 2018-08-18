# type-system

[![Coveralls Status][coveralls-image]][coveralls-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![david-dm][david-dm-image]][david-dm-url]

> Type system for inference

## Remove This Section After Reading

Make sure you update this *README* file and remove this section. By using copious amount of *JSDoc* tags you can ensure good code documentation. This module supports the automatic generation of an API document by typing `npm run mddocs` which will create a document `API.md` which you can link to or concatenate to this *README.md* file.

It has also set up a unit test enviroment. Just type `npm test` to execute your unit tests which will be in the `test/` directory. It uses **mocha** and **chai** for testing.

It has `.gitignore`, `.editorconfig`, and `.eslintrc.json` files in the project root.

Here's how to finalize the **git** VCS for this project.

1. Create your repository on https://github.com/julianjensen/type-system (Your project directory is already init'd and staged for commit)
2. Type `git push -u origin master`

## Install

```sh
npm i type-system
```

## Usage

```js
const 
    typeSystem = require( 'type-system' );

typeSystem() // true
```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/type-system)

[coveralls-url]: https://coveralls.io/github/julianjensen/type-system?branch=master
[coveralls-image]: https://coveralls.io/repos/github/julianjensen/type-system/badge.svg?branch=master

[travis-url]: https://travis-ci.org/julianjensen/type-system
[travis-image]: http://img.shields.io/travis/julianjensen/type-system.svg

[depstat-url]: https://gemnasium.com/github.com/julianjensen/type-system
[depstat-image]: https://gemnasium.com/badges/github.com/julianjensen/type-system.svg

[npm-url]: https://badge.fury.io/js/type-system
[npm-image]: https://badge.fury.io/js/type-system.svg

[license-url]: https://github.com/julianjensen/type-system/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[snyk-url]: https://snyk.io/test/github/julianjensen/type-system
[snyk-image]: https://snyk.io/test/github/julianjensen/type-system/badge.svg

[david-dm-url]: https://david-dm.org/julianjensen/type-system
[david-dm-image]: https://david-dm.org/julianjensen/type-system.svg

