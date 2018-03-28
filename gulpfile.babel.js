/**
 * Mantis Starter
 * https://github.com/mantis-stack/mantis-starter
 *
 * Copyright 2016 - 2018 Acauã Montiel (@acauamontiel)
 * Released under the MIT license (http://acaua.mit-license.org)
 */

'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import runSequence from 'run-sequence';
import nib from 'nib';
import path from './gulpfile.paths.js';
import fs from 'fs';
import {version} from './package.json';

var dev = true;

const $ = gulpLoadPlugins({
	pattern: ['gulp-*', 'mantis-*'],
	replaceString: /^(gulp|mantis)-/
});
const server = browserSync.create();
const reload = server.reload;

gulp.task('html', () =>
	gulp.src(path.html.src)
		.pipe($.changed('html'))
		.pipe($.plumber())
		.pipe($.data(() => {
			return require('./content.json');
		}))
		.pipe($.pug({
			pretty: dev,
			locals: {
				version: version,
				icons: fs.readdirSync(`${__dirname}/src/img/sprite`)
			}
		}))
		.pipe(gulp.dest(path.html.dest))
		.pipe($.size({title: 'html'}))
		.on('end', reload)
);

gulp.task('css', () =>
	gulp.src(path.css.src)
		.pipe($.plumber())
		.pipe($.stylus({
			use: [
				nib(),
				$.equalizr(),
				$.querist(),
				$.grid(),
				$.layers()
			],
			compress: !dev,
			linenos: dev,
			errors: true,
			sourcemap: {
				inline: dev,
				sourceRoot: '../',
				basePath: 'css'
			}
		}))
		.pipe(gulp.dest(path.css.dest))
		.pipe($.size({title: 'css'}))
		.pipe(reload({stream: true}))
);

gulp.task('img', () =>
	gulp.src(path.img.src)
		.pipe($.newer(path.img.dest))
		.pipe($.imagemin({
			progressive: true,
			interlaced: true,
			multipass: true,
			svgoPlugins: [{
				removeUselessDefs: false,
				removeHiddenElems: false,
				removeViewBox: false,
				cleanupIDs: false
			}]
		}))
		.pipe(gulp.dest(path.img.dest))
		.pipe($.size({title: 'img'}))
		.on('end', reload)
);

gulp.task('sprite', () =>
	gulp.src(path.sprite.src)
		.pipe($.changed('sprite'))
		.pipe($.plumber())
		.pipe($.svgSymbols({
			templates: ['default-svg'],
			transformData: function (svg, defaultData, options) {
				return {
					id: svg.originalAttributes.id || svg.id
				}
			}
		}))
		.pipe($.rename('sprite.svg'))
		.pipe($.size({title: 'sprite'}))
		.pipe(gulp.dest(path.sprite.dest))
		.on('end', reload)
);

gulp.task('copy', () =>
	gulp.src(path.copy.src)
		.pipe($.newer(path.copy.dest))
		.pipe(gulp.dest(path.dest))
		.pipe($.size({title: 'copy'}))
		.on('end', reload)
);

gulp.task('clean', () => {
	del(path.dest)
});

gulp.task('serve', () =>
	server.init({
		server: {
			baseDir: path.dest
		}
	})
);

gulp.task('watch', function () {
	function watch (type) {
		$.watch(path[type].watch, () => {
			var task = gulp.start(type);

			if (type === 'sprite') {
				setTimeout(function() {
					gulp.start('html');
				}, 1000);
			}
		});
	}

	watch('html');
	watch('css');
	watch('img');
	watch('sprite');
	watch('copy');
});

gulp.task('build', ['html', 'css', 'img', 'sprite', 'copy']);

gulp.task('dist', () => {
	dev = false;
	gulp.start('build');
});

gulp.task('default', () => {
	var startTime = Date.now();
	runSequence('build', 'serve', 'watch', () => {
		console.log('\x1b[42m************************************\x1b[0m\n');
		console.log('\x1b[32m  Mantis Starter is ready to work!\x1b[0m\n');
		console.log('\x1b[42m************************************\x1b[0m\n');
		console.log('[\x1b[32mMantis Starter\x1b[0m]', `All finished in \x1b[35m${Date.now() - startTime} ms` ,'\x1b[0m\n');
	});
});
