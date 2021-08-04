'use strict';

const { task, watch, src, dest, parallel, series } = require('gulp'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  webserver = require('gulp-webserver'),
  gutil = require('gulp-util'),
  // ip = require('ip'),
  babel = require('gulp-babel');

// Source folder configuration
const SRC = {};
SRC.root = './';
SRC.js = SRC.root + 'js/*.js';

// Output directories
const PUB = {};
PUB.root = './public/';
PUB.js = PUB.root + 'js/';

task('scripts', () =>
  src([SRC.js])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .on('error', function (err) {
      let displayErr = gutil.colors.red(err.message);
      gutil.log(displayErr);
      this.emit('end');
    })
    .pipe(babel({
      "presets": ["@babel/preset-env"]
    }))
    .pipe(uglify())
    .on('error', function(err) {
      let displayErr = gutil.colors.red(err.message);
      gutil.log(displayErr);
      this.emit('end');
    })
    .pipe(dest(PUB.js))
);

task('watch', (done) => {
  watch([SRC.js], series('scripts'));
  done();
});

task('clean', () => {
  return src('./public', { read: false, allowEmpty: true }).pipe(clean());
});

task('webserver', (done) => {
  src(PUB.root)
    .pipe(webserver({
      // host: ip.address(),
      port: process.env.PORT || 2223,
      directoryListing: true
    }));

  done();
});

task('build',
  parallel('scripts', 'watch')
);
task('default',
  series('clean', 'build', 'webserver')
);
