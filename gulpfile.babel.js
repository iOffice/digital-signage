import gulp from 'gulp';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import connect from 'gulp-connect';


gulp.task('script', () => {
  return gulp.src('src/src.es6.js')
    .pipe(babel())
    .pipe(rename('src.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', {debounce: 400}, ['script']);
});

gulp.task('connect', function () {
  connect.server({
    root: '.',
    port: 9001,
    livereload: true
  })
});


gulp.task('default', ['script', 'connect', 'watch']);
