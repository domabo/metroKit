var gulp = require("gulp");
var bower = require("gulp-bower");
var bowerFiles = require("gulp-bower-files");
var clean = require("gulp-clean");
var less = require("gulp-less");
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('bowerInstall', function() {
    return bower();
});

gulp.task('build-less', ['bowerInstall'], function(){
    return gulp.src('./bower_components/metro-bootstrap/bootstrap/bootstrap.less')
        .pipe(less())
        .pipe(gulp.dest('./bower_components/metro-bootstrap/css'))
        ;
});

gulp.task('minify-css', ['build-less'], function(){
    return gulp.src('./bower_components/metro-bootstrap/css/**')
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('./bower_components/metro-bootstrap/css'));
});



gulp.task('uglify-js', ['bowerInstall'], function(){
    return gulp.src('./bower_components/metro-bootstrap/docs/jquery-1.8.0.js')
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./lib/metro-bootstrap/js'));
});

gulp.task('bowerCopyLib', ['bowerInstall'], function() {
    return bowerFiles().pipe(gulp.dest("./lib"));
});

gulp.task('bowerCopyCSS', ['minify-css'], function() {
    return gulp.src('./bower_components/metro-bootstrap/css/*.css')
    .pipe(gulp.dest("./lib/metro-bootstrap/css"));
});

gulp.task('bowerCopyFontCss', ['bowerInstall'], function() {
    return gulp.src('./bower_components/metro-bootstrap/docs/font-awesome.css')
       .pipe(gulp.dest('./lib/metro-bootstrap/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('./lib/metro-bootstrap/css'));
});

gulp.task('bowerCopyJS', ['uglify-js', 'bowerInstall'], function() {
    return gulp.src('./bower_components/metro-bootstrap/docs/*.js')
    .pipe(gulp.dest("./lib/metro-bootstrap/js"));
});

gulp.task('bowerClean', ['bowerCopyLib', 'bowerCopyCSS', 'bowerCopyFontCss', 'bowerCopyJS'], function() {
    return gulp.src('./bower_components', {read: false})
	.pipe(clean({force: true}));
});

gulp.task('bower', ['bowerClean']);