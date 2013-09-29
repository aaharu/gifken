module.exports = (grunt) ->
    "use strict"

    pkg = grunt.file.readJSON "package.json"

    grunt.initConfig
        typescript:
            compile:
                src: "src/Gif.ts"
                dest: "build"
                options:
                    target: "es5"
                    comments: true

    grunt.loadNpmTasks "grunt-typescript"

    grunt.registerTask "ci", ["typescript"]
