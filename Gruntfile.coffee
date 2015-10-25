module.exports = (grunt) ->
    pkg = grunt.file.readJSON 'package.json'

    grunt.initConfig
        pkg: pkg
        uglify:
            options:
                preserveComments: 'some'
            compile:
                files:
                    'build/gifken.min.js': ['build/gifken.js']
                    'build/gifken-client.min.js': ['build/gifken-client.js']
        typescript:
            build:
                src: ['src/*.ts']
                dest: 'build/tmp/'
                options:
                    target: 'es6'
        yuidoc:
            compile:
                name: '<%= pkg.name %>'
                description: '<%= pkg.description %>'
                version: '<%= pkg.version %>'
                url: '<%= pkg.homepage %>'
                options:
                    extension: '.ts'
                    paths: 'src'
                    outdir: 'docs'
        watch:
            files: ['src/*.ts']
            tasks: 'ci'
        jasmine_node:
            all: ['test/']
            options:
                extensions: 'js'
                specNameMatcher: 'Spec'
        browserify:
            main:
                files:
                    'build/gifken-client.js': ['build/gifken-client.js']
                options:
                    entry: 'gifken'
        babel:
            dist:
                files:
                    'build/gifken.js': 'build/tmp/gifken.js'
                    'build/gifken-client.js': 'build/tmp/gifken-client.js'
        clean: ['build/tmp/']

    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-yuidoc'
#    grunt.loadNpmTasks "grunt-contrib-jasmine"
    grunt.loadNpmTasks 'grunt-jasmine-node'
    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-typescript'
    grunt.loadNpmTasks 'grunt-browserify'
    grunt.loadNpmTasks 'grunt-babel'
    grunt.loadNpmTasks 'grunt-contrib-clean'

    grunt.registerTask 'ci', ['clean', 'typescript:build', 'babel', 'browserify', 'uglify', 'jasmine_node']
    grunt.registerTask 'default', ['ci', 'yuidoc']
