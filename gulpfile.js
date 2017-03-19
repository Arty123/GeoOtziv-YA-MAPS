var gulp = require("gulp"),
	browserSync = require('browser-sync'),
	rimraf = require('gulp-rimraf'),
	useref = require('gulp-useref'),
	uglify = require('gulp-uglify'),
	gulpif = require('gulp-if'),
	minifyCss = require('gulp-minify-css');

//browserSync
gulp.task('server', function () {
	browserSync({
		port: 9090,
		server: {
			baseDir: 'app'
		}
});
});

//Слежка
gulp.task('watch', function () {
		gulp.watch([
			'app/*.html',
			'app/js/*.js',
			'app/css/*.css'
			]).on('change', browserSync.reload);
	});

//Задача по умолчанию
gulp.task('default', ['server', 'watch']);

//Сборка
gulp.task('useref', function () {
	return 	gulp.src('app/*.html')
			.pipe(useref())
			.pipe(gulpif('*.js', uglify()))
			.pipe(gulpif('*.css', minifyCss({compatibility: 'ie8'})))
			.pipe(gulp.dest('dist'));
});

//Очистка
gulp.task('clean', function () {
	return	gulp.src('dist', {reload: false})
			.pipe(rimraf());
});
