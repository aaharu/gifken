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
        uglify:
            my_target:
                files:
                    "build/src/Gif.min.js": ["build/src/Gif.js"]

    grunt.loadNpmTasks "grunt-typescript"
    grunt.loadNpmTasks "grunt-contrib-uglify"

    grunt.registerTask "ci", ["typescript", "uglify"]
