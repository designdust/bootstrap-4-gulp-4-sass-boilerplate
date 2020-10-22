"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const del = require("del");
const babel = require('gulp-babel');
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const merge = require("merge-stream");
const htmlreplace = require("gulp-html-replace");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();

// Clean task
gulp.task("clean", () => del(["dist", "assets/css/app.css"]));

// Copy third party libraries from node_modules into /vendor
gulp.task("vendor:js", () => gulp
  .src([
    "./node_modules/bootstrap/dist/js/*",
    "./node_modules/jquery/dist/*",
    "!./node_modules/jquery/dist/core.js",
    "./node_modules/popper.js/dist/umd/popper.*"
  ])
  .pipe(gulp.dest("./assets/js/vendor")));

// Copy font-awesome from node_modules into /fonts
gulp.task("vendor:fonts", () => gulp
  .src([
    "./node_modules/@fortawesome/fontawesome-free/**/*",
    "!./node_modules/@fortawesome/fontawesome-free/{less,less/*}",
    "!./node_modules/@fortawesome/fontawesome-free/{scss,scss/*}",
    "!./node_modules/@fortawesome/fontawesome-free/.*",
    "!./node_modules/@fortawesome/fontawesome-free/*.{txt,json,md}"
  ])
  .pipe(gulp.dest("./assets/fonts/font-awesome")));

// vendor task
gulp.task("vendor", gulp.parallel("vendor:fonts", "vendor:js"));

// Copy vendor's js to /dist
gulp.task("vendor:build", () => {
  const jsStream = gulp
    .src([
      "./assets/js/vendor/bootstrap.bundle.min.js",
      "./assets/js/vendor/jquery.slim.min.js",
      "./assets/js/vendor/popper.min.js"
    ])
    .pipe(gulp.dest("./dist/assets/js/vendor"));
  const fontStream = gulp
    .src(["./assets/fonts/font-awesome/**/*.*"])
    .pipe(gulp.dest("./dist/assets/fonts/font-awesome"));
  return merge(jsStream, fontStream);
});

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task("bootstrap:scss", () => gulp
  .src(["./node_modules/bootstrap/scss/**/*"])
  .pipe(gulp.dest("./assets/scss/bootstrap")));

// Compile SCSS(SASS) files
gulp.task(
  "scss",
  gulp.series("bootstrap:scss", function compileScss() {
    return gulp
      .src(["./assets/scss/*.scss"])
      .pipe(
        sass
          .sync({
            outputStyle: "expanded"
          })
          .on("error", sass.logError)
      )
      .pipe(autoprefixer())
      .pipe(gulp.dest("./assets/css"));
  })
);

// Minify CSS
gulp.task(
  "css:minify",
  gulp.series("scss", function cssMinify() {
    return gulp
      .src("./assets/css/app.css")
      .pipe(cleanCSS())
      .pipe(
        rename({
          suffix: ".min"
        })
      )
      .pipe(gulp.dest("./dist/assets/css"))
      .pipe(browserSync.stream());
  })
);

// Minify Js
gulp.task("js:minify", () => gulp
  .src(["./assets/js/app.js"])
  .pipe(babel({presets: ['minify']}))
  .pipe(
    rename({
      suffix: ".min"
    })
  )
  .pipe(gulp.dest("./dist/assets/js"))
  .pipe(browserSync.stream()));

// Replace HTML block for Js and Css file upon build and copy to /dist
gulp.task("replaceHtmlBlock", () => gulp
  .src(["*.html"])
  .pipe(
    htmlreplace({
      js: "assets/js/app.min.js",
      css: "assets/css/app.min.css"
    })
  )
  .pipe(gulp.dest("dist/")));

// Configure the browserSync task and watch file path for change
gulp.task("watch", function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
  gulp.watch(
    [
      "assets/scss/*.scss",
      "assets/scss/**/*.scss",
      "!assets/scss/bootstrap/**"
    ],
    gulp.series("css:minify", function cssBrowserReload(done) {
      browserSync.reload();
      done(); //Async callback for completion.
    })
  );
  gulp.watch(
    "assets/js/app.js",
    gulp.series("js:minify", function jsBrowserReload(done) {
      browserSync.reload();
      done();
    })
  );
  gulp.watch(["*.html"]).on("change", browserSync.reload);
  done();
});

// Build task
gulp.task(
  "build",
  gulp.series(
    gulp.parallel("css:minify", "js:minify", "vendor"),
    "vendor:build",
    function copyAssets() {
      return gulp
        .src(["*.html", "favicon.ico", "assets/img/**"], { base: "./" })
        .pipe(gulp.dest("dist"));
    }
  )
);

// Default task
gulp.task("default", gulp.series("clean", "build", "replaceHtmlBlock"));
