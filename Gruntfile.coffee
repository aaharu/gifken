module.exports = (grunt) ->
    pkg = grunt.file.readJSON "package.json"

    grunt.initConfig
        pkg: pkg
        uglify:
            options:
                preserveComments: "some"
            compile:
                files:
                    "build/gifken.min.js": ["build/gifken.js"]
                    "build/gifken-client.min.js": ["build/gifken-client.js"]
        copy:
            build:
                files: [
                    src: ["src/gifken.js"]
                    dest: "build/gifken.js"
                    filter: "isFile"
                ]
        jshint:
            all: [
                "sample/chromeextension/background/contextMenus.js",
                "sample/chromeextension/content_scripts/agif.js"
#                "sample/node/app.js",
            ]
        typescript:
            build:
                src: ["src/gifken.ts"]
                options:
                    target: "es5"
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
        jasmine_node:
            all: ["test/"]
            options:
                extensions: "js"
                specNameMatcher: "Spec"
        browserify:
            main:
                src: "build/gifken.js"
                dest: "build/gifken-client.js"

    grunt.loadNpmTasks "grunt-contrib-copy"
    grunt.loadNpmTasks "grunt-contrib-uglify"
    grunt.loadNpmTasks "grunt-contrib-jshint"
    grunt.loadNpmTasks "grunt-contrib-yuidoc"
#    grunt.loadNpmTasks "grunt-contrib-jasmine"
    grunt.loadNpmTasks "grunt-jasmine-node"
    grunt.loadNpmTasks "grunt-contrib-watch"
    grunt.loadNpmTasks "grunt-typescript"
    grunt.loadNpmTasks "grunt-browserify"

    grunt.registerTask "ci", ["typescript:build", "jshint", "copy", "browserify", "uglify", "jasmine_node"]
    grunt.registerTask "default", ["ci", "yuidoc"]
