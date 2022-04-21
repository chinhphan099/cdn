'use strict';

const { task, watch, src, dest, parallel, series } = require('gulp'),
  less = require('gulp-less'),
  sass = require('gulp-sass')(require('sass')),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  webserver = require('gulp-webserver'),
  gutil = require('gulp-util'),
  // ip = require('ip'),
  autoprefixer = require('gulp-autoprefixer'),
  babel = require('gulp-babel');

// Source folder configuration
const SRC = {};
SRC.root = './app/';
SRC.js = SRC.root + 'js/*.js';
SRC.less = SRC.root + 'less/';
SRC.scss = SRC.root + 'scss/';
SRC.assets = SRC.root + 'assets/';

const FILES = {
  assets: SRC.assets + '**/*',
  less: SRC.less + '*.less',
  scss: SRC.scss + '*.scss',
};

// Output directories
const PUB = {};
PUB.root = './public/';
PUB.js = PUB.root + 'js/';
PUB.css = PUB.root + 'css/';

task('scripts', () =>
  src([SRC.js])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .on('error', function (err) {
      let displayErr = gutil.colors.red(err.message);
      gutil.log(displayErr);
      this.emit('end');
    })
    .pipe(dest(PUB.js))
);
task('releaseScripts', () =>
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
    .pipe(rename(function(path) {
      if (path.basename === 'blueshift_wow_v1') {
        path.basename = 'blueshift_wow'
      }
    }))
    .pipe(dest(PUB.js))
    .pipe(rename(function(path) {
      if (path.basename === 'blueshift_wow') {
        path.basename = 'blueshift_wow_v2'
      }
    }))
    .pipe(dest(PUB.js))
);

task('less', () =>
  src(FILES.less)
    .pipe(less().on('error', function (err) {
      let displayErr = gutil.colors.red(err.message);
      gutil.log(displayErr);
      this.emit('end');
    }))
    .pipe(autoprefixer('last 3 versions'))
    .pipe(dest(PUB.css))
  //.pipe(cssmin())
  //.pipe(rename({ suffix: '.min' }))
  //.pipe(dest(PUB.css))
);
task('scss', () =>
  src(FILES.scss)
    .pipe(sass().on('error', function (err) {
      let displayErr = gutil.colors.red(err.message);
      gutil.log(displayErr);
      this.emit('end');
    }))
    .pipe(autoprefixer('last 3 versions'))
    .pipe(dest(PUB.css))
  //.pipe(cssmin())
  //.pipe(rename({ suffix: '.min' }))
  //.pipe(dest(PUB.css))
);

task('copyAssets', () =>
  src(FILES.assets).pipe(dest(PUB.root))
);

task('watch', (done) => {
  watch([SRC.js], series('scripts'));
  watch(FILES.assets, series('copyAssets'));
  watch(FILES.less, series('less'));
  watch(FILES.scss, series('scss'));
  done();
});

task('watchrl', (done) => {
  watch([SRC.js], series('releaseScripts'));
  watch(FILES.assets, series('copyAssets'));
  watch(FILES.less, series('less'));
  watch(FILES.scss, series('scss'));
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
  parallel('scripts', 'less', 'scss', 'copyAssets', 'watch')
);
task('default',
  series('clean', 'build', 'webserver')
);
task('release',
  series('clean', 'releaseScripts', 'less', 'scss', 'copyAssets', 'watchrl', 'webserver')
);
