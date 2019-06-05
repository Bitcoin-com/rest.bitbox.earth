"use strict"
const gulp = require("gulp")
const fs = require("fs-extra")
const merge = require("gulp-merge-json")

const ASSET_FILES = ["src/*.json", "src/**/*.json", "src/**/*.jade"]
const VIEW_FILES = ["src/**/*.jade"]

const MARKUP_FILES = [
  "src/public/**/*.css",
  "src/public/**/*.png",
  "src/public/**/*.js"
]

gulp.task("build", () => {
  fs.emptyDirSync("./dist")
  fs.removeSync("./dist")
  fs.emptyDirSync("./swaggerJSONFilesBuilt")
  fs.removeSync("./swaggerJSONFilesBuilt")

  gulp.src(ASSET_FILES).pipe(gulp.dest("dist"))
  gulp.src(MARKUP_FILES).pipe(gulp.dest("dist/public"))
  gulp.src(VIEW_FILES).pipe(gulp.dest("dist/src"))

  // set example vars for testnet
  const testnetInfoJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/testnet/info.json"
  )
  const testnetPathsJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/testnet/paths.json"
  )
  const testnetComponentsJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/testnet/components.json"
  )
  const testnetInfo = JSON.parse(testnetInfoJSON)
  const testnetPaths = JSON.parse(testnetPathsJSON)
  const testnetComponents = JSON.parse(testnetComponentsJSON)

  gulp
    .src("./swaggerJSONFiles/info.json")
    .pipe(
      merge({
        fileName: "./testnet/info.json",
        edit: (parsedJson, file) => {
          testnetInfo.forEach((item, index) => {
            parsedJson.info.description = item.value
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src("./swaggerJSONFiles/paths.json")
    .pipe(
      merge({
        fileName: "./testnet/paths.json",
        edit: (parsedJson, file) => {
          testnetPaths.forEach((item, index) => {
            Object.keys(parsedJson.paths).forEach(key => {
              if (key === item.key) {
                if (parsedJson.paths[key].get) {
                  parsedJson.paths[key].get.parameters.forEach(param => {
                    if (param.name === item.name) param.example = item.value
                  })
                } else if (parsedJson.paths[key].post) {
                  parsedJson.paths[key].post.parameters.forEach(param => {
                    if (param.name === item.name) param.example = item.value
                  })
                }
              }
            })
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src("./swaggerJSONFiles/components.json")
    .pipe(
      merge({
        fileName: "./testnet/components.json",
        edit: (parsedJson, file) => {
          testnetComponents.forEach((item, index) => {
            if (item.key === "RawTxids") {
              parsedJson.components.schemas.RawTxids.properties.txids.example =
                item.value
            }

            if (item.key === "SLPTxids") {
              parsedJson.components.schemas.SLPTxids.properties.txids.example =
                item.value
            }

            Object.keys(parsedJson.components.schemas).forEach(key => {
              if (
                key === item.key &&
                parsedJson.components.schemas[key].properties[
                  key.toLowerCase()
                ] &&
                parsedJson.components.schemas[key].properties[key.toLowerCase()]
                  .example
              ) {
                parsedJson.components.schemas[key].properties[
                  key.toLowerCase()
                ].example = item.value
              }
            })
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src(["./swaggerJSONFiles/servers.json"])
    .pipe(gulp.dest("./swaggerJSONFilesBuilt/testnet"))

  gulp
    .src(["./swaggerJSONFiles/tags.json"])
    .pipe(gulp.dest("./swaggerJSONFilesBuilt/testnet"))

  setTimeout(function() {
    gulp
      .src("./swaggerJSONFilesBuilt/testnet/**/*.json")
      .pipe(
        merge({
          fileName: "bitcoin-com-testnet-rest-v2.json"
        })
      )
      .pipe(gulp.dest("./dist/public"))
  }, 1000)

  // set example vars for mainnet
  const mainnetInfoJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/mainnet/info.json"
  )
  const mainnetPathsJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/mainnet/paths.json"
  )
  const mainnetComponentsJSON = fs.readFileSync(
    "./swaggerJSONFiles/fixtures/mainnet/components.json"
  )
  const mainnetInfo = JSON.parse(mainnetInfoJSON)
  const mainnetPaths = JSON.parse(mainnetPathsJSON)
  const mainnetComponents = JSON.parse(mainnetComponentsJSON)

  gulp
    .src("./swaggerJSONFiles/info.json")
    .pipe(
      merge({
        fileName: "./mainnet/info.json",
        edit: (parsedJson, file) => {
          mainnetInfo.forEach((item, index) => {
            parsedJson.info.description = item.value
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src("./swaggerJSONFiles/paths.json")
    .pipe(
      merge({
        fileName: "./mainnet/paths.json",
        edit: (parsedJson, file) => {
          mainnetPaths.forEach((item, index) => {
            Object.keys(parsedJson.paths).forEach(key => {
              if (key === item.key) {
                if (parsedJson.paths[key].get) {
                  parsedJson.paths[key].get.parameters.forEach(param => {
                    if (param.name === item.name) param.example = item.value
                  })
                } else if (parsedJson.paths[key].post) {
                  parsedJson.paths[key].post.parameters.forEach(param => {
                    if (param.name === item.name) param.example = item.value
                  })
                }
              }
            })
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src("./swaggerJSONFiles/components.json")
    .pipe(
      merge({
        fileName: "./mainnet/components.json",
        edit: (parsedJson, file) => {
          mainnetComponents.forEach((item, index) => {
            if (item.key === "RawTxids") {
              parsedJson.components.schemas.RawTxids.properties.txids.example =
                item.value
            }

            if (item.key === "SLPTxids") {
              parsedJson.components.schemas.SLPTxids.properties.txids.example =
                item.value
            }

            Object.keys(parsedJson.components.schemas).forEach(key => {
              // console.log(key, parsedJson.components.schemas[key].properties)
              if (
                key === item.key &&
                parsedJson.components.schemas[key].properties &&
                parsedJson.components.schemas[key].properties[
                  key.toLowerCase()
                ] &&
                parsedJson.components.schemas[key].properties[key.toLowerCase()]
                  .example
              ) {
                // let tmpKey
                // console.log(key, item.key)
                // if (key === "BlockHashes") tmpKey = "hashes"
                // else tmpKey = key.toLowerCase()

                parsedJson.components.schemas[key].properties[
                  key.toLowerCase()
                ].example = item.value
              }
            })
          })

          return parsedJson
        }
      })
    )
    .pipe(gulp.dest("./swaggerJSONFilesBuilt"))

  gulp
    .src(["./swaggerJSONFiles/servers.json"])
    .pipe(gulp.dest("./swaggerJSONFilesBuilt/mainnet"))

  gulp
    .src(["./swaggerJSONFiles/tags.json"])
    .pipe(gulp.dest("./swaggerJSONFilesBuilt/mainnet"))

  setTimeout(function() {
    gulp
      .src("./swaggerJSONFilesBuilt/mainnet/**/*.json")
      .pipe(
        merge({
          fileName: "bitcoin-com-mainnet-rest-v2.json"
        })
      )
      .pipe(gulp.dest("./dist/public"))
  }, 1000)
})
