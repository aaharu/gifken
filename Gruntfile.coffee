module.exports = (grunt) ->
    "use strict"

    pkg = grunt.file.readJSON "package.json"

    grunt.initConfig
        pkg: pkg
        uglify:
            options:
                preserveComments: "some"
            compile:
                files:
                    "build/gifken.min.js": ["build/gifken.js"]
        jshint:
            all: ["sample/chromeextension/background/contextMenus.js", "sample/chromeextension/content_scripts/agif.js"]
        typescript:
            build:
                src: ["src/gifken.ts"]
                dest: "build/gifken.js"
                options:
                    target: "es5"
                    comments: true
                    sourcemap: false
                    module: "commonjs"
        yuidoc:
            compile:
                name: "<%= pkg.name %>"
                description: "<%= pkg.description %>"
                version: "<%= pkg.version %>"
                url: ""
                options:
                    extension: ".ts"
                    paths: "src"
                    outdir: "docs"
        watch:
            files: ["src/gifken.ts"]
            tasks: "ci"
        jasmine:
            task:
                src: "build/gifken.js"
                options:
                    specs: "test/*Spec.js"

    grunt.loadNpmTasks "grunt-ts"
    grunt.loadNpmTasks "grunt-contrib-uglify"
    grunt.loadNpmTasks "grunt-contrib-jshint"
    grunt.loadNpmTasks "grunt-contrib-yuidoc"
    grunt.loadNpmTasks "grunt-contrib-jasmine"
    grunt.loadNpmTasks "grunt-typescript"

    grunt.registerTask "ci", ["typescript:build", "jshint", "uglify", "jasmine:task"]
    grunt.registerTask "default", ["ci", "yuidoc"]
