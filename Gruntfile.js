module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-ts')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-watch')
//  grunt.loadNpmTasks('grunt-text-replace')

  grunt.initConfig({
    ts: {
      plantlab: {                                 // a particular target
        src: ["lib/PlantLab.ts" ],        // The source typescript files, http://gruntjs.com/configuring-tasks#files
        out: 'plantlab.js',                // If specified, generate an out.js file which is the merged js file
        options: {                    // use to override the default options, http://gruntjs.com/configuring-tasks#options
          target: 'es5',            // 'es3' (default) | 'es5'
          module: 'commonjs',       // 'amd' (default) | 'commonjs'
          declaration: true,       // true | false  (default)
          verbose: true
        }
      }
    },
    concat: {
      options: {
        separator: ''
      },
      plantlab: {
        src: [
          'lib/plantlab_header.js',
          'plantlab.js',
          'lib/plantlab_footer.js'
        ],
        dest: 'plantlab.js'
      },
      "plantlab-def": {
        src: [
          'plantlab.d.ts',
          'lib/plantlab_definition_footer'
        ],
        dest: 'plantlab.d.ts'
      }
    },
//    replace: {
//      "plantlab-def": {
//        src: ["plantlab.d.ts"],
//        overwrite: true,
//        replacements: [
//          {
//            from: 'defs/',
//            to: ""
//          }
//        ]
//      }
//    },
    watch: {
      plantlab: {
        files: 'lib/**/*.ts',
        tasks: ['default']
      }
    }
  })

  grunt.registerTask('default', ['ts:plantlab', 'concat:plantlab', 'concat:plantlab-def']);

}