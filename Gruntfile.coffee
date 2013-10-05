module.exports = (grunt) ->
    "use strict"

    pkg = grunt.file.readJSON "package.json"

    grunt.initConfig
        typescript:
            compile:
                src: "src/gifken.ts"
                dest: "build"
                options:
                    target: "es5"
                    comments: true
        uglify:
            options:
                preserveComments: "some"
            my_target:
                files:
                    "build/src/gifken.min.js": ["build/src/gifken.js"]

    grunt.loadNpmTasks "grunt-typescript"
    grunt.loadNpmTasks "grunt-contrib-uglify"

    grunt.registerTask "ci", ["typescript", "uglify"]
