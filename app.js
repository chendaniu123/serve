var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//引入路由
var indexRouter = require('./routes/index');

var accountRouter = require('./routes/account');
//引入longin路由
var loginRouter = require('./routes/login');
//引入goods路由
//var goodsRouter = require('./routes/goods');

//引入路由

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//分配路由
app.use('/', indexRouter);

app.use('/account', accountRouter);
//分配login路由
app.use('/login', loginRouter);
//分配goods路由
//app.use('/goods', goodsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//监听端口
app.listen(5000, () => {
    console.log("服务器启动成功,地址是：http://172.16.11.197:5000");

})

module.exports = app;