module.exports = (grunt) ->
    "use strict"

    pkg = grunt.file.readJSON 'package.json'

    grunt.initConfig
        typescript:
            compile:
                src: 'src/Gif.ts'
                dest: 'build'
                options:
                    target: 'es5'

    grunt.loadNpmTasks 'grunt-typescript'
